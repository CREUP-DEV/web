import type { H3Event } from 'h3'
import type { AreaNameSnapshot, MemberOrgSnapshot, MemberOrgSource } from '../../db/schema/activity'
import {
  getAssociatedMembersResponse,
  getSectorialesResponse,
  getTeamAreasResponse,
} from '../public/publicMembers'

/**
 * Snapshot resolvers (plan §3.2 / §5.4). The admin client only ever sends a *reference*
 * (an `areaId`, or a `memberOrgSource` + `id`). The server resolves it against the current
 * org-chart / member lists — through the same SWR-cached loaders the dropdowns use (plan §5.5,
 * no force-fresh) — and freezes the result into the row. Published rows always render from the
 * frozen snapshot, never re-resolved against the live chart.
 *
 * Each resolver returns `null` when the reference no longer exists so callers can surface a 4xx.
 */

export interface AreaSnapshotResult {
  areaId: number
  areaNameSnapshot: AreaNameSnapshot
  areaOrderSnapshot: number | null
}

export async function resolveAreaSnapshot(
  event: H3Event,
  areaId: number
): Promise<AreaSnapshotResult | null> {
  const { areas } = await getTeamAreasResponse(event)
  const area = areas.find((candidate) => candidate.id === areaId)
  if (!area) {
    return null
  }

  return {
    areaId: area.id,
    areaNameSnapshot: area.nameTranslations,
    areaOrderSnapshot: area.order ?? null,
  }
}

export interface MemberOrgSnapshotResult {
  memberOrgSource: MemberOrgSource
  memberOrgId: string
  memberOrgSnapshot: MemberOrgSnapshot
}

export async function resolveMemberOrgSnapshot(
  event: H3Event,
  source: MemberOrgSource,
  id: string
): Promise<MemberOrgSnapshotResult | null> {
  if (source === 'asociado') {
    const { members } = await getAssociatedMembersResponse(event)
    const member = members.find((candidate) => candidate.id === id)
    if (!member) {
      return null
    }

    return {
      memberOrgSource: source,
      memberOrgId: member.id,
      memberOrgSnapshot: {
        denomination: member.denomination,
        initials: member.initials,
        logoLight: member.logoLight,
        logoDark: member.logoDark,
      },
    }
  }

  const { sectoriales } = await getSectorialesResponse(event)
  const sectorial = sectoriales.find((candidate) => candidate.id === id)
  if (!sectorial) {
    return null
  }

  return {
    memberOrgSource: source,
    memberOrgId: sectorial.id,
    memberOrgSnapshot: {
      denomination: sectorial.denomination,
      initials: sectorial.initials,
      logoLight: sectorial.logoLight,
      logoDark: sectorial.logoDark,
    },
  }
}
