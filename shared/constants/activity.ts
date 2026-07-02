export const ACTIVITY_KINDS = ['creup', 'member'] as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const MEMBER_ORG_SOURCES = ['asociado', 'sectorial'] as const

export type MemberOrgSource = (typeof MEMBER_ORG_SOURCES)[number]

/** Public routes (unlocalized base; localize with useLocalePath on the client). */
export const ACTIVITY_PUBLIC_BASE_PATH = '/transparencia/actividad'
export const AREA_REPORTS_PUBLIC_BASE_PATH = '/transparencia/actividad/informes'
