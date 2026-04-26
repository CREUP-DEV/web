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
  newsletterConfirmTokenCleanup: 'newsletter.confirm-token-cleanup',
  newsletterRecovery: 'newsletter.recovery',
  newsletterSend: 'newsletter.send',
} as const

export interface NewsletterSendJobData {
  newsletterId: string
  workerToken: string
}

let newsletterQueue: Queue<NewsletterSendJobData> | null = null
let maintenanceQueue: Queue | null = null

const DEFAULT_REMOVE_ON_COMPLETE = 100
const DEFAULT_REMOVE_ON_FAIL = 100

const getDefaultJobOptions = (): JobsOptions => ({
  removeOnComplete: DEFAULT_REMOVE_ON_COMPLETE,
  removeOnFail: DEFAULT_REMOVE_ON_FAIL,
})

export const buildNewsletterSendJobId = (newsletterId: string, workerToken: string) =>
  `newsletter-send-${newsletterId}-${workerToken}`

const getQueueOptions = () => ({
  connection: createBullMqConnection(),
  defaultJobOptions: getDefaultJobOptions(),
  prefix: BULLMQ_PREFIX,
})

export function getNewsletterQueue() {
  newsletterQueue ??= new BullMqQueue<NewsletterSendJobData>(
    BACKGROUND_QUEUE_NAMES.newsletter,
    getQueueOptions()
  )

  return newsletterQueue
}

export function getMaintenanceQueue() {
  maintenanceQueue ??= new BullMqQueue(BACKGROUND_QUEUE_NAMES.maintenance, getQueueOptions())

  return maintenanceQueue
}

export async function enqueueNewsletterSendJob(data: NewsletterSendJobData) {
  await getNewsletterQueue().add(BACKGROUND_JOB_NAMES.newsletterSend, data, {
    attempts: 5,
    backoff: {
      delay: 5_000,
      type: 'exponential',
    },
    jobId: buildNewsletterSendJobId(data.newsletterId, data.workerToken),
    removeOnComplete: DEFAULT_REMOVE_ON_COMPLETE,
    removeOnFail: DEFAULT_REMOVE_ON_FAIL,
  })
}

export async function removeNewsletterSendJob(newsletterId: string, workerToken: string) {
  const job = await getNewsletterQueue().getJob(buildNewsletterSendJobId(newsletterId, workerToken))

  if (!job) {
    return
  }

  try {
    await job.remove()
  } catch {
    // Job may already be active or completed. DB cancellation state is still authoritative.
  }
}

export async function ensureBackgroundJobSchedulers() {
  const queue = getMaintenanceQueue()

  await Promise.all([
    queue.upsertJobScheduler(
      BACKGROUND_JOB_NAMES.newsletterRecovery,
      { every: 5 * 60 * 1000 },
      {
        data: {},
        name: BACKGROUND_JOB_NAMES.newsletterRecovery,
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
      BACKGROUND_JOB_NAMES.newsletterRecovery,
      {},
      {
        ...getDefaultJobOptions(),
        jobId: 'startup-newsletter-recovery',
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

export function isNewsletterSendJob(job: Job): job is Job<NewsletterSendJobData> {
  return job.name === BACKGROUND_JOB_NAMES.newsletterSend
}
