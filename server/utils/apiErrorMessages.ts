import type { H3Event } from 'h3'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from './requestLocale'

const publicApiErrorMessagesByLocale = {
  es: {
    articleNotFound: 'Artículo no encontrado.',
    committeesUnavailable: 'La información de los comités no está disponible temporalmente.',
    contactEmailServiceUnavailable: 'El servicio de correo no está disponible en este momento.',
    contactRateLimited: 'Has enviado demasiados mensajes. Inténtalo de nuevo más tarde.',
    contactSpamDetected: 'El mensaje contiene contenido no permitido.',
    eventNotFound: 'Evento no encontrado.',
    googleCalendarUnavailable: 'Google Calendar no está disponible temporalmente.',
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
    orgChartUnavailable: 'La información del organigrama no está disponible temporalmente.',
    sectorialUnavailable: 'La información de las sectoriales no está disponible temporalmente.',
    serviceTemporarilyUnavailable: 'Servicio temporalmente no disponible',
  },
  en: {
    articleNotFound: 'Article not found.',
    committeesUnavailable: 'Committee data is temporarily unavailable.',
    contactEmailServiceUnavailable: 'The email service is not available right now.',
    contactRateLimited: 'Too many requests. Please try again later.',
    contactSpamDetected: 'The message contains prohibited content.',
    eventNotFound: 'Event not found.',
    googleCalendarUnavailable: 'Google Calendar is temporarily unavailable.',
    methodNotAllowed: 'Method not allowed',
    mandateNotFoundByDate: 'No mandate found for the given date.',
    mandatesUnavailable: 'Mandate data is temporarily unavailable.',
    membersUnavailable: 'Member data is temporarily unavailable.',
    newsletterEmailDeliveryFailed:
      'The confirmation email could not be sent. Please try again in a few minutes.',
    newsletterInvalidData: 'Invalid subscription data',
    newsletterRateLimited: 'Too many requests. Please try again later.',
    newsletterSubscriptionFailed: 'The subscription could not be completed right now',
    orgChartUnavailable: 'Org chart data is temporarily unavailable.',
    sectorialUnavailable: 'Sectorial data is temporarily unavailable.',
    serviceTemporarilyUnavailable: 'Service temporarily unavailable',
  },
} as const

type PublicApiErrorMessageKey = keyof (typeof publicApiErrorMessagesByLocale)['es']

export const getPublicApiErrorMessage = (event: H3Event, key: PublicApiErrorMessageKey): string => {
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(publicApiErrorMessagesByLocale, locale, fallbackLocale) ??
    publicApiErrorMessagesByLocale.es

  return messages[key]
}
