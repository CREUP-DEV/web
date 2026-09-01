import type { Job, JobsOptions, Queue } from 'bullmq'
import { Queue as BullMqQueue } from 'bullmq'
import { createBullMqConnection } from '../cache/redis'

const BULLMQ_PREFIX = 'creup:web:bullmq'

export const BACKGROUND_QUEUE_NAMES = {
  maintenance: 'maintenance',
  newsletter: 'newsletter',
} as const

export const BACKGROUND_JOB_NAMES = {
  authHousekeeping: 'auth.housekeeping',
  newsletterCampaignRecovery: 'newsletter.campaign-recovery',
  newsletterCampaignSend: 'newsletter.campaign-send',
  newsletterConfirmTokenCleanup: 'newsletter.confirm-token-cleanup',
} as const

export interface NewsletterCampaignSendJobData {
  campaignId: string
  workerToken: string
}

/** The queue carries campaign sends only; the PDF pipeline that once shared it is gone. */
type NewsletterQueueJobData = NewsletterCampaignSendJobData

let newsletterQueue: Queue<NewsletterQueueJobData> | null = null
let maintenanceQueue: Queue | null = null

const DEFAULT_REMOVE_ON_COMPLETE = 100
const DEFAULT_REMOVE_ON_FAIL = 100

const getDefaultJobOptions = (): JobsOptions => ({
  removeOnComplete: DEFAULT_REMOVE_ON_COMPLETE,
  removeOnFail: DEFAULT_REMOVE_ON_FAIL,
})

export const buildNewsletterCampaignSendJobId = (campaignId: string, workerToken: string) =>
  `newsletter-campaign-send-${campaignId}-${workerToken}`

const getQueueOptions = () => ({
  connection: createBullMqConnection(),
  defaultJobOptions: getDefaultJobOptions(),
  prefix: BULLMQ_PREFIX,
})

export function getNewsletterQueue() {
  newsletterQueue ??= new BullMqQueue<NewsletterQueueJobData>(
    BACKGROUND_QUEUE_NAMES.newsletter,
    getQueueOptions()
  )

  return newsletterQueue
}

export function getMaintenanceQueue() {
  maintenanceQueue ??= new BullMqQueue(BACKGROUND_QUEUE_NAMES.maintenance, getQueueOptions())

  return maintenanceQueue
}

export async function enqueueNewsletterCampaignSendJob(data: NewsletterCampaignSendJobData) {
  await getNewsletterQueue().add(BACKGROUND_JOB_NAMES.newsletterCampaignSend, data, {
    attempts: 5,
    backoff: {
      delay: 5_000,
      type: 'exponential',
    },
    jobId: buildNewsletterCampaignSendJobId(data.campaignId, data.workerToken),
    removeOnComplete: DEFAULT_REMOVE_ON_COMPLETE,
    removeOnFail: DEFAULT_REMOVE_ON_FAIL,
  })
}

async function removeQueuedJob(jobId: string) {
  const job = await getNewsletterQueue().getJob(jobId)

  if (!job) {
    return
  }

  try {
    await job.remove()
  } catch {
    // Job may already be active or completed. DB cancellation state is still authoritative.
  }
}

export async function removeNewsletterCampaignSendJob(campaignId: string, workerToken: string) {
  await removeQueuedJob(buildNewsletterCampaignSendJobId(campaignId, workerToken))
}

export async function ensureBackgroundJobSchedulers() {
  const queue = getMaintenanceQueue()

  await Promise.all([
    // Periodic, not just at startup: the send commits to PostgreSQL and only then enqueues to
    // Redis, so a campaign left `queued` with its token by a failed enqueue needs a sweep that
    // comes round on its own.
    queue.upsertJobScheduler(
      BACKGROUND_JOB_NAMES.newsletterCampaignRecovery,
      { every: 5 * 60 * 1000 },
      {
        data: {},
        name: BACKGROUND_JOB_NAMES.newsletterCampaignRecovery,
        opts: getDefaultJobOptions(),
      }
    ),
    queue.upsertJobScheduler(
      BACKGROUND_JOB_NAMES.newsletterConfirmTokenCleanup,
      { every: 60 * 60 * 1000 },
      {
        data: {},
        name: BACKGROUND_JOB_NAMES.newsletterConfirmTokenCleanup,
        opts: getDefaultJobOptions(),
      }
    ),
    queue.upsertJobScheduler(
      BACKGROUND_JOB_NAMES.authHousekeeping,
      { every: 60 * 60 * 1000 },
      {
        data: {},
        name: BACKGROUND_JOB_NAMES.authHousekeeping,
        opts: getDefaultJobOptions(),
      }
    ),
  ])
}

export async function enqueueStartupMaintenanceJobs() {
  const queue = getMaintenanceQueue()

  await Promise.all([
    queue.add(
      BACKGROUND_JOB_NAMES.newsletterCampaignRecovery,
      {},
      {
        ...getDefaultJobOptions(),
        jobId: 'startup-newsletter-campaign-recovery',
      }
    ),
    queue.add(
      BACKGROUND_JOB_NAMES.newsletterConfirmTokenCleanup,
      {},
      {
        ...getDefaultJobOptions(),
        jobId: 'startup-newsletter-confirm-token-cleanup',
      }
    ),
    queue.add(
      BACKGROUND_JOB_NAMES.authHousekeeping,
      {},
      {
        ...getDefaultJobOptions(),
        jobId: 'startup-auth-housekeeping',
      }
    ),
  ])
}

export async function closeBackgroundJobResources() {
  await Promise.allSettled([newsletterQueue?.close(), maintenanceQueue?.close()])

  newsletterQueue = null
  maintenanceQueue = null
}

export function isNewsletterCampaignSendJob(job: Job): job is Job<NewsletterCampaignSendJobData> {
  return job.name === BACKGROUND_JOB_NAMES.newsletterCampaignSend
}

export type BackgroundQueueName =
  (typeof BACKGROUND_QUEUE_NAMES)[keyof typeof BACKGROUND_QUEUE_NAMES]

function getQueueByName(queueName: BackgroundQueueName): Queue {
  return queueName === BACKGROUND_QUEUE_NAMES.newsletter
    ? getNewsletterQueue()
    : getMaintenanceQueue()
}

const MAX_FAILED_REASON_LENGTH = 300

export interface FailedJobSummary {
  attemptsMade: number
  failedAt: string | null
  failedReason: string | null
  id: string
  name: string
}

export async function getRecentFailedJobs(
  queueName: BackgroundQueueName,
  limit = 5
): Promise<FailedJobSummary[]> {
  const jobs = await getQueueByName(queueName).getFailed(0, Math.max(0, limit - 1))

  return jobs.map((job) => ({
    attemptsMade: job.attemptsMade,
    failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    failedReason: job.failedReason ? job.failedReason.slice(0, MAX_FAILED_REASON_LENGTH) : null,
    id: String(job.id ?? ''),
    name: job.name,
  }))
}

export type RetryFailedJobResult = 'retried' | 'not-found' | 'not-failed'

/**
 * Re-enqueues a previously failed job. Guards against the race where the job is
 * retried or removed concurrently (auto-refresh, another admin): both the
 * explicit state check and BullMQ's own guard map to 'not-failed' instead of
 * bubbling up as a 500.
 */
export async function retryFailedJob(
  queueName: BackgroundQueueName,
  jobId: string
): Promise<RetryFailedJobResult> {
  const job = await getQueueByName(queueName).getJob(jobId)

  if (!job) {
    return 'not-found'
  }

  if (!(await job.isFailed())) {
    return 'not-failed'
  }

  try {
    await job.retry()
    return 'retried'
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    // Lost race only: the job left the failed set or was removed between the
    // isFailed() check and this call. BullMQ surfaces these as fixed messages
    // ("... is not in the failed state" / "Missing key for job ...").
    if (message.includes('is not in the')) {
      return 'not-failed'
    }
    if (message.includes('Missing key for job')) {
      return 'not-found'
    }

    // Any other failure (Redis down, Lua/script error) is a real incident and
    // must propagate so the status page reflects it instead of a benign 409.
    throw error
  }
}
