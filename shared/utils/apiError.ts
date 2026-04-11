/**
 * Extracts a human-readable message from a $fetch / H3 error response.
 * Falls back to the provided fallback string if no message is found.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    if (
      'data' in error &&
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data &&
      typeof error.data.message === 'string' &&
      error.data.message.length > 0
    ) {
      return error.data.message
    }

    if (
      'statusMessage' in error &&
      typeof error.statusMessage === 'string' &&
      error.statusMessage.length > 0
    ) {
      return error.statusMessage
    }
  }

  return fallback
}

/**
 * Extracts HTTP status code from a $fetch / ofetch error.
 * Nuxt fetch errors expose `status`; some server errors may only expose `statusCode`.
 */
export function getApiErrorStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode
  }

  return undefined
}
