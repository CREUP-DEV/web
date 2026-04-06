import {
  getEmailData as resolveEmailData,
  getSocialButtons as resolveSocialButtons,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'

export interface PersonBase {
  name: string
  surname: string
  email: string
  socialNetworks: SocialNetworkEntry[]
}

export function usePersonHelpers() {
  const { t } = useI18n()

  const getFullName = (person: Pick<PersonBase, 'name' | 'surname'>) =>
    [person.name, person.surname].filter(Boolean).join(' ').trim()

  const getDisplayName = (person: Pick<PersonBase, 'name' | 'surname' | 'email'>) =>
    getFullName(person) || person.email

  const getContactEmail = (person: PersonBase) =>
    resolveEmailData(person.socialNetworks, person.email)?.email ?? ''

  const getSocialButtons = (person: Pick<PersonBase, 'socialNetworks'>) =>
    resolveSocialButtons(person.socialNetworks)

  const getCopyEmailAriaLabel = (email: string) => `${t('common.copyEmail')}: ${email}`

  return {
    getFullName,
    getDisplayName,
    getContactEmail,
    getSocialButtons,
    getCopyEmailAriaLabel,
  }
}
