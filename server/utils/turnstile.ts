import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getClientIp } from './urlBuilder'
import { getOptionalTurnstileSecretKey } from './runtimeConfig'
import { logError } from './logger'

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
export const MIN_PUBLIC_FORM_SUBMIT_DELAY_MS = 2_000

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
}

function isTurnstileEnabled(event: H3Event) {
  return Boolean(getOptionalTurnstileSecretKey(event))
}

export function hasMinimumPublicFormSubmitDelay(
  startedAt: number,
  nowMs = Date.now(),
  minDelayMs = MIN_PUBLIC_FORM_SUBMIT_DELAY_MS
) {
  return Number.isFinite(startedAt) && startedAt > 0 && nowMs - startedAt >= minDelayMs
}

export async function verifyTurnstileTokenOrThrow(
  event: H3Event,
  token: string | undefined,
  messages: {
    invalidMessage: string
    unavailableMessage: string
  }
) {
  if (!isTurnstileEnabled(event)) {
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 503, message: messages.unavailableMessage })
    }

    return
  }

  const normalizedToken = token?.trim()

  if (!normalizedToken) {
    throw createError({ statusCode: 400, message: messages.invalidMessage })
  }

  const secret = getOptionalTurnstileSecretKey(event)

  if (!secret) {
    throw createError({ statusCode: 503, message: messages.unavailableMessage })
  }

  const body = new URLSearchParams({
    response: normalizedToken,
    secret,
  })
  const clientIp = getClientIp(event)

  if (clientIp) {
    body.set('remoteip', clientIp)
  }

  let result: TurnstileVerifyResponse

  try {
    result = await $fetch<TurnstileVerifyResponse>(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error) {
    logError('turnstile.verify.request-failed', error)
    throw createError({ statusCode: 503, message: messages.unavailableMessage })
  }

  if (!result.success) {
    throw createError({ statusCode: 400, message: messages.invalidMessage })
  }
}
