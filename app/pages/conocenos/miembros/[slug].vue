<script setup lang="ts">
import type { OrganizationMemberDetailResponse } from '@/types/members'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { copyToClipboard } = useCopyToClipboard()

const localeApiHeaders = useLocaleApiHeaders()
const { buildMemberDetailData } = useOrganizationDetailData()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] : raw
})

const memberUrl = computed(() => `/api/members/${slug.value || ''}`)

const { data, error } = await useFetch(memberUrl, {
  headers: localeApiHeaders,
})

const member = computed(
  () => (data.value as OrganizationMemberDetailResponse | null | undefined)?.member ?? null
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    fatal: true,
    message: error.value.statusCode === 404 ? t('error.notFound') : t('members.loadError'),
  })
}

const detailData = computed(() => buildMemberDetailData(member.value!))
const pageTitle = computed(
  () =>
    `${member.value?.university || t('members.unknownUniversity')} · ${member.value?.denomination || t('members.unknownDenomination')}`
)

useSeoMeta({
  title: () => `${pageTitle.value} | CREUP`,
  description: () => member.value?.description ?? t('members.description'),
})

const backTo = computed(() => ({
  path: localePath('/conocenos/miembros'),
  hash: '#members-list',
}))

const copyEmail = (email: string) => copyToClipboard(email, t('common.emailCopied'))
</script>

<template>
  <MembersOrganizationDetailPage
    :back-to="backTo"
    :title="pageTitle"
    :description="t('members.memberModalDescription')"
    :detail-data="detailData"
    @copy-email="copyEmail"
  />
</template>
