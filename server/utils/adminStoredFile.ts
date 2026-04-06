import { createError } from 'h3'
import { access, copyFile, mkdir, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve, sep } from 'node:path'
import { createId } from '@paralleldrive/cuid2'
import { slugify } from './slug'
import { logWarn } from './logger'

export const ADMIN_ASSET_ROUTE_BASE = '/api/admin/assets'
export const TEMP_ADMIN_ASSET_BASE_PATH = `${ADMIN_ASSET_ROUTE_BASE}/tmp`
export const INACTIVE_ADMIN_ASSET_BASE_PATH = `${ADMIN_ASSET_ROUTE_BASE}/inactive`

const ADMIN_ASSET_STORAGE_ROOT = resolve(process.cwd(), '.data/admin-assets')
const TEMP_CLEANUP_MARKER_FILENAME = '.last-cleanup'
const TEMP_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000
const MAX_FILENAME_COLLISION_ATTEMPTS = 100

interface SaveTemporaryAdminFileOptions {
  data: Buffer
  extension: string
}

interface FinalizeAdminFileOptions {
  storagePath: string
  uploadDir: string
  publicPath: string
  slug?: string
  fallbackBaseName?: string
  replaceStoragePath?: string | null
  publish?: boolean
  protectedPublicPaths?: string[]
}

interface DeleteAdminStoredFileOptions {
  storagePath: string
  allowedPublicPathPrefixes: string[]
  protectedPublicPaths?: string[]
}

async function fileExists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function resolveInternalAbsolutePath(storagePath: string) {
  const normalizedStoragePath = storagePath.trim()
  const relativeStoragePath = normalizedStoragePath.startsWith(`${ADMIN_ASSET_ROUTE_BASE}/`)
    ? normalizedStoragePath.slice(ADMIN_ASSET_ROUTE_BASE.length + 1)
    : ''

  if (!relativeStoragePath) {
    throw createError({ statusCode: 400, message: 'La ruta del archivo no es válida' })
  }

  const absolutePath = resolve(ADMIN_ASSET_STORAGE_ROOT, relativeStoragePath)

  if (
    absolutePath !== ADMIN_ASSET_STORAGE_ROOT &&
    !absolutePath.startsWith(`${ADMIN_ASSET_STORAGE_ROOT}${sep}`)
  ) {
    throw createError({ statusCode: 400, message: 'La ruta del archivo no es válida' })
  }

  return absolutePath
}

function resolvePublicAbsolutePath(storagePath: string) {
  const normalizedStoragePath = storagePath.trim()
  const publicRoot = resolve(process.cwd(), 'public')
  const absolutePath = resolve(publicRoot, `.${normalizedStoragePath}`)

  if (absolutePath !== publicRoot && !absolutePath.startsWith(`${publicRoot}${sep}`)) {
    throw createError({ statusCode: 400, message: 'La ruta del archivo no es válida' })
  }

  return absolutePath
}

function resolveRelativeFilename(storagePath: string | null | undefined, publicPath: string) {
  const normalizedStoragePath = storagePath?.trim()

  if (!normalizedStoragePath || !normalizedStoragePath.startsWith(`${publicPath}/`)) {
    return ''
  }

  return normalizedStoragePath.slice(publicPath.length + 1)
}

function resolveInactiveRelativeFilename(
  storagePath: string | null | undefined,
  publicPath: string
) {
  const normalizedStoragePath = storagePath?.trim()
  const inactiveBasePath = `${INACTIVE_ADMIN_ASSET_BASE_PATH}${publicPath}`

  if (!normalizedStoragePath || !normalizedStoragePath.startsWith(`${inactiveBasePath}/`)) {
    return ''
  }

  return normalizedStoragePath.slice(inactiveBasePath.length + 1)
}

export function isTemporaryAdminStoragePath(storagePath: string) {
  return storagePath.trim().startsWith(`${TEMP_ADMIN_ASSET_BASE_PATH}/`)
}

export function isInactiveAdminStoragePath(storagePath: string) {
  return storagePath.trim().startsWith(`${INACTIVE_ADMIN_ASSET_BASE_PATH}/`)
}

export function isInternalAdminStoragePath(storagePath: string) {
  return isTemporaryAdminStoragePath(storagePath) || isInactiveAdminStoragePath(storagePath)
}

export function resolveAdminStoredAbsolutePath(storagePath: string) {
  if (isInternalAdminStoragePath(storagePath)) {
    return resolveInternalAbsolutePath(storagePath)
  }

  return resolvePublicAbsolutePath(storagePath)
}

function buildInactiveStoragePath(publicPath: string, filename: string) {
  return `${INACTIVE_ADMIN_ASSET_BASE_PATH}${publicPath}/${filename}`
}

function resolveInactiveUploadDir(publicPath: string) {
  return resolve(ADMIN_ASSET_STORAGE_ROOT, 'inactive', publicPath.replace(/^\/+/, ''))
}

async function cleanupExpiredTempFiles(absoluteTempDir: string) {
  let entries: string[] = []
  let failedCleanupCount = 0

  try {
    entries = await readdir(absoluteTempDir)
  } catch {
    return
  }

  const expirationThreshold = Date.now() - TEMP_FILE_MAX_AGE_MS

  await Promise.all(
    entries.map(async (entry) => {
      if (entry === TEMP_CLEANUP_MARKER_FILENAME) {
        return
      }

      const absoluteEntryPath = join(absoluteTempDir, entry)

      try {
        const metadata = await stat(absoluteEntryPath)
        if (metadata.isFile() && metadata.mtimeMs < expirationThreshold) {
          await unlink(absoluteEntryPath)
        }
      } catch {
        failedCleanupCount++
      }
    })
  )

  if (failedCleanupCount > 0) {
    logWarn('admin-assets.temp-cleanup', { failedCleanupCount })
  }
}

async function runDailyTempCleanup(absoluteTempDir: string) {
  const absoluteCleanupMarkerPath = join(absoluteTempDir, TEMP_CLEANUP_MARKER_FILENAME)

  try {
    const markerMetadata = await stat(absoluteCleanupMarkerPath)
    if (markerMetadata.mtimeMs >= Date.now() - TEMP_FILE_MAX_AGE_MS) {
      return
    }
  } catch {
    // Run cleanup when the marker does not exist yet.
  }

  await cleanupExpiredTempFiles(absoluteTempDir)
  await writeFile(absoluteCleanupMarkerPath, new Date().toISOString())
}

export async function saveTemporaryAdminFile(options: SaveTemporaryAdminFileOptions) {
  const absoluteTempDir = resolve(ADMIN_ASSET_STORAGE_ROOT, 'tmp')
  const filename = `${createId().slice(0, 12)}${options.extension}`

  await mkdir(absoluteTempDir, { recursive: true })
  await runDailyTempCleanup(absoluteTempDir)
  await writeFile(join(absoluteTempDir, filename), options.data)

  return {
    storagePath: `${TEMP_ADMIN_ASSET_BASE_PATH}/${filename}`,
    outputFilename: filename,
  }
}

function resolveAdminFileSource(storagePath: string, publicPath: string) {
  if (isTemporaryAdminStoragePath(storagePath) || isInactiveAdminStoragePath(storagePath)) {
    return {
      absolutePath: resolveInternalAbsolutePath(storagePath),
      currentFilename: basename(storagePath),
      kind: isTemporaryAdminStoragePath(storagePath) ? 'temp' : 'inactive',
    }
  }

  const relativeFilename = resolveRelativeFilename(storagePath, publicPath)
  if (!relativeFilename || relativeFilename.includes('/')) {
    return null
  }

  return {
    absolutePath: resolvePublicAbsolutePath(storagePath),
    currentFilename: basename(relativeFilename),
    kind: 'public' as const,
  }
}

export async function finalizeAdminFile(options: FinalizeAdminFileOptions) {
  const normalizedStoragePath = options.storagePath.trim()
  const publish = options.publish ?? true
  if (options.protectedPublicPaths?.includes(normalizedStoragePath)) {
    return normalizedStoragePath
  }

  const sourceFile = resolveAdminFileSource(normalizedStoragePath, options.publicPath)
  if (!sourceFile || !(await fileExists(sourceFile.absolutePath))) {
    return normalizedStoragePath
  }

  const extension = extname(normalizedStoragePath).toLowerCase()
  const baseSlug =
    slugify(options.slug ?? '') ||
    slugify(basename(sourceFile.currentFilename, extension)) ||
    slugify(options.fallbackBaseName ?? '') ||
    'archivo'
  const absoluteUploadDir = publish
    ? join(process.cwd(), options.uploadDir)
    : resolveInactiveUploadDir(options.publicPath)
  const currentFilename = sourceFile.currentFilename
  const replaceFilename = basename(
    resolveRelativeFilename(options.replaceStoragePath, options.publicPath) ||
      resolveInactiveRelativeFilename(options.replaceStoragePath, options.publicPath)
  )

  await mkdir(absoluteUploadDir, { recursive: true })

  let candidateBaseSlug = baseSlug
  let suffix = 2
  let attempts = 0

  while (true) {
    attempts++
    if (attempts > MAX_FILENAME_COLLISION_ATTEMPTS) {
      throw createError({
        statusCode: 500,
        message: 'No se ha podido generar un nombre de archivo disponible',
      })
    }

    const candidateFilename = `${candidateBaseSlug}${extension}`

    if (candidateFilename === currentFilename || candidateFilename === replaceFilename) {
      break
    }

    if (!(await fileExists(join(absoluteUploadDir, candidateFilename)))) {
      break
    }

    candidateBaseSlug = `${baseSlug}-${suffix}`
    suffix++
  }

  const targetFilename = `${candidateBaseSlug}${extension}`
  const targetStoragePath = publish
    ? `${options.publicPath}/${targetFilename}`
    : buildInactiveStoragePath(options.publicPath, targetFilename)

  if (targetStoragePath === normalizedStoragePath) {
    return normalizedStoragePath
  }

  if (
    options.replaceStoragePath &&
    targetStoragePath === options.replaceStoragePath &&
    options.replaceStoragePath !== normalizedStoragePath
  ) {
    const replaceAbsolutePath = resolveAdminStoredAbsolutePath(options.replaceStoragePath)

    if (await fileExists(replaceAbsolutePath)) {
      await unlink(replaceAbsolutePath)
    }
  }

  const targetAbsolutePath = join(absoluteUploadDir, targetFilename)

  if (sourceFile.kind === 'public' && !publish) {
    await copyFile(sourceFile.absolutePath, targetAbsolutePath)
  } else {
    await rename(sourceFile.absolutePath, targetAbsolutePath)
  }

  return targetStoragePath
}

export async function deleteAdminStoredFile(options: DeleteAdminStoredFileOptions) {
  const normalizedStoragePath = options.storagePath.trim()
  if (!normalizedStoragePath.startsWith('/')) {
    return false
  }

  let absolutePath: string

  if (isInternalAdminStoragePath(normalizedStoragePath)) {
    absolutePath = resolveInternalAbsolutePath(normalizedStoragePath)
  } else {
    if (
      !options.allowedPublicPathPrefixes.some((prefix) => normalizedStoragePath.startsWith(prefix))
    ) {
      return false
    }

    if (options.protectedPublicPaths?.includes(normalizedStoragePath)) {
      return false
    }

    absolutePath = resolvePublicAbsolutePath(normalizedStoragePath)
  }

  try {
    await unlink(absolutePath)
    return true
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return false
    }

    throw error
  }
}
