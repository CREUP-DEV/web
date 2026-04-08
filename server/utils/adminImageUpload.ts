import { createError } from 'h3'
import createDOMPurify, { type WindowLike } from 'dompurify'
import { JSDOM } from 'jsdom'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { slugify } from './slug'
import { finalizeAdminFile, saveTemporaryAdminFile } from './adminStoredFile'
import { logError } from './logger'

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

const svgPurifier = createDOMPurify(new JSDOM('').window as unknown as WindowLike)
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
type SvgDocument = JSDOM['window']['document']
type SvgElement = InstanceType<JSDOM['window']['Element']>

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

  let svgDocument: SvgDocument

  try {
    svgDocument = new JSDOM(sanitized, { contentType: 'image/svg+xml' }).window.document
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

  for (const element of Array.from(svgDocument.querySelectorAll('*')) as SvgElement[]) {
    const tagName = element.tagName.toLowerCase()
    if (blockedSvgTags.has(tagName)) {
      throw disallowedSvgError()
    }

    for (const attributeName of element.getAttributeNames() as string[]) {
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

  const serializedSvg = new svgDocument.defaultView!.XMLSerializer().serializeToString(rootElement)

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

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024

async function convertRasterImageToWebp(data: Buffer) {
  let sharp: typeof import('sharp')

  try {
    const sharpModule = await import('sharp')
    sharp = sharpModule.default
  } catch (error) {
    logError('admin-image-upload.load-sharp', error)
    throw createError({
      statusCode: 500,
      message: 'No se ha podido procesar la imagen subida',
    })
  }

  try {
    return await sharp(data, { animated: true }).rotate().webp({ quality: 82 }).toBuffer()
  } catch (error) {
    logError('admin-image-upload.convert-raster', error)
    throw createError({
      statusCode: 400,
      message: 'La imagen subida no se ha podido procesar',
    })
  }
}

function matchesBaseSlug(filename: string, baseSlug: string) {
  return OUTPUT_IMAGE_EXTENSION_LIST.some((extension) => filename === `${baseSlug}${extension}`)
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
  const existingFiles = await readdir(absoluteUploadDir)
  const isBaseSlugTaken = (candidateBaseSlug: string) =>
    existingFiles.some((candidate) => matchesBaseSlug(candidate, candidateBaseSlug))

  let resolvedBaseSlug = baseSlug
  if (isBaseSlugTaken(resolvedBaseSlug)) {
    let suffix = 2

    while (isBaseSlugTaken(`${baseSlug}-${suffix}`)) {
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
