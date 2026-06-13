import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../external/externalAssetUrl'
import { saveAdminImage } from './adminImageUpload'
import { saveAdminDocument } from './adminDocumentUpload'
import { assertUploadRequestSize } from '../core/uploadRequestLimit'
import { getMultipartFileBuffer, validateMultipartFile } from '../validation'
import { getAdminApiErrorMessage } from '../locale/adminApiErrorMessages'

interface AdminUploadHandlerConfig {
  /** Directory under the project root, e.g. 'public/documentos/igualdad'. */
  uploadDir: string
  /** Public path prefix passed to the save helper, e.g. EQUALITY_DOCUMENTS_PUBLIC_PATH. */
  publicPath: string
  /** 'image' → saveAdminImage (temporary), 'pdf' → saveAdminDocument. */
  kind: 'image' | 'pdf'
  /** Hard request-size ceiling enforced before the body is read (DoS guard). */
  maxRequestBytes: number
}

/**
 * Single-asset admin upload endpoint: enforce the request-size ceiling, read and
 * validate one multipart file, persist it, and return { path, storagePath }.
 *
 * `path` is `toExternal{Image,Pdf}ProxyUrl(storagePath)`, which for a local upload
 * storagePath is the storagePath itself (the proxy only rewrites absolute external
 * URLs), so no `publicPathBase` is passed — it would be a no-op here.
 *
 * Scope: the single-file image/pdf endpoints only. Dual image-or-pdf (press,
 * newsletter) and multi-target (home) endpoints keep their own handlers.
 */
export function defineAdminUploadHandler(config: AdminUploadHandlerConfig) {
  return defineEventHandler(async (event) => {
    await assertUploadRequestSize(
      event,
      config.maxRequestBytes,
      getAdminApiErrorMessage(event, 'requestTooLarge')
    )

    const formData = await readMultipartFormData(event)
    const file = validateMultipartFile(event, formData)
    const data = getMultipartFileBuffer(file.data)

    if (config.kind === 'image') {
      const { storagePath } = await saveAdminImage({
        event,
        data,
        filename: file.filename,
        uploadDir: config.uploadDir,
        publicPath: config.publicPath,
        temporary: true,
      })

      return {
        path: toExternalImageProxyUrl(storagePath) ?? storagePath,
        storagePath,
      }
    }

    const { storagePath } = await saveAdminDocument({
      event,
      data,
      filename: file.filename,
      uploadDir: config.uploadDir,
      publicPath: config.publicPath,
    })

    return {
      path: toExternalPdfProxyUrl(storagePath) ?? storagePath,
      storagePath,
    }
  })
}
