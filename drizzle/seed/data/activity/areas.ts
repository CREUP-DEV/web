/**
 * Frozen area-identity snapshots for the two mandates the migrated newsletters span.
 *
 * `areaId` is a soft reference (not an FK) holding the org chart's `area_term_id`, which is unique
 * across the whole mandate history — unlike `area_id`, which comes back as 0 for past mandates.
 * The frozen `areaNameSnapshot` is what the public area-report renders, so these ids only ever
 * matter for matching the entry back to the catalog when a report is edited.
 */
import type { SeedAreaSnapshot } from './types'

/** Current mandate — used by the 2026-01 and 2026-02 newsletters. */
export const CURRENT_AREAS = {
  PRESIDENCIA: {
    areaId: 1,
    areaNameSnapshot: { es: 'Presidencia', en: 'Presidency' },
    areaOrderSnapshot: 1,
  },
  SECRETARIA: {
    areaId: 2,
    areaNameSnapshot: {
      es: 'Secretaría Ejecutiva y Dirección de Gabinete',
      en: 'Secretariat and Chief of Staff Office',
    },
    areaOrderSnapshot: 2,
  },
  TESORERIA: {
    areaId: 3,
    areaNameSnapshot: { es: 'Tesorería', en: 'Treasury' },
    areaOrderSnapshot: 3,
  },
  COMUNICACION: {
    areaId: 4,
    areaNameSnapshot: { es: 'Comunicación', en: 'Communications' },
    areaOrderSnapshot: 4,
  },
  POLITICA: {
    areaId: 5,
    areaNameSnapshot: { es: 'Política Universitaria', en: 'University Policy' },
    areaOrderSnapshot: 5,
  },
  COORDINACION: {
    areaId: 6,
    areaNameSnapshot: {
      es: 'Coordinación Interna y Formación',
      en: 'Internal Coordination and Training',
    },
    areaOrderSnapshot: 6,
  },
  ORGANIZACION: {
    areaId: 7,
    areaNameSnapshot: { es: 'Organización', en: 'Organization' },
    areaOrderSnapshot: 7,
  },
} as const satisfies Record<string, SeedAreaSnapshot>

/** Previous mandate (2024-05-12 → 2025-11-22) — used by every newsletter up to and including 2025-11. */
export const PREVIOUS_AREAS = {
  PRESIDENCIA: {
    areaId: 8,
    areaNameSnapshot: { es: 'Presidencia', en: 'Presidency' },
    areaOrderSnapshot: 1,
  },
  SECRETARIA: {
    areaId: 9,
    areaNameSnapshot: { es: 'Secretaría', en: 'Secretary' },
    areaOrderSnapshot: 2,
  },
  TESORERIA: {
    areaId: 10,
    areaNameSnapshot: { es: 'Tesorería', en: 'Treasury' },
    areaOrderSnapshot: 3,
  },
  RRII: {
    areaId: 11,
    areaNameSnapshot: {
      es: 'Relaciones Institucionales y Proyectos',
      en: 'Institutional Relations and Projects',
    },
    areaOrderSnapshot: 4,
  },
  POLITICA: {
    areaId: 12,
    areaNameSnapshot: { es: 'Política Universitaria', en: 'University Policy' },
    areaOrderSnapshot: 5,
  },
  ORGANIZACION: {
    areaId: 13,
    areaNameSnapshot: { es: 'Organización', en: 'Organization' },
    areaOrderSnapshot: 6,
  },
  COMUNICACION: {
    areaId: 14,
    areaNameSnapshot: { es: 'Comunicación', en: 'Communications' },
    areaOrderSnapshot: 7,
  },
} as const satisfies Record<string, SeedAreaSnapshot>
