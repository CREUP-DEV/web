import { processPendingNewsletterDeliveries } from '../utils/newsletters'
import { logError } from '../utils/logger'

const NEWSLETTER_DELIVERY_POLL_MS = 15_000

let hasStartedNewsletterDeliveryWorker = false
let newsletterDeliveryInterval: ReturnType<typeof setInterval> | null = null

async function runNewsletterDeliveryCycle() {
  try {
    await processPendingNewsletterDeliveries()
  } catch (error) {
    logError('newsletter.delivery.worker', error)
  }
}

export default defineNitroPlugin(() => {
  if (hasStartedNewsletterDeliveryWorker) {
    return
  }

  hasStartedNewsletterDeliveryWorker = true
  void runNewsletterDeliveryCycle()

  newsletterDeliveryInterval = setInterval(() => {
    void runNewsletterDeliveryCycle()
  }, NEWSLETTER_DELIVERY_POLL_MS)

  newsletterDeliveryInterval.unref?.()
})
