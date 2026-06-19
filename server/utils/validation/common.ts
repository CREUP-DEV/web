import type { H3Event, MultiPartData } from 'h3'
import { createError, getQuery, getRouterParam } from 'h3'
import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { getAdminApiErrorMessage } from '../locale/adminApiErrorMessages'
import { getPublicApiErrorMessage } from '../locale/apiErrorMessages'
import { toOptionalSingleStringSchema, toSingleStringSchema } from './helpers'

const multipartFileSchema = z.object({
  data: z.instanceof(Uint8Array),
  filename: z.string().trim().min(1),
})

function validatePublicSchema<T>(event: H3Event, schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: getPublicApiErrorMessage(event, 'invalidInput'),
    })
  }

  return result.data
}

export function validateInput<T>(event: H3Event, schema: z.ZodSchema<T>, input: unknown): T {
  return validateAdminInput(event, schema, input)
}

export function validateAdminInput<T>(event: H3Event, schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input)

  if (!result.success) {
    // Admin endpoints are authenticated, so it's safe to report which fields failed and why — far
    // more useful than a flat "invalid input" when the client and server schemas drift. The issue
    // list is also attached as structured `data` for any caller that wants per-field handling.
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.map(String),
      message: issue.message,
    }))
    const detail = issues
      .map((issue) =>
        issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message
      )
      .join(' · ')

    throw createError({
      statusCode: 400,
      message: detail
        ? `${getAdminApiErrorMessage(event, 'invalidInput')} (${detail})`
        : getAdminApiErrorMessage(event, 'invalidInput'),
      data: { issues },
    })
  }

  return result.data
}

export function validatePublicInput<T>(event: H3Event, schema: z.ZodSchema<T>, input: unknown): T {
  return validatePublicSchema(event, schema, input)
}

export function validateBody<T>(event: H3Event, schema: z.ZodSchema<T>, body: unknown): T {
  return validateAdminBody(event, schema, body)
}

export function validateAdminBody<T>(event: H3Event, schema: z.ZodSchema<T>, body: unknown): T {
  return validateAdminInput(event, schema, body)
}

export function validatePublicBody<T>(event: H3Event, schema: z.ZodSchema<T>, body: unknown): T {
  return validatePublicInput(event, schema, body)
}

export function validateQuery<T>(event: H3Event, schema: z.ZodSchema<T>): T {
  return validateAdminQuery(event, schema)
}

export function validateAdminQuery<T>(event: H3Event, schema: z.ZodSchema<T>): T {
  return validateAdminInput(event, schema, getQuery(event))
}

export function validatePublicQuery<T>(event: H3Event, schema: z.ZodSchema<T>): T {
  return validatePublicInput(event, schema, getQuery(event))
}

export function validateRouteParams<T extends z.ZodRawShape>(
  event: H3Event,
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  return validateAdminRouteParams(event, schema)
}

export function validateAdminRouteParams<T extends z.ZodRawShape>(
  event: H3Event,
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  const params = Object.fromEntries(
    Object.keys(schema.shape).map((key) => [key, getRouterParam(event, key)])
  )

  return validateAdminInput(event, schema, params)
}

export function validatePublicRouteParams<T extends z.ZodRawShape>(
  event: H3Event,
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  const params = Object.fromEntries(
    Object.keys(schema.shape).map((key) => [key, getRouterParam(event, key)])
  )

  return validatePublicInput(event, schema, params)
}

export function validateMultipartFile(
  event: H3Event,
  formData: MultiPartData[] | undefined,
  fieldName = 'file'
): z.infer<typeof multipartFileSchema> {
  if (!formData?.length) {
    throw createError({
      statusCode: 400,
      message: getAdminApiErrorMessage(event, 'fileMissing'),
    })
  }

  const file = formData.find((entry) => entry.name === fieldName)
  if (!file) {
    throw createError({
      statusCode: 400,
      message: getAdminApiErrorMessage(event, 'fileInvalid'),
    })
  }

  const parsedFile = multipartFileSchema.safeParse({
    data: file.data,
    filename: file.filename,
  })

  if (!parsedFile.success) {
    throw createError({
      statusCode: 400,
      message: getAdminApiErrorMessage(event, 'fileInvalid'),
    })
  }

  return parsedFile.data
}

export function getMultipartFileBuffer(data: Uint8Array) {
  if (Buffer.isBuffer(data)) {
    return data
  }

  return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
}

export function getMultipartTextField(
  formData: MultiPartData[] | undefined,
  fieldName: string
): string | undefined {
  const field = formData?.find((entry) => entry.name === fieldName)
  const value = field?.data?.toString('utf8').trim()

  return value ? value : undefined
}

export const idRouteParamSchema = z.object({
  id: z.string().trim().min(1, 'ID requerido'),
})

export const numericIdRouteParamSchema = z.object({
  id: z.coerce.number().int().min(1, 'ID no válido'),
})

export const slugRouteParamSchema = z.object({
  slug: z.string().trim().min(1, 'Slug requerido'),
})

export const mandateSlugRouteParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'El mandato debe tener formato YYYY, YYYY-MM o YYYY-MM-DD'),
})

export const newsletterTokenQuerySchema = z.object({
  token: toSingleStringSchema(z.string().trim().min(1, 'Token requerido')),
})

export const memberCalendarQuerySchema = z.object({
  calendarId: toOptionalSingleStringSchema(z.string().trim().email('El calendario no es válido')),
})

export const cspReportBodySchema = z.union([
  z.looseObject({
    'csp-report': z.record(z.string(), z.unknown()),
  }),
  z.looseObject({
    type: z.string().trim().max(200).optional(),
    body: z.record(z.string(), z.unknown()).optional(),
  }),
  z.array(z.record(z.string(), z.unknown())).max(20),
])

export const externalAssetTypeRouteParamSchema = z.object({
  type: z.enum(['image', 'pdf']),
})

export const adminAssetPathRouteParamSchema = z.object({
  path: z.string().trim().min(1, 'Ruta no válida'),
})

/** Reusable pagination query params: limit + offset */
export const paginationQuerySchema = z.object({
  limit: toOptionalSingleStringSchema(z.coerce.number().int().min(1).max(200).default(20)),
  offset: toOptionalSingleStringSchema(z.coerce.number().int().min(0).default(0)),
})

/** Admin collection pagination with high cap for list-style screens */
export const adminCollectionQuerySchema = z.object({
  limit: toOptionalSingleStringSchema(z.coerce.number().int().min(1).max(500).default(500)),
  offset: toOptionalSingleStringSchema(z.coerce.number().int().min(0).default(0)),
})

/** Public pagination with smaller max and default */
export const publicPaginationQuerySchema = z.object({
  limit: toOptionalSingleStringSchema(z.coerce.number().int().min(1).max(50).default(12)),
  offset: toOptionalSingleStringSchema(z.coerce.number().int().min(0).default(0)),
})
