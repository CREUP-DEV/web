import { createError } from 'h3'
import { constants as fsConstants } from 'node:fs'
import { access, copyFile, link, mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, posix, resolve, sep } from 'node:path'
import { createId } from '@paralleldrive/cuid2'
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
  /**
   * The record's current file. Finalize never touches it (the row points at it until the caller
   * commits); it only keeps a new upload from reusing its published URL. The caller removes it
   * after commit.
   */
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

function getErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
}

/**
 * `link()` failures that mean these two paths cannot share an inode (different devices, as the
 * uploads volume and the internal store usually are, or a filesystem without hard links), rather
 * than that the target name is taken.
 */
const HARD_LINK_UNAVAILABLE_ERROR_CODES = new Set([
  'EXDEV',
  'EPERM',
  'ENOTSUP',
  'EOPNOTSUPP',
  'ENOSYS',
  'EMLINK',
])

/**
 * Gives the source's content a second name, only if nothing is stored under that name yet: returns
 * false when the target exists, and never overwrites it, so two requests can never end up sharing
 * (or clobbering) one file. A hard link claims the name atomically; where the paths cannot be
 * linked, an exclusive copy (COPYFILE_EXCL) claims it just as atomically.
 */
async function placeFileExclusively(sourceAbsolutePath: string, targetAbsolutePath: string) {
  try {
    await link(sourceAbsolutePath, targetAbsolutePath)
    return true
  } catch (error) {
    if (getErrorCode(error) === 'EEXIST') {
      return false
    }

    if (!HARD_LINK_UNAVAILABLE_ERROR_CODES.has(String(getErrorCode(error)))) {
      throw error
    }
  }

  try {
    await copyFile(sourceAbsolutePath, targetAbsolutePath, fsConstants.COPYFILE_EXCL)
    return true
  } catch (error) {
    if (getErrorCode(error) === 'EEXIST') {
      return false
    }

    throw error
  }
}

/** Drops the old name of a file that now lives at `targetAbsolutePath` too. */
async function removeMovedSource(sourceAbsolutePath: string, targetAbsolutePath: string) {
  try {
    await unlink(sourceAbsolutePath)
  } catch (error) {
    if (getErrorCode(error) === 'ENOENT') {
      return
    }

    // The content is safe under its new name; a temporary leftover is swept within a day.
    logWarn('admin-assets.move-source-cleanup-failed', {
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
  // asset (same public path), and finalize still needs the basename to avoid reusing it.

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

/**
 * Gives a stored file its final name (from `slug`) in the public folder, or in the inactive store
 * when `publish` is false, and returns its new storage path.
 *
 * It never deletes or overwrites a file a row may still point at, because it runs before the
 * caller's transaction commits:
 * - A temporary upload is moved: nothing but the submitting form refers to it, and a failed save
 *   moves it back (`cleanupAdminAssetFinalizationsSafely`).
 * - Any other source (the record's current file, on a rename or a publish toggle) is copied. The
 *   original stays where the DB says it is until the caller removes it after commit, once nothing
 *   references it; a failed save just drops the copy.
 * - A name already in use (another record, a concurrent request that has not committed yet, an
 *   orphan, the record's own current file) is skipped for the next `-N` suffix, never reclaimed.
 *   The claim itself is atomic, so two requests cannot both get one name.
 */
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
  const sourceAbsolutePath = resolve(sourceFile.absolutePath)
  // A new upload never takes over the URL the file it replaces was published at, so no cache
  // (browser, CDN, IPX) keeps serving the old content under it once that file is removed.
  const shouldAvoidPublishedPathReuse =
    sourceFile.kind === 'temp' &&
    publish &&
    !!options.replaceStoragePath &&
    !isInternalAdminStoragePath(options.replaceStoragePath)
  const replaceFilename = shouldAvoidPublishedPathReuse
    ? await resolveAdminReplacementFilename(options.replaceStoragePath, options.publicPath)
    : ''

  await mkdir(absoluteUploadDir, { recursive: true })

  for (let attempt = 0; attempt < MAX_FILENAME_COLLISION_ATTEMPTS; attempt++) {
    const candidateFilename = `${attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`}${extension}`
    const candidateAbsolutePath = resolve(absoluteUploadDir, candidateFilename)

    // Already stored under this name in this folder.
    if (candidateAbsolutePath === sourceAbsolutePath) {
      return normalizedStoragePath
    }

    if (shouldAvoidPublishedPathReuse && candidateFilename === replaceFilename) {
      continue
    }

    if (!(await placeFileExclusively(sourceAbsolutePath, candidateAbsolutePath))) {
      continue
    }

    if (sourceFile.kind === 'temp') {
      await removeMovedSource(sourceAbsolutePath, candidateAbsolutePath)
    }

    return publish
      ? `${options.publicPath}/${candidateFilename}`
      : buildInactiveStoragePath(options.publicPath, candidateFilename)
  }

  throw createError({
    statusCode: 500,
    message: getDefaultAdminApiErrorMessage('filenameUnavailable'),
  })
}

/**
 * Undoes the move of a temporary upload: gives the finalized file back its temporary path, so the
 * form that still holds that path can be submitted again after a failed save. Leaves the finalized
 * name in place (the caller deletes it once it has checked nothing references it). Returns false
 * when there is nothing to restore or the temporary path is already taken (the upload is still
 * there, e.g. its old name could not be dropped).
 */
export async function restoreAdminStoredFileToTemporaryPath(
  storagePath: string,
  temporaryStoragePath: string
) {
  if (!isTemporaryAdminStoragePath(temporaryStoragePath)) {
    return false
  }

  const absolutePath = resolveAdminStoredAbsolutePath(storagePath)
  const temporaryAbsolutePath = resolveInternalAbsolutePath(temporaryStoragePath)

  await mkdir(dirname(temporaryAbsolutePath), { recursive: true })

  try {
    return await placeFileExclusively(absolutePath, temporaryAbsolutePath)
  } catch (error) {
    if (getErrorCode(error) === 'ENOENT') {
      return false
    }

    throw error
  }
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
