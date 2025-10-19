import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  vite: { plugins: [tailwindcss()] },
  modules: [
    "@nuxt/ui",
    "@nuxt/eslint",
    "@nuxtjs/i18n",
    "@nuxt/icon",
    "@nuxt/image",
  ],

  css: ["~/assets/css/main.css"],

  i18n: {
    locales: [
      {
        code: "es",
        language: "es-ES",
        file: "es.json",
      },
      {
        code: "en",
        language: "en-US",
        file: "en.json",
      },
    ],
    defaultLocale: "es",
    strategy: "no_prefix",
  },
});
