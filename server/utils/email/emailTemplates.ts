import { NEWSLETTER_BRAND_BANNER_PATH } from '~~/shared/constants/assetPaths'
import { buildAbsoluteUrl } from '../core/urlBuilder'

export const EMAIL_COLORS = {
  background: '#eaeaea',
  body: '#2c2c2c',
  brand: '#792225',
  muted: '#666666',
  subtle: '#999999',
  divider: '#eeeeee',
  white: '#ffffff',
} as const

export const EMAIL_FONTS = {
  body: 'Arial, sans-serif',
  heading: 'Georgia, serif',
} as const

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function escapeHtmlForAttribute(value: string): string {
  return escapeHtml(value)
}

const DEFAULT_EMAIL_LANGUAGE_TAG = 'es-ES'

interface EmailLayoutOptions {
  bannerAlt?: string
  heading: string
  innerHtml: string
  /**
   * BCP 47 language tag for `<html lang>` — never an internal locale code (`val` is
   * `ca-ES-valencia`). Transactional emails stay Spanish and omit it.
   */
  lang?: string
  preheader: string
  siteUrl: string
  title: string
}

/**
 * Shared shell for every outgoing email. `innerHtml` is spliced into an open `<table>`, so
 * callers must supply a concatenation of `<tr>` rows. No field is escaped here: callers pass
 * content that is already escaped or sanitized.
 */
export function buildEmailLayout(options: EmailLayoutOptions): string {
  const bannerImageUrl = buildAbsoluteUrl(options.siteUrl, NEWSLETTER_BRAND_BANNER_PATH)

  return `<!DOCTYPE html>
<html lang="${options.lang ?? DEFAULT_EMAIL_LANGUAGE_TAG}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${options.title}</title>
</head>
<body style="margin:0; padding:0; background-color:${EMAIL_COLORS.background};">
  <div style="display:none; font-size:1px; color:${EMAIL_COLORS.background}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    ${options.preheader}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${EMAIL_COLORS.background}">
    <tr>
      <td align="center" style="padding:16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; background:transparent;">
          <tr>
            <td align="center" style="padding:20px 8px 8px 8px;">
              <h1 style="margin:0; font-size:28px; line-height:36px; font-weight:700; font-family:${EMAIL_FONTS.heading}; color:${EMAIL_COLORS.body};">
                ${options.heading}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 8px 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                style="background:${EMAIL_COLORS.white}; border-top:4px solid ${EMAIL_COLORS.brand}; border-top-left-radius:5px; border-top-right-radius:5px;">
                ${options.innerHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 8px 20px 8px;">
              <img src="${bannerImageUrl}" alt="${options.bannerAlt ?? 'CREUP'}" width="600"
                style="display:block; width:100%; height:auto; margin:0 auto;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildEmailDividerRow(padding = '0 16px') {
  return `<tr>
                  <td style="padding:${padding};">
                    <hr style="border:none; border-top:1px solid ${EMAIL_COLORS.divider}; margin:0;" />
                  </td>
                </tr>`
}

export function buildEmailButton(href: string, label: string) {
  return `<a href="${href}"
                        style="display:inline-block; padding:14px 32px; background-color:${EMAIL_COLORS.brand}; color:${EMAIL_COLORS.white}; font-family:${EMAIL_FONTS.body}; font-size:16px; font-weight:700; text-decoration:none; border-radius:6px;">
                        ${label}
                      </a>`
}

interface ContactEmailOptions {
  contactLabel: string
  contactPageUrl: string
  email: string
  isPress: boolean
  mediaName: string
  messageHtml: string
  name: string
  phone: string
  sentAt: string
  siteUrl: string
  subject: string
}

export function buildContactEmailHtml(options: ContactEmailOptions): string {
  const title = `Nuevo mensaje de ${options.contactLabel}`
  const mediaSuffix = options.isPress ? ` (${options.mediaName})` : ''
  const pressRows = options.isPress
    ? `
                <tr>
                  <td style="padding:6px 16px 0 16px; font-family:${EMAIL_FONTS.body}; font-size:14px; color:${EMAIL_COLORS.muted};">
                    <strong style="color:${EMAIL_COLORS.body};">Teléfono:</strong> ${options.phone}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 16px 0 16px; font-family:${EMAIL_FONTS.body}; font-size:14px; color:${EMAIL_COLORS.muted};">
                    <strong style="color:${EMAIL_COLORS.body};">Medio:</strong> ${options.mediaName}
                  </td>
                </tr>`
    : ''

  return buildEmailLayout({
    heading: title,
    preheader: `Mensaje de ${options.name}${mediaSuffix} - ${options.subject}`,
    siteUrl: options.siteUrl,
    title,
    innerHtml: `<tr>
                  <td style="padding:16px 16px 0 16px; font-family:${EMAIL_FONTS.body}; font-size:14px; color:${EMAIL_COLORS.muted};">
                    <strong style="color:${EMAIL_COLORS.body};">De:</strong>
                    ${options.name}
                    &lt;<a href="mailto:${options.email}" style="color:${EMAIL_COLORS.brand}; text-decoration:none;">${options.email}</a>&gt;
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 16px 0 16px; font-family:${EMAIL_FONTS.body}; font-size:14px; color:${EMAIL_COLORS.muted};">
                    <strong style="color:${EMAIL_COLORS.body};">Asunto:</strong> ${options.subject}
                  </td>
                </tr>${pressRows}
                ${buildEmailDividerRow('12px 16px 0 16px')}
                <tr>
                  <td style="padding:16px; font-family:${EMAIL_FONTS.body}; color:${EMAIL_COLORS.body}; font-size:16px; line-height:26px;">${options.messageHtml}</td>
                </tr>
                ${buildEmailDividerRow()}
                <tr>
                  <td style="padding:12px 16px 16px 16px; font-family:${EMAIL_FONTS.body}; font-size:12px; color:${EMAIL_COLORS.subtle}; line-height:18px;">
                    Enviado desde
                    <a href="${options.contactPageUrl}" style="color:${EMAIL_COLORS.brand}; text-decoration:none;">${options.contactPageUrl}</a>
                    · ${options.sentAt}
                    <br />
                    Puedes responder a este correo para contactar directamente con <strong>${options.name}</strong>.
                  </td>
                </tr>`,
  })
}

export function buildNewsletterConfirmationEmailHtml(
  confirmUrl: string,
  privacyUrl: string,
  siteUrl: string
) {
  return buildEmailLayout({
    heading: 'Confirma tu suscripción',
    preheader: 'Confirma tu suscripción a la newsletter de CREUP',
    siteUrl,
    title: 'Confirma tu suscripción a la newsletter de CREUP',
    bannerAlt: 'Imagotipo CREUP',
    innerHtml: `<tr>
                  <td style="padding:16px; font-family:${EMAIL_FONTS.body}; color:${EMAIL_COLORS.body}; font-size:16px; line-height:24px;">
                    <p style="margin:0 0 12px 0;">Hemos recibido una solicitud para suscribir esta dirección a la newsletter de CREUP.</p>
                    <p style="margin:0 0 24px 0;">Para activar la suscripción, haz clic en el siguiente botón.</p>
                    <p style="margin:0 0 12px 0; text-align:center;">
                      ${buildEmailButton(confirmUrl, 'Confirmar suscripción')}
                    </p>
                  </td>
                </tr>
                ${buildEmailDividerRow()}
                <tr>
                  <td style="padding:12px 16px 16px 16px; font-family:${EMAIL_FONTS.body}; font-size:12px; color:${EMAIL_COLORS.subtle}; line-height:18px; text-align:center;">
                    Si no has solicitado esta suscripción, ignora este correo y no se activará ninguna alta.
                    <br />
                    <a href="${privacyUrl}" style="color:${EMAIL_COLORS.brand}; text-decoration:none;">Aviso legal y política de privacidad</a>
                  </td>
                </tr>`,
  })
}

export function buildNewsletterAlreadySubscribedEmailHtml(unsubscribeUrl: string, siteUrl: string) {
  return buildEmailLayout({
    heading: 'Ya estás suscrito/a',
    preheader: 'Ya estás suscrito/a a la newsletter de CREUP',
    siteUrl,
    title: 'Ya estás suscrito/a a la newsletter de CREUP',
    bannerAlt: 'Imagotipo CREUP',
    innerHtml: `<tr>
                  <td style="padding:16px; font-family:${EMAIL_FONTS.body}; color:${EMAIL_COLORS.body}; font-size:16px; line-height:24px;">
                    <p style="margin:0 0 12px 0;">Hemos recibido una nueva solicitud de suscripción para esta dirección, pero ya estás suscrito/a a la newsletter de CREUP.</p>
                    <p style="margin:0;">No es necesario que hagas nada. Seguirás recibiendo nuestras newsletters con normalidad.</p>
                  </td>
                </tr>
                ${buildEmailDividerRow()}
                <tr>
                  <td style="padding:12px 16px 16px 16px; font-family:${EMAIL_FONTS.body}; font-size:12px; color:${EMAIL_COLORS.subtle}; line-height:18px; text-align:center;">
                    Si no fuiste tú quien envió esta solicitud, puedes ignorar este correo.
                    <br />
                    <a href="${unsubscribeUrl}" style="color:${EMAIL_COLORS.brand}; text-decoration:none;">Darme de baja</a>
                  </td>
                </tr>`,
  })
}
