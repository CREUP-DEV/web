import { createError } from 'h3'
import { access, copyFile, mkdir, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, posix, resolve, sep } from 'node:path'
import { createId } from '@paralleldrive/cuid2'
import { hasAdminStoredFileReference } from './adminAssetReferences'
import { slugify } from '../core/slug'
import { logWarn } from '../core/logger'
import { getDefaultAdminApiErrorMessage } from '../locale/adminApiErrorMessages'

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

function isCrossDeviceRenameError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'EXDEV'
}

async function moveFileSafely(sourceAbsolutePath: string, targetAbsolutePath: string) {
  try {
    await rename(sourceAbsolutePath, targetAbsolutePath)
    return
  } catch (error) {
    if (!isCrossDeviceRenameError(error)) {
      throw error
    }
  }

  const targetDirectory = dirname(targetAbsolutePath)
  const targetBasename = basename(targetAbsolutePath)
  const temporaryTargetAbsolutePath = join(
    targetDirectory,
    `.${targetBasename}.${createId().slice(0, 12)}.tmp`
  )

  await copyFile(sourceAbsolutePath, temporaryTargetAbsolutePath)

  try {
    await rename(temporaryTargetAbsolutePath, targetAbsolutePath)
  } catch (error) {
    try {
      await unlink(temporaryTargetAbsolutePath)
    } catch {
      // Best-effort cleanup for failed cross-device moves.
    }

    throw error
  }

  try {
    await unlink(sourceAbsolutePath)
  } catch (error) {
    logWarn('admin-assets.cross-device-source-cleanup-failed', {
      sourceAbsolutePath,
      targetAbsolutePath,
      error,
    })
  }
}

export function normalizeAdminStoredPath(storagePath: string) {
  const trimmedStoragePath = storagePath.trim()

  if (!trimmedStoragePath) {
    return ''
  }

  const normalizedStoragePath = posix.normalize(trimmedStoragePath)

  return normalizedStoragePath.startsWith('/') ? normalizedStoragePath : `/${normalizedStoragePath}`
}

function resolveInternalAbsolutePath(storagePath: string) {
  const normalizedStoragePath = normalizeAdminStoredPath(storagePath)
  const relativeStoragePath = normalizedStoragePath.startsWith(`${ADMIN_ASSET_ROUTE_BASE}/`)
    ? normalizedStoragePath.slice(ADMIN_ASSET_ROUTE_BASE.length + 1)
    : ''

  if (!relativeStoragePath) {
    throw createError({
      statusCode: 400,
      message: getDefaultAdminApiErrorMessage('assetInvalidPath'),
    })
  }

  const absolutePath = resolve(ADMIN_ASSET_STORAGE_ROOT, relativeStoragePath)

  if (
    absolutePath !== ADMIN_ASSET_STORAGE_ROOT &&
    !absolutePath.startsWith(`${ADMIN_ASSET_STORAGE_ROOT}${sep}`)
  ) {
    throw createError({
      statusCode: 400,
      message: getDefaultAdminApiErrorMessage('assetInvalidPath'),
    })
  }

  return absolutePath
}

function resolvePublicAbsolutePath(storagePath: string) {
  const normalizedStoragePath = normalizeAdminStoredPath(storagePath)
  const publicRoot = resolve(process.cwd(), 'public')
  const absolutePath = resolve(publicRoot, `.${normalizedStoragePath}`)

  if (absolutePath !== publicRoot && !absolutePath.startsWith(`${publicRoot}${sep}`)) {
    throw createError({
      statusCode: 400,
      message: getDefaultAdminApiErrorMessage('assetInvalidPath'),
    })
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

export function isTemporaryAdminStoragePath(storagePath: string) {
  return normalizeAdminStoredPath(storagePath).startsWith(`${TEMP_ADMIN_ASSET_BASE_PATH}/`)
}

export function isInactiveAdminStoragePath(storagePath: string) {
  return normalizeAdminStoredPath(storagePath).startsWith(`${INACTIVE_ADMIN_ASSET_BASE_PATH}/`)
}

export function isInternalAdminStoragePath(storagePath: string) {
  return isTemporaryAdminStoragePath(storagePath) || isInactiveAdminStoragePath(storagePath)
}

export function resolveAdminStoredAbsolutePath(storagePath: string) {
  const normalizedStoragePath = normalizeAdminStoredPath(storagePath)

  if (isInternalAdminStoragePath(normalizedStoragePath)) {
    return resolveInternalAbsolutePath(storagePath)
  }

  return resolvePublicAbsolutePath(normalizedStoragePath)
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

  const getFileAgeMs = (metadata: NonNullable<Awaited<ReturnType<typeof stat>>>) => metadata.mtimeMs

  await Promise.all(
    entries.map(async (entry) => {
      if (entry === TEMP_CLEANUP_MARKER_FILENAME) {
        return
      }

      const absoluteEntryPath = join(absoluteTempDir, entry)

      try {
        const metadata = await stat(absoluteEntryPath)
        if (metadata.isFile() && getFileAgeMs(metadata) < expirationThreshold) {
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
    throw createError({
      statusCode: 400,
      message: getDefaultAdminApiErrorMessage('assetInvalidPath'),
    })
  }

  return {
    absolutePath: resolvePublicAbsolutePath(storagePath),
    currentFilename: basename(relativeFilename),
    kind: 'public' as const,
  }
}

async function resolveAdminReplacementFilename(
  storagePath: string | null | undefined,
  publicPath: string
) {
  const normalizedStoragePath = storagePath?.trim()

  if (!normalizedStoragePath) {
    return ''
  }

  // Do not skip "protected" paths here: the canonical filename may match a shipped default
  // asset (same public path). We still need the basename so finalize can replace-in-place
  // instead of suffixing (e.g. banner-que-es-creup-2.webp).

  const isInternalStoragePath =
    isTemporaryAdminStoragePath(normalizedStoragePath) ||
    isInactiveAdminStoragePath(normalizedStoragePath)

  const relativeFilename = isInternalStoragePath
    ? basename(normalizedStoragePath)
    : resolveRelativeFilename(normalizedStoragePath, publicPath)

  // Ignore legacy or out-of-scope paths. Replacement filename is best-effort and
  // should not block new uploads when an old DB value uses a different base path.
  if (!relativeFilename) {
    return ''
  }

  if (!isInternalStoragePath && relativeFilename.includes('/')) {
    return ''
  }

  const absolutePath = isInternalStoragePath
    ? resolveInternalAbsolutePath(normalizedStoragePath)
    : resolvePublicAbsolutePath(normalizedStoragePath)

  if (!(await fileExists(absolutePath))) {
    return ''
  }

  return basename(relativeFilename)
}

async function removeUnreferencedConflictingFile(options: {
  absoluteUploadDir: string
  candidateFilename: string
  publicPath: string
  publish: boolean
}) {
  const candidateStoragePath = options.publish
    ? `${options.publicPath}/${options.candidateFilename}`
    : buildInactiveStoragePath(options.publicPath, options.candidateFilename)

  if (await hasAdminStoredFileReference(candidateStoragePath)) {
    return false
  }

  try {
    await unlink(join(options.absoluteUploadDir, options.candidateFilename))
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return true
    }

    throw error
  }

  return true
}

export async function finalizeAdminFile(options: FinalizeAdminFileOptions) {
  const normalizedStoragePath = options.storagePath.trim()
  const publish = options.publish ?? true
  if (options.protectedPublicPaths?.includes(normalizedStoragePath)) {
    return normalizedStoragePath
  }

  const sourceFile = resolveAdminFileSource(normalizedStoragePath, options.publicPath)
  if (!(await fileExists(sourceFile.absolutePath))) {
    throw createError({
      statusCode: 400,
      message: getDefaultAdminApiErrorMessage('assetUnavailable'),
    })
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
  const replaceFilename = await resolveAdminReplacementFilename(
    options.replaceStoragePath,
    options.publicPath
  )
  const shouldAvoidPublishedPathReuse =
    sourceFile.kind === 'temp' &&
    publish &&
    !!options.replaceStoragePath &&
    !isInternalAdminStoragePath(options.replaceStoragePath)

  await mkdir(absoluteUploadDir, { recursive: true })

  let candidateBaseSlug = baseSlug
  let suffix = 2
  let attempts = 0

  while (true) {
    attempts++
    if (attempts > MAX_FILENAME_COLLISION_ATTEMPTS) {
      throw createError({
        statusCode: 500,
        message: getDefaultAdminApiErrorMessage('filenameUnavailable'),
      })
    }

    const candidateFilename = `${candidateBaseSlug}${extension}`

    if (candidateFilename === currentFilename) {
      break
    }

    if (candidateFilename === replaceFilename) {
      if (!shouldAvoidPublishedPathReuse) {
        break
      }

      candidateBaseSlug = `${baseSlug}-${suffix}`
      suffix++
      continue
    }

    const candidateAbsolutePath = join(absoluteUploadDir, candidateFilename)

    if (!(await fileExists(candidateAbsolutePath))) {
      break
    }

    if (
      await removeUnreferencedConflictingFile({
        absoluteUploadDir,
        candidateFilename,
        publicPath: options.publicPath,
        publish,
      })
    ) {
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
    await moveFileSafely(sourceFile.absolutePath, targetAbsolutePath)
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
