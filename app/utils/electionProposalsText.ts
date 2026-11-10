import { DEFAULT_LOCALE_CODE, type SupportedLocaleCode } from '~~/shared/constants/locales'
import type { ElectionProposalsText } from '~~/shared/constants/electionProposals'
import { pickLocalizedValue } from '~~/shared/utils/locale'

type ElectionProposalsTextLoader = () => Promise<{ default: ElectionProposalsText }>

// Plain data rather than i18n messages, like the student rights guide (see `loadStudentRightsText`):
// the document is long and only this page needs it. `satisfies` makes a locale without its file, or
// a file missing a block or a proposal, fail the typecheck; one chunk per language.
const ELECTION_PROPOSALS_TEXT_LOADERS = {
  es: () => import('@/content/electionProposals/es.json'),
  en: () => import('@/content/electionProposals/en.json'),
  ca: () => import('@/content/electionProposals/ca.json'),
  eu: () => import('@/content/electionProposals/eu.json'),
  gl: () => import('@/content/electionProposals/gl.json'),
  val: () => import('@/content/electionProposals/val.json'),
} satisfies Record<SupportedLocaleCode, ElectionProposalsTextLoader>

export async function loadElectionProposalsText(
  locale: string,
  fallbackLocale: string
): Promise<ElectionProposalsText> {
  const load =
    pickLocalizedValue<ElectionProposalsTextLoader>(
      ELECTION_PROPOSALS_TEXT_LOADERS,
      locale,
      fallbackLocale,
      DEFAULT_LOCALE_CODE
    ) ?? ELECTION_PROPOSALS_TEXT_LOADERS[DEFAULT_LOCALE_CODE]

  return (await load()).default
}
