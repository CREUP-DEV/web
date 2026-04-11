import type { H3Event } from 'h3'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from './requestLocale'

const publicApiErrorMessagesByLocale = {
  es: {
    assetInvalidCredentials: 'La URL del recurso no puede incluir credenciales.',
    assetInvalidOrigin: 'El origen del recurso no es válido.',
    assetInvalidPath: 'La ruta del recurso no es válida.',
    assetInvalidProtocol: 'El protocolo del recurso no es válido.',
    assetInvalidRequest: 'La solicitud del recurso no es válida.',
    assetNotFound: 'Recurso externo no encontrado.',
    assetPathRequired: 'La ruta del recurso es obligatoria.',
    assetProxyNotConfigured: 'El proxy de recursos externos no está configurado.',
    assetTimedOut: 'La solicitud del recurso externo ha superado el tiempo de espera.',
    assetTooLarge: 'El recurso externo supera el tamaño máximo permitido.',
    assetUnavailable: 'El recurso externo no está disponible temporalmente.',
    assetUnsupportedType: 'El tipo de recurso externo no es compatible.',
    articleNotFound: 'Artículo no encontrado.',
    committeesUnavailable: 'La información de los comités no está disponible temporalmente.',
    contactEmailServiceUnavailable: 'El servicio de correo no está disponible en este momento.',
    contactRateLimited: 'Has enviado demasiados mensajes. Inténtalo de nuevo más tarde.',
    contactSpamDetected: 'El mensaje contiene contenido no permitido.',
    documentNotFound: 'Documento no encontrado.',
    eventNotFound: 'Evento no encontrado.',
    eventsUnavailable: 'La información de los eventos no está disponible temporalmente.',
    googleCalendarUnavailable: 'Google Calendar no está disponible temporalmente.',
    mandateDetailUnavailable: 'El detalle del mandato no está disponible temporalmente.',
    methodNotAllowed: 'Método no permitido',
    mandateNotFoundByDate: 'No se ha encontrado ningún mandato para esa fecha.',
    mandatesUnavailable: 'La información de los mandatos no está disponible temporalmente.',
    membersUnavailable:
      'La información de las asociaciones miembro no está disponible temporalmente.',
    newsletterEmailDeliveryFailed:
      'No se pudo enviar el correo de confirmación. Inténtalo de nuevo en unos minutos.',
    newsletterInvalidData: 'Datos de suscripción no válidos',
    newsletterRateLimited: 'Has enviado demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    newsletterSubscriptionFailed: 'No se pudo completar la suscripción en este momento',
    normativaUnavailable: 'La normativa no está disponible temporalmente.',
    policyDocumentsUnavailable: 'La documentación solicitada no está disponible temporalmente.',
    publicAgendaNotAvailable: 'La agenda pública no está disponible.',
    publicAgendaUnavailable: 'La agenda pública no está disponible temporalmente.',
    siteUrlNotConfigured: 'La URL pública del sitio no está configurada.',
    tooManyAttempts: 'Demasiados intentos. Inténtalo más tarde.',
    orgChartUnavailable: 'La información del organigrama no está disponible temporalmente.',
    sectorialUnavailable: 'La información de las sectoriales no está disponible temporalmente.',
    serviceTemporarilyUnavailable: 'Servicio temporalmente no disponible',
  },
  en: {
    assetInvalidCredentials: 'Invalid asset URL credentials.',
    assetInvalidOrigin: 'Invalid asset origin.',
    assetInvalidPath: 'Invalid asset path.',
    assetInvalidProtocol: 'Invalid asset protocol.',
    assetInvalidRequest: 'Invalid asset request.',
    assetNotFound: 'External asset not found.',
    assetPathRequired: 'Asset path is required.',
    assetProxyNotConfigured: 'External asset proxy is not configured.',
    assetTimedOut: 'External asset request timed out.',
    assetTooLarge: 'External asset exceeds size limit.',
    assetUnavailable: 'External asset is temporarily unavailable.',
    assetUnsupportedType: 'Unsupported external asset type.',
    articleNotFound: 'Article not found.',
    committeesUnavailable: 'Committee data is temporarily unavailable.',
    contactEmailServiceUnavailable: 'The email service is not available right now.',
    contactRateLimited: 'Too many requests. Please try again later.',
    contactSpamDetected: 'The message contains prohibited content.',
    documentNotFound: 'Document not found.',
    eventNotFound: 'Event not found.',
    eventsUnavailable: 'Event data is temporarily unavailable.',
    googleCalendarUnavailable: 'Google Calendar is temporarily unavailable.',
    mandateDetailUnavailable: 'Mandate detail is temporarily unavailable.',
    methodNotAllowed: 'Method not allowed',
    mandateNotFoundByDate: 'No mandate found for the given date.',
    mandatesUnavailable: 'Mandate data is temporarily unavailable.',
    membersUnavailable: 'Member data is temporarily unavailable.',
    newsletterEmailDeliveryFailed:
      'The confirmation email could not be sent. Please try again in a few minutes.',
    newsletterInvalidData: 'Invalid subscription data',
    newsletterRateLimited: 'Too many requests. Please try again later.',
    newsletterSubscriptionFailed: 'The subscription could not be completed right now',
    normativaUnavailable: 'Regulations data is temporarily unavailable.',
    policyDocumentsUnavailable: 'The requested documents are temporarily unavailable.',
    publicAgendaNotAvailable: 'Public agenda not available.',
    publicAgendaUnavailable: 'Public agenda is temporarily unavailable.',
    siteUrlNotConfigured: 'Site URL is not configured.',
    tooManyAttempts: 'Too many attempts. Please try again later.',
    orgChartUnavailable: 'Org chart data is temporarily unavailable.',
    sectorialUnavailable: 'Sectorial data is temporarily unavailable.',
    serviceTemporarilyUnavailable: 'Service temporarily unavailable',
  },
} as const

export type PublicApiErrorMessageKey = keyof (typeof publicApiErrorMessagesByLocale)['es']

export const getDefaultPublicApiErrorMessage = (
  key: PublicApiErrorMessageKey,
  locale: keyof typeof publicApiErrorMessagesByLocale = 'es'
): string => {
  return publicApiErrorMessagesByLocale[locale][key]
}

export const getPublicApiErrorMessage = (event: H3Event, key: PublicApiErrorMessageKey): string => {
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(publicApiErrorMessagesByLocale, locale, fallbackLocale) ??
    publicApiErrorMessagesByLocale.es

  return messages[key]
}
