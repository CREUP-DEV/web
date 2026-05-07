const databaseUnavailableCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  '57P01',
  '57P02',
  '57P03',
])

const databaseUnavailableMessages = [
  'connect econnrefused',
  'connection terminated unexpectedly',
  'the database system is shutting down',
  'the database system is starting up',
]

type RecursiveErrorShape = {
  code?: unknown
  message?: unknown
  cause?: unknown
  errors?: unknown[]
}

function hasDatabaseUnavailableCode(error: RecursiveErrorShape) {
  return typeof error.code === 'string' && databaseUnavailableCodes.has(error.code)
}

function hasDatabaseUnavailableMessage(error: RecursiveErrorShape) {
  if (typeof error.message !== 'string') {
    return false
  }

  const message = error.message.toLowerCase()
  return databaseUnavailableMessages.some((fragment) => message.includes(fragment))
}

function isErrorLike(value: unknown): value is RecursiveErrorShape {
  return typeof value === 'object' && value !== null
}

function hasDatabaseMissingRelationCode(error: RecursiveErrorShape) {
  return error.code === '42P01'
}

function hasDatabaseMissingRelationMessage(error: RecursiveErrorShape, relationName?: string) {
  if (typeof error.message !== 'string') {
    return false
  }

  const message = error.message.toLowerCase()

  if (!message.includes('does not exist')) {
    return false
  }

  if (!relationName) {
    return message.includes('relation')
  }

  return message.includes(`relation "${relationName.toLowerCase()}"`)
}

export function isDatabaseUnavailableError(error: unknown, seen = new Set<unknown>()): boolean {
  if (!isErrorLike(error) || seen.has(error)) {
    return false
  }

  seen.add(error)

  if (hasDatabaseUnavailableCode(error) || hasDatabaseUnavailableMessage(error)) {
    return true
  }

  if (Array.isArray(error.errors)) {
    for (const nestedError of error.errors) {
      if (isDatabaseUnavailableError(nestedError, seen)) {
        return true
      }
    }
  }

  return isDatabaseUnavailableError(error.cause, seen)
}

export function isDatabaseMissingRelationError(
  error: unknown,
  relationName?: string,
  seen = new Set<unknown>()
): boolean {
  if (!isErrorLike(error) || seen.has(error)) {
    return false
  }

  seen.add(error)

  if (
    hasDatabaseMissingRelationCode(error) ||
    hasDatabaseMissingRelationMessage(error, relationName)
  ) {
    return true
  }

  if (Array.isArray(error.errors)) {
    for (const nestedError of error.errors) {
      if (isDatabaseMissingRelationError(nestedError, relationName, seen)) {
        return true
      }
    }
  }

  return isDatabaseMissingRelationError(error.cause, relationName, seen)
}
