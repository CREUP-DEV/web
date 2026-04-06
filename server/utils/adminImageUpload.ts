import { createError } from 'h3'
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

// Dangerous SVG elements and attributes that can execute scripts or embed external content
const SVG_BLOCKED_ELEMENTS =
  /(<\/?)(script|foreignObject|iframe|object|embed|use|set|animate(?:Transform|Motion)?|handler)\b/gi
const SVG_BLOCKED_DECLARATIONS = /<!DOCTYPE[\s\S]*?>|<!ENTITY[\s\S]*?>/gi
const SVG_EVENT_ATTRIBUTES = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi
const SVG_HREF_SCRIPT = /\s+(xlink:)?href\s*=\s*(["'])\s*javascript:/gi
const SVG_DATA_URI_SCRIPT = /\s+(xlink:)?href\s*=\s*(["'])\s*data:\s*text\/html/gi
const SVG_DANGEROUS_PROTOCOL_REFERENCE =
  /\b(?:href|xlink:href|src)\s*=\s*(["'])\s*(?:javascript:|data:)/gi
const SVG_EXTERNAL_REFERENCE = /\b(?:href|xlink:href|src)\s*=\s*(["'])\s*(?:https?:)?\/\//gi
const SVG_URL_FUNCTION_REFERENCE = /\b(?:fill|filter|clip-path|mask)\s*=\s*(["'])\s*url\(\s*(?!#)/gi

function sanitizeSvgContent(data: Buffer): Buffer {
  let svg = data.toString('utf8')

  if (!/^\s*<svg\b/i.test(svg)) {
    throw createError({
      statusCode: 400,
      message: 'El SVG subido no es válido',
    })
  }

  // Strip dangerous elements
  svg = svg.replace(SVG_BLOCKED_DECLARATIONS, '')
  svg = svg.replace(SVG_BLOCKED_ELEMENTS, '<!-- blocked --')
  // Strip event handler attributes (onclick, onload, onerror, etc.)
  svg = svg.replace(SVG_EVENT_ATTRIBUTES, '')
  // Strip javascript: protocol in href attributes
  svg = svg.replace(SVG_HREF_SCRIPT, '')
  // Strip data:text/html in href attributes
  svg = svg.replace(SVG_DATA_URI_SCRIPT, '')
  svg = svg.replace(SVG_DANGEROUS_PROTOCOL_REFERENCE, '')
  // Strip external references to remote content
  svg = svg.replace(SVG_EXTERNAL_REFERENCE, '')
  svg = svg.replace(SVG_URL_FUNCTION_REFERENCE, '')

  if (
    /<\/?(script|foreignObject|iframe|object|embed)\b/i.test(svg) ||
    /\son[a-z]+\s*=/i.test(svg) ||
    /(?:href|xlink:href|src)\s*=\s*(["'])\s*(?:javascript:|data:)/i.test(svg) ||
    /\b(?:fill|filter|clip-path|mask)\s*=\s*(["'])\s*url\(\s*(?!#)/i.test(svg)
  ) {
    throw createError({
      statusCode: 400,
      message: 'El SVG contiene elementos no permitidos',
    })
  }

  return Buffer.from(svg, 'utf8')
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
