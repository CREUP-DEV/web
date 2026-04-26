import type { AdminSession } from '../utils/auth/requireAuth'

declare module 'h3' {
  interface H3EventContext {
    adminSession?: AdminSession
    requestLocale?: string
    waitUntil?: (promise: Promise<unknown>) => void
  }

  interface H3Event {
    waitUntil?: (promise: Promise<unknown>) => void
  }
}
