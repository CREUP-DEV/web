import { DEFAULT_LOCALE_CODE, type SupportedLocaleCode } from '~~/shared/constants/locales'
import type { StudentRightsText } from '~~/shared/constants/studentRightsGuide'
import { pickLocalizedValue } from '~~/shared/utils/locale'

type StudentRightsTextLoader = () => Promise<{ default: StudentRightsText }>

// The guide's text is plain data rather than i18n messages: the i18n compiler turns every message
// into code for the client and the server build, and these ~1,900 would be loaded on every page.
// `satisfies` makes a locale without its file, or a file missing a section or right, fail the
// typecheck; one chunk per language means a visitor downloads only the one they read.
const STUDENT_RIGHTS_TEXT_LOADERS = {
  es: () => import('@/content/studentRights/es.json'),
  en: () => import('@/content/studentRights/en.json'),
  ca: () => import('@/content/studentRights/ca.json'),
  eu: () => import('@/content/studentRights/eu.json'),
  gl: () => import('@/content/studentRights/gl.json'),
  val: () => import('@/content/studentRights/val.json'),
} satisfies Record<SupportedLocaleCode, StudentRightsTextLoader>

export async function loadStudentRightsText(
  locale: string,
  fallbackLocale: string
): Promise<StudentRightsText> {
  const load =
    pickLocalizedValue<StudentRightsTextLoader>(
      STUDENT_RIGHTS_TEXT_LOADERS,
      locale,
      fallbackLocale,
      DEFAULT_LOCALE_CODE
    ) ?? STUDENT_RIGHTS_TEXT_LOADERS[DEFAULT_LOCALE_CODE]

  return (await load()).default
}
