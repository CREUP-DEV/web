// Shared admin-facing error messages (Spanish, admin-only per AGENTS.md).

/** Generic 404 for admin resource lookups. Resource-specific copy (e.g. 'Etiqueta no encontrada') stays inline. */
export const ADMIN_NOT_FOUND_MESSAGE = 'No encontrado'

/** Default optimistic-lock 409 message used by `assertOptimisticLock` when a caller passes none. */
export const ADMIN_OPTIMISTIC_LOCK_MESSAGE =
  'El registro fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.'
