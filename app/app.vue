<script setup>
import * as locales from "@nuxt/ui/locale";

const { locale, t } = useI18n();

const lang = computed(() => locales[locale.value].code);
const dir = computed(() => locales[locale.value].dir);

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
  title: () => t("meta.title"),
  meta: [{ name: "description", content: () => t("meta.description") }],
});
</script>

<template>
  <UApp :locale="locales[locale]">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
