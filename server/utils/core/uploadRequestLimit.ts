import { createError, getRequestHeader, toWebRequest, type H3Event } from 'h3'

export async function assertUploadRequestSize(event: H3Event, maxBytes: number, message: string) {
  const rawContentLengthHeader = getRequestHeader(event, 'content-length')

  if (!rawContentLengthHeader) {
    throw createError({
      statusCode: 411,
      message: 'La cabecera Content-Length es obligatoria',
    })
  }

  const rawContentLength = Number(rawContentLengthHeader)

  if (!Number.isFinite(rawContentLength) || rawContentLength < 0) {
    throw createError({
      statusCode: 411,
      message: 'La cabecera Content-Length no es válida',
    })
  }

  if (rawContentLength > maxBytes) {
    throw createError({ statusCode: 413, message })
  }

  const requestClone = toWebRequest(event).clone()
  const reader = requestClone.body?.getReader()

  if (!reader) {
    return
  }

  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        return
      }

      totalBytes += value.byteLength

      if (totalBytes > maxBytes) {
        await reader.cancel(message)
        throw createError({ statusCode: 413, message })
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function assertUploadedFileSize(sizeBytes: number, maxBytes: number, message: string) {
  if (sizeBytes <= maxBytes) {
    return
  }

  throw createError({
    statusCode: 413,
    message,
  })
}
