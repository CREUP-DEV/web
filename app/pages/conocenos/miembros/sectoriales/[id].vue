<script setup lang="ts">
import type { SectorialMemberDetailResponse } from '@/types/members'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { copyToClipboard } = useCopyToClipboard()

const localeApiHeaders = useLocaleApiHeaders()
const { buildSectorialDetailData } = useOrganizationDetailData()

const id = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
})

const sectorialUrl = computed(() => `/api/sectoriales/${id.value || ''}`)

const { data, error } = await useFetch(sectorialUrl, {
  headers: localeApiHeaders,
})

const sectorial = computed(
  () => (data.value as SectorialMemberDetailResponse | null | undefined)?.sectorial ?? null
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    fatal: true,
    message: error.value.statusCode === 404 ? t('error.notFound') : t('members.loadError'),
  })
}

const detailData = computed(() => buildSectorialDetailData(sectorial.value!))
const pageTitle = computed(() => sectorial.value?.denomination || t('members.unknownDenomination'))

useSeoMeta({
  title: () => `${pageTitle.value} | CREUP`,
  description: () => sectorial.value?.description ?? t('members.sectoriales.description'),
})

const backTo = computed(() => ({
  path: localePath('/conocenos/miembros'),
  hash: '#sectoriales-list',
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
