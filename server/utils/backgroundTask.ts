import type { H3Event } from 'h3'
import { logError } from './logger'

export function runInBackground(event: H3Event, scope: string, task: Promise<unknown>) {
  const guardedTask = task.catch((error) => {
    logError(scope, error, undefined, event)
  })

  const waitUntil = event.waitUntil ?? event.context.waitUntil
  if (typeof waitUntil === 'function') {
    waitUntil(guardedTask)
    return
  }

  void guardedTask
}
