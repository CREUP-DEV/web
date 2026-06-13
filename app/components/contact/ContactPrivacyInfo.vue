<script setup lang="ts">
defineProps<{
  privacyPolicyPath: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="text-muted space-y-2 text-sm" :aria-label="t('contactPage.form.privacyInfoTitle')">
    <p class="font-medium">
      {{ t('contactPage.form.privacyInfoTitle') }}
    </p>
    <ul class="list-disc space-y-1 pl-5">
      <li>{{ t('contactPage.form.privacyInfoController') }}</li>
      <li>{{ t('contactPage.form.privacyInfoPurpose') }}</li>
      <li>{{ t('contactPage.form.privacyInfoLegalBasis') }}</li>
      <li>{{ t('contactPage.form.privacyInfoRecipients') }}</li>
      <li>{{ t('contactPage.form.privacyInfoRetention') }}</li>
      <li>{{ t('contactPage.form.privacyInfoRights') }}</li>
    </ul>
    <p>
      {{ t('contactPage.form.privacyInfoMorePrefix') }}
      <NuxtLink
        :to="privacyPolicyPath"
        class="text-primary underline underline-offset-2 hover:no-underline"
      >
        {{ t('contactPage.form.privacyInfoMoreLink') }}
      </NuxtLink>
      .
    </p>
  </div>
</template>
