import { defineEventHandler } from 'h3'
import { getTeamAreasResponse } from '../../utils/public/publicMembers'

/**
 * Lightweight org-chart areas feed for the admin area-report dropdown (plan §3.1).
 * Reuses the SWR-cached org-chart loader and trims the payload to the fields the
 * snapshot/dropdown need (no `members`). Auth + `no-store` come from the global
 * `/api/admin/**` middleware.
 */
export default defineEventHandler(async (event) => {
  const { areas, generatedAt } = await getTeamAreasResponse(event)

  return {
    data: areas.map((area) => ({
      id: area.id,
      name: area.name,
      nameTranslations: area.nameTranslations,
      order: area.order,
    })),
    meta: { generatedAt },
  }
})
