import { createError, type H3Event } from 'h3'
import createDOMPurify, { type WindowLike } from 'dompurify'
import { DOMParser, parseHTML } from 'linkedom'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'
import { slugify } from '../core/slug'
import { finalizeAdminFile, saveTemporaryAdminFile } from './adminStoredFile'
import { logError } from '../core/logger'
import { resolveAdminApiMessage } from '../locale/adminApiErrorMessages'

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

const invalidSvgError = (event?: H3Event) =>
  createError({
    statusCode: 400,
    message: resolveAdminApiMessage('svgInvalid', event),
  })

const disallowedSvgError = (event?: H3Event) =>
  createError({
    statusCode: 400,
    message: resolveAdminApiMessage('svgForbidden', event),
  })

const invalidRasterImageError = (reason: string, event?: H3Event) => {
  logError('admin-image-upload.raster', new Error(reason))
  return createError({
    statusCode: 400,
    message: resolveAdminApiMessage('rasterImageInvalid', event),
  })
}

function validateRasterImageMetadata(metadata: sharp.Metadata, event?: H3Event) {
  const width = metadata.width
  const height = metadata.height

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw invalidRasterImageError('dimensiones no válidas', event)
  }

  if (width > MAX_RASTER_IMAGE_DIMENSION || height > MAX_RASTER_IMAGE_DIMENSION) {
    throw invalidRasterImageError(
      `dimensiones demasiado grandes (máximo ${MAX_RASTER_IMAGE_DIMENSION}px por lado)`,
      event
    )
  }

  const frames = metadata.pages ?? 1
  if (!Number.isInteger(frames) || frames <= 0) {
    throw invalidRasterImageError('número de fotogramas no válido', event)
  }

  if (frames > MAX_RASTER_IMAGE_FRAMES) {
    throw invalidRasterImageError(
      `demasiados fotogramas (máximo ${MAX_RASTER_IMAGE_FRAMES})`,
      event
    )
  }

  const totalPixels = width * height * frames
  if (totalPixels > MAX_RASTER_IMAGE_PIXELS) {
    throw invalidRasterImageError('demasiados píxeles para procesar de forma segura', event)
  }
}

function sanitizeSvgContent(data: Buffer, event?: H3Event): Buffer {
  const source = data.toString('utf8').trim()

  if (!source) {
    throw invalidSvgError(event)
  }

  const sanitized = svgPurifier.sanitize(source, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: Array.from(blockedSvgTags),
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    RETURN_TRUSTED_TYPE: false,
  }) as string

  if (!sanitized.trim()) {
    throw invalidSvgError(event)
  }

  let svgDocument: ReturnType<DOMParser['parseFromString']>

  try {
    svgDocument = new DOMParser().parseFromString(sanitized, 'image/svg+xml')
  } catch {
    throw invalidSvgError(event)
  }

  if (svgDocument.querySelector('parsererror')) {
    throw invalidSvgError(event)
  }

  const rootElement = svgDocument.documentElement
  if (!rootElement || rootElement.tagName.toLowerCase() !== 'svg') {
    throw invalidSvgError(event)
  }

  for (const element of Array.from(svgDocument.querySelectorAll('*')) as SanitizedSvgElement[]) {
    const tagName = element.tagName.toLowerCase()
    if (blockedSvgTags.has(tagName)) {
      throw disallowedSvgError(event)
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
    throw invalidSvgError(event)
  }

  return Buffer.from(serializedSvg, 'utf8')
}

interface SaveAdminImageOptions {
  data: Buffer
  filename: string
  uploadDir: string
  publicPath: string
  maxFileSizeBytes?: number
  outputFormat?: 'jpeg' | 'webp'
  slug?: string
  temporary?: boolean
  /** Request event for locale-aware error messages; falls back to es when omitted. */
  event?: H3Event
}

// 5MB default upload cap; individual endpoints can override with maxFileSizeBytes
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024

async function convertRasterImageToWebp(data: Buffer, event?: H3Event) {
  const metadata = await sharp(data, { animated: true }).metadata()
  validateRasterImageMetadata(metadata, event)

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
      message: resolveAdminApiMessage('imageProcessFailed', event),
    })
  }
}

async function convertImageToJpeg(data: Buffer, event?: H3Event) {
  const metadata = await sharp(data, { animated: false }).metadata()
  validateRasterImageMetadata(metadata, event)

  try {
    return await sharp(data, {
      animated: false,
      limitInputPixels: MAX_RASTER_IMAGE_PIXELS,
    })
      .rotate()
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer()
  } catch (error) {
    logError('admin-image-upload.convert-jpeg', error)
    throw createError({
      statusCode: 400,
      message: resolveAdminApiMessage('imageProcessFailed', event),
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
    throw createError({
      statusCode: 400,
      message: resolveAdminApiMessage('fileTooLargeMb', options.event).replace('{mb}', '5'),
    })
  }

  const originalExtension = extname(options.filename).toLowerCase()

  if (
    !ALLOWED_ADMIN_IMAGE_EXTENSIONS.includes(
      originalExtension as (typeof ALLOWED_ADMIN_IMAGE_EXTENSIONS)[number]
    )
  ) {
    throw createError({
      statusCode: 400,
      message: resolveAdminApiMessage('formatNotAllowed', options.event).replace(
        '{formats}',
        ALLOWED_ADMIN_IMAGE_EXTENSIONS.join(', ')
      ),
    })
  }

  const requestedSlug = options.slug ? slugify(options.slug) : ''
  const originalNameSlug = slugify(basename(options.filename, originalExtension))
  const baseSlug = requestedSlug || originalNameSlug || 'imagen'
  const isVector = VECTOR_IMAGE_EXTENSIONS.has(originalExtension)
  const outputFormat = options.outputFormat ?? 'webp'
  const outputExtension = outputFormat === 'jpeg' ? '.jpg' : isVector ? '.svg' : '.webp'
  const absoluteUploadDir = join(process.cwd(), options.uploadDir)
  const sanitizedData = isVector ? sanitizeSvgContent(options.data, options.event) : options.data
  const outputData =
    outputFormat === 'jpeg'
      ? await convertImageToJpeg(sanitizedData, options.event)
      : isVector
        ? sanitizedData
        : await convertRasterImageToWebp(sanitizedData, options.event)

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
