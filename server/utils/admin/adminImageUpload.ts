import { createError } from 'h3'
import createDOMPurify, { type WindowLike } from 'dompurify'
import { DOMParser, parseHTML } from 'linkedom'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'
import { slugify } from '../core/slug'
import { finalizeAdminFile, saveTemporaryAdminFile } from './adminStoredFile'
import { logError } from '../core/logger'

export const ALLOWED_ADMIN_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.avif',
] as const

const VECTOR_IMAGE_EXTENSIONS = new Set(['.svg'])
const OUTPUT_IMAGE_EXTENSIONS = new Set([...ALLOWED_ADMIN_IMAGE_EXTENSIONS, '.webp'])
const OUTPUT_IMAGE_EXTENSION_LIST = Array.from(OUTPUT_IMAGE_EXTENSIONS)
// 5000px per side covers high-resolution editorial assets while bounding upload latency.
const MAX_RASTER_IMAGE_DIMENSION = 5000
// ~80MP total pixel cap across all frames; prevents memory exhaustion during Sharp processing
const MAX_RASTER_IMAGE_PIXELS = 80_000_000
// 100 frame limit for animated GIFs/WebP; prevents CPU exhaustion on crafted animations
const MAX_RASTER_IMAGE_FRAMES = 100

const svgSanitizerWindow = parseHTML('<!doctype html><html><body></body></html>')
const svgPurifier = createDOMPurify(svgSanitizerWindow as unknown as WindowLike)
const blockedSvgTags = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'set',
  'animate',
  'animatetransform',
  'animatemotion',
  'handler',
])
const svgReferenceAttributes = new Set(['href', 'xlink:href', 'src'])
type SanitizedSvgElement = {
  tagName: string
  getAttributeNames: () => string[]
  getAttribute: (name: string) => string | null
  removeAttribute: (name: string) => void
}

const hasUnsafeSvgReference = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  return !normalized.startsWith('#')
}

const hasUnsafeCssReference = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  if (
    normalized.includes('@import') ||
    normalized.includes('expression(') ||
    normalized.includes('javascript:') ||
    normalized.includes('data:')
  ) {
    return true
  }

  let cursor = normalized.indexOf('url(')

  while (cursor !== -1) {
    const closingIndex = normalized.indexOf(')', cursor + 4)
    if (closingIndex === -1) {
      return true
    }

    const rawTarget = normalized.slice(cursor + 4, closingIndex).trim()
    const target = rawTarget.replaceAll('"', '').replaceAll("'", '')
    if (target && !target.startsWith('#')) {
      return true
    }

    cursor = normalized.indexOf('url(', closingIndex + 1)
  }

  return false
}

const invalidSvgError = () =>
  createError({
    statusCode: 400,
    message: 'El SVG subido no es válido',
  })

const disallowedSvgError = () =>
  createError({
    statusCode: 400,
    message: 'El SVG contiene elementos no permitidos',
  })

const invalidRasterImageError = (reason: string) =>
  createError({
    statusCode: 400,
    message: `La imagen subida no es válida (${reason})`,
  })

function validateRasterImageMetadata(metadata: sharp.Metadata) {
  const width = metadata.width
  const height = metadata.height

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw invalidRasterImageError('dimensiones no válidas')
  }

  if (width > MAX_RASTER_IMAGE_DIMENSION || height > MAX_RASTER_IMAGE_DIMENSION) {
    throw invalidRasterImageError(
      `dimensiones demasiado grandes (máximo ${MAX_RASTER_IMAGE_DIMENSION}px por lado)`
    )
  }

  const frames = metadata.pages ?? 1
  if (!Number.isInteger(frames) || frames <= 0) {
    throw invalidRasterImageError('número de fotogramas no válido')
  }

  if (frames > MAX_RASTER_IMAGE_FRAMES) {
    throw invalidRasterImageError(`demasiados fotogramas (máximo ${MAX_RASTER_IMAGE_FRAMES})`)
  }

  const totalPixels = width * height * frames
  if (totalPixels > MAX_RASTER_IMAGE_PIXELS) {
    throw invalidRasterImageError('demasiados píxeles para procesar de forma segura')
  }
}

function sanitizeSvgContent(data: Buffer): Buffer {
  const source = data.toString('utf8').trim()

  if (!source) {
    throw invalidSvgError()
  }

  const sanitized = svgPurifier.sanitize(source, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: Array.from(blockedSvgTags),
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    RETURN_TRUSTED_TYPE: false,
  }) as string

  if (!sanitized.trim()) {
    throw invalidSvgError()
  }

  let svgDocument: ReturnType<DOMParser['parseFromString']>

  try {
    svgDocument = new DOMParser().parseFromString(sanitized, 'image/svg+xml')
  } catch {
    throw invalidSvgError()
  }

  if (svgDocument.querySelector('parsererror')) {
    throw invalidSvgError()
  }

  const rootElement = svgDocument.documentElement
  if (!rootElement || rootElement.tagName.toLowerCase() !== 'svg') {
    throw invalidSvgError()
  }

  for (const element of Array.from(svgDocument.querySelectorAll('*')) as SanitizedSvgElement[]) {
    const tagName = element.tagName.toLowerCase()
    if (blockedSvgTags.has(tagName)) {
      throw disallowedSvgError()
    }

    for (const attributeName of element.getAttributeNames()) {
      const normalizedAttributeName = attributeName.toLowerCase()
      const attributeValue = element.getAttribute(attributeName)?.trim() ?? ''

      if (normalizedAttributeName.startsWith('on')) {
        element.removeAttribute(attributeName)
        continue
      }

      if (
        svgReferenceAttributes.has(normalizedAttributeName) &&
        hasUnsafeSvgReference(attributeValue)
      ) {
        element.removeAttribute(attributeName)
        continue
      }

      if (
        (normalizedAttributeName === 'style' ||
          normalizedAttributeName === 'fill' ||
          normalizedAttributeName === 'filter' ||
          normalizedAttributeName === 'clip-path' ||
          normalizedAttributeName === 'mask' ||
          normalizedAttributeName === 'marker-start' ||
          normalizedAttributeName === 'marker-mid' ||
          normalizedAttributeName === 'marker-end') &&
        hasUnsafeCssReference(attributeValue)
      ) {
        element.removeAttribute(attributeName)
      }
    }
  }

  const serializedSvg = rootElement.outerHTML

  if (!serializedSvg.trim()) {
    throw invalidSvgError()
  }

  return Buffer.from(serializedSvg, 'utf8')
}

interface SaveAdminImageOptions {
  data: Buffer
  filename: string
  uploadDir: string
  publicPath: string
  maxFileSizeBytes?: number
  slug?: string
  temporary?: boolean
}

// 5MB default upload cap; individual endpoints can override with maxFileSizeBytes
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024

async function convertRasterImageToWebp(data: Buffer) {
  const metadata = await sharp(data, { animated: true }).metadata()
  validateRasterImageMetadata(metadata)

  try {
    return await sharp(data, {
      animated: true,
      limitInputPixels: MAX_RASTER_IMAGE_PIXELS,
    })
      .rotate()
      .webp({ quality: 82 })
      .toBuffer()
  } catch (error) {
    logError('admin-image-upload.convert-raster', error)
    throw createError({
      statusCode: 400,
      message: 'La imagen subida no se ha podido procesar',
    })
  }
}

async function isBaseSlugTaken(absoluteUploadDir: string, candidateBaseSlug: string) {
  for (const extension of OUTPUT_IMAGE_EXTENSION_LIST) {
    try {
      await access(join(absoluteUploadDir, `${candidateBaseSlug}${extension}`))
      return true
    } catch {
      // No file for this candidate extension.
    }
  }

  return false
}

export async function saveAdminImage(options: SaveAdminImageOptions) {
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE

  if (options.data.length > maxFileSizeBytes) {
    throw createError({ statusCode: 400, message: 'El archivo supera el tamaño máximo (5MB)' })
  }

  const originalExtension = extname(options.filename).toLowerCase()

  if (
    !ALLOWED_ADMIN_IMAGE_EXTENSIONS.includes(
      originalExtension as (typeof ALLOWED_ADMIN_IMAGE_EXTENSIONS)[number]
    )
  ) {
    throw createError({
      statusCode: 400,
      message: `Formato no permitido. Formatos admitidos: ${ALLOWED_ADMIN_IMAGE_EXTENSIONS.join(', ')}`,
    })
  }

  const requestedSlug = options.slug ? slugify(options.slug) : ''
  const originalNameSlug = slugify(basename(options.filename, originalExtension))
  const baseSlug = requestedSlug || originalNameSlug || 'imagen'
  const isVector = VECTOR_IMAGE_EXTENSIONS.has(originalExtension)
  const outputExtension = isVector ? '.svg' : '.webp'
  const absoluteUploadDir = join(process.cwd(), options.uploadDir)
  const outputData = isVector
    ? sanitizeSvgContent(options.data)
    : await convertRasterImageToWebp(options.data)

  if (options.temporary) {
    return saveTemporaryAdminFile({
      data: outputData,
      extension: outputExtension,
    })
  }

  await mkdir(absoluteUploadDir, { recursive: true })

  let resolvedBaseSlug = baseSlug
  if (await isBaseSlugTaken(absoluteUploadDir, resolvedBaseSlug)) {
    let suffix = 2

    while (await isBaseSlugTaken(absoluteUploadDir, `${baseSlug}-${suffix}`)) {
      suffix++
    }

    resolvedBaseSlug = `${baseSlug}-${suffix}`
  }

  const outputFilename = `${resolvedBaseSlug}${outputExtension}`

  await writeFile(join(absoluteUploadDir, outputFilename), outputData)

  return {
    storagePath: `${options.publicPath}/${outputFilename}`,
    outputFilename,
    outputExtension,
  }
}

interface FinalizeAdminImageOptions {
  storagePath: string
  uploadDir: string
  publicPath: string
  slug?: string
  fallbackBaseName?: string
  replaceStoragePath?: string | null
  publish?: boolean
  protectedPublicPaths?: string[]
}

export function finalizeAdminImage(options: FinalizeAdminImageOptions) {
  return finalizeAdminFile({
    ...options,
    fallbackBaseName: options.fallbackBaseName ?? 'imagen',
  })
}
