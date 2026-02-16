import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss() as never],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (
              id.includes('node_modules/.pnpm/@iconify') ||
              id.includes('node_modules/@iconify/')
            ) {
              return 'vendor_icons'
            }

            if (
              id.includes('node_modules/.pnpm/reka-ui') ||
              id.includes('node_modules/reka-ui/') ||
              id.includes('node_modules/.pnpm/@floating-ui') ||
              id.includes('node_modules/@floating-ui/')
            ) {
              return 'vendor_reka'
            }

            if (
              id.includes('node_modules/.pnpm/tailwind-variants') ||
              id.includes('node_modules/tailwind-variants/') ||
              id.includes('node_modules/.pnpm/tailwind-merge') ||
              id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/.pnpm/class-variance-authority') ||
              id.includes('node_modules/class-variance-authority/')
            ) {
              return 'vendor_ui_styles'
            }
          },
        },
      },
    },
  },
  alias: {
    '@/composables': './app/composables',
  },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    '@nuxt/a11y',
    'nuxt-umami',
  ],

  icon: {
    provider: 'server',
    mode: 'css',
    collections: ['tabler', 'circle-flags', 'lucide'],
    serverBundle: {
      collections: ['tabler', 'circle-flags', 'lucide'],
    },
    fallbackToApi: false,
  },

  runtimeConfig: {
    externalMembersApiBaseUrl: process.env.EXTERNAL_MEMBERS_API_BASE_URL || '',
  },

  css: ['~/assets/css/main.css'],

  // Nuxt SEO Configuration
  site: {
    url: 'https://www.creup.es',
    name: 'CREUP',
    description:
      'Coordinadora de Representantes de Estudiantes de Universidades Públicas - Representando a más de 1.000.000 de estudiantes en toda España.',
    twitter: '@CREUPCREUP',
  },

  // OG Image configuration
  ogImage: {
    defaults: {
      component: 'OgImageDefault',
      width: 1200,
      height: 630,
    },
  },

  // Sitemap configuration
  sitemap: {
    autoLastmod: true,
    xsl: false,
  },

  // Robots configuration
  robots: {
    allow: ['/'],
    disallow: ['/api/', '/_nuxt/', '/admin/'],
  },

  // Link checker (disabled in dev for performance)
  linkChecker: {
    enabled: false,
  },

  i18n: {
    locales: [
      {
        code: 'es',
        language: 'es-ES',
        file: 'es.json',
        name: 'Español',
      },
      {
        code: 'en',
        language: 'en-GB',
        file: 'en.json',
        name: 'English',
      },
    ],
    defaultLocale: 'es',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'user-locale',
    },
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    componentIslands: true,
  },

  // Nitro optimizations
  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: false,
      failOnError: false,
    },
  },

  // Image optimization
  image: {
    quality: 80,
    format: ['webp', 'avif', 'png', 'jpg'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },

  // Accessibility testing (dev only)
  a11y: {
    enabled: process.env.NODE_ENV !== 'production',
    defaultHighlight: false,
    logIssues: true,
  },

  // Umami Analytics — consent-gated, no auto-tracking until accepted
  // Set NUXT_UMAMI_HOST and NUXT_UMAMI_ID in .env when ready
  umami: {
    autoTrack: false,
    ignoreLocalhost: true,
    proxy: 'cloak',
  },
})
