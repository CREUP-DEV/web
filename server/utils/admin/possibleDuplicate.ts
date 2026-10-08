import { createError } from 'h3'
import type { H3Event } from 'h3'
import {
  POSSIBLE_DUPLICATE_ERROR_CODE,
  type PossibleDuplicate,
  type PossibleDuplicateErrorData,
} from '~~/shared/utils/possibleDuplicate'
import { getAdminApiErrorMessage } from '../locale/adminApiErrorMessages'

/**
 * Refuse a create that looks like a duplicate of `duplicate` (see `shared/utils/possibleDuplicate`).
 * Callers run the check inside the create transaction, after the slug's advisory lock, so two
 * simultaneous submits of the same piece cannot both pass it.
 */
export function throwPossibleDuplicate(event: H3Event, duplicate: PossibleDuplicate): never {
  const data: PossibleDuplicateErrorData = { code: POSSIBLE_DUPLICATE_ERROR_CODE, duplicate }

  throw createError({
    statusCode: 409,
    message: getAdminApiErrorMessage(event, 'duplicateRecord'),
    data,
  })
}
