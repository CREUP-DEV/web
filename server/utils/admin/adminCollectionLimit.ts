import type { H3Event } from 'h3'
import { logWarn } from '../core/logger'

interface AdminCollectionCapMeta {
  limit: number
  offset: number
  total: number
}

export function logAdminCollectionCapHit(
  event: H3Event,
  namespace: string,
  meta: AdminCollectionCapMeta
) {
  if (meta.offset + meta.limit >= meta.total) {
    return
  }

  logWarn('admin-collection.limit-hit', { namespace, ...meta }, event)
}
