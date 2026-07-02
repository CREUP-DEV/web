import { defineEventHandler } from 'h3'
import {
  getAssociatedMembersResponse,
  getSectorialesResponse,
} from '../../utils/public/publicMembers'

/**
 * Combined member-organisation feed for the admin "member event" organiser dropdown
 * (plan §3.1). Merges the external `asociados` and `sectoriales` lists, tags each with its
 * `source`, drops `socialNetworks`, and keeps the logo/identity fields the snapshot freezes.
 * Auth + `no-store` come from the global `/api/admin/**` middleware.
 */
export default defineEventHandler(async (event) => {
  const [associated, sectorial] = await Promise.all([
    getAssociatedMembersResponse(event),
    getSectorialesResponse(event),
  ])

  const data = [
    ...associated.members.map((member) => ({
      source: 'asociado' as const,
      id: member.id,
      denomination: member.denomination,
      initials: member.initials,
      logoLight: member.logoLight,
      logoDark: member.logoDark,
      order: member.order,
    })),
    ...sectorial.sectoriales.map((entry) => ({
      source: 'sectorial' as const,
      id: entry.id,
      denomination: entry.denomination,
      initials: entry.initials,
      logoLight: entry.logoLight,
      logoDark: entry.logoDark,
      order: entry.order,
    })),
  ]

  return {
    data,
    meta: { generatedAt: associated.generatedAt ?? sectorial.generatedAt ?? null },
  }
})
