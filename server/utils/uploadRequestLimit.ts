import { createError, getRequestHeader, type H3Event } from 'h3'

export function assertUploadRequestSize(event: H3Event, maxBytes: number, message: string) {
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
