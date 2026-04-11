export type ApiEnvelopeMeta = Record<string, unknown>

export type ApiEnvelope<T> = {
  data: T
}

export type ApiEnvelopeWithMeta<T, M extends ApiEnvelopeMeta = ApiEnvelopeMeta> = {
  data: T
  meta: M
}

export function createApiEnvelope<T>(data: T): ApiEnvelope<T> {
  return { data }
}

export function createApiEnvelopeWithMeta<T, M extends ApiEnvelopeMeta>(
  data: T,
  meta: M
): ApiEnvelopeWithMeta<T, M> {
  return { data, meta }
}
