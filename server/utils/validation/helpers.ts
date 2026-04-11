import { DATE_ONLY_PATTERN, parseDateOnlyString } from '~~/shared/utils/date'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'
import { z } from 'zod'

export const localeSchema = z.enum(SUPPORTED_LOCALE_CODES, {
  message: 'Invalid locale / El locale no es válido',
})

export const dateOnlySchema = z
  .string()
  .regex(DATE_ONLY_PATTERN, 'La fecha no es válida')
  .refine((value) => parseDateOnlyString(value) !== null, 'La fecha no es válida')

const getSingleValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

export const toSingleStringSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => getSingleValue(value), schema)

export const toOptionalSingleStringSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    const normalizedValue = getSingleValue(value)
    if (normalizedValue === '' || normalizedValue == null) {
      return undefined
    }
    return normalizedValue
  }, schema.optional())

export const getRequiredLocaleTranslation = <T extends { locale: string }>(translations: T[]) =>
  translations.find((translation) => translation.locale === DEFAULT_LOCALE_CODE)
