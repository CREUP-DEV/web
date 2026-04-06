import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { getRequiredSmtpTransportConfig } from './runtimeConfig'
import { logError, logInfo } from './logger'

let cachedTransporter: Transporter | null = null
let cachedConfigKey: string | null = null
let verifyPromise: Promise<void> | null = null

/**
 * Returns a singleton SMTP transporter instance. The transporter is lazily
 * created and reused across requests to avoid repeated TCP/TLS handshakes.
 *
 * If the SMTP config changes (e.g. env vars updated), the transporter is
 * recreated automatically.
 */
export function getSmtpTransporter(configErrorMessage?: string): Transporter {
  const config = getRequiredSmtpTransportConfig(undefined, configErrorMessage)
  const configKey = JSON.stringify(config)

  if (cachedTransporter && cachedConfigKey === configKey) {
    return cachedTransporter
  }

  cachedTransporter = nodemailer.createTransport({
    ...config,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  })

  cachedConfigKey = configKey
  verifyPromise = cachedTransporter
    .verify()
    .then(() => {
      logInfo('smtp.verify', { status: 'ok' })
    })
    .catch((error) => {
      logError('smtp.verify', error)
      verifyPromise = null
    })

  return cachedTransporter
}

export async function ensureSmtpTransporterVerified(configErrorMessage?: string) {
  const transporter = getSmtpTransporter(configErrorMessage)

  if (!verifyPromise) {
    verifyPromise = transporter.verify().then(() => undefined)
  }

  await verifyPromise
  return transporter
}
