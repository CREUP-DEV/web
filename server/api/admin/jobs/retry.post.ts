import { createError, defineEventHandler, readBody } from 'h3'
import { retryFailedJob } from '../../../utils/core/backgroundJobs'
import { requireEnvAdmin } from '../../../utils/auth/requireAuth'
import { validateBody } from '../../../utils/validation/common'
import { retryFailedJobSchema } from '~~/shared/utils/adminSchemas'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'

export default defineEventHandler(async (event) => {
  await requireEnvAdmin(event)

  const body = await readBody(event)
  const { jobId, queue } = validateBody(event, retryFailedJobSchema, body)

  const result = await retryFailedJob(queue, jobId)

  if (result === 'not-found') {
    throw createError({
      statusCode: 404,
      message: getAdminApiErrorMessage(event, 'jobGone'),
    })
  }

  if (result === 'not-failed') {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'jobNotFailed'),
    })
  }

  return { data: { retried: true } }
})
