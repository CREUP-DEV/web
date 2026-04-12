export const EXTERNAL_EVENT_TYPES = [
  'Asamblea',
  'Congreso y Encuentro',
  'Stage Formativo',
  'Otro',
] as const

export type ExternalEventType = (typeof EXTERNAL_EVENT_TYPES)[number]

export const getEventTypeI18nKey = (eventType: string | null | undefined): string | null => {
  const normalized = typeof eventType === 'string' ? eventType.trim() : ''

  switch (normalized) {
    case 'Asamblea':
      return 'events.types.asamblea'
    case 'Congreso y Encuentro':
      return 'events.types.congresoYEncuentro'
    case 'Stage Formativo':
      return 'events.types.stageFormativo'
    case 'Otro':
      return 'events.types.otro'
    default:
      return null
  }
}
