import tailwindcss from '@tailwindcss/vite'
import type { NitroRouteConfig } from 'nitropack/types'
import type { NuxtSecurityRouteRules } from 'nuxt-security'
import { getOptionalConfigUrl } from './shared/utils/config'
import { INTERNAL_IMAGE_PROXY_PATH_BASES } from './shared/constants/assetPaths'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from './shared/constants/locales'

const isDev = process.env.NODE_ENV !== 'production'

const siteUrl =
  getOptionalConfigUrl(process.env.NUXT_SITE_URL, 'NUXT_SITE_URL') || 'http://localhost:3000'
const siteHostname = new URL(siteUrl).hostname
const canonicalSiteUrl = siteUrl
const siteImageHostname = siteHostname
const umamiHost = getOptionalConfigUrl(process.env.NUXT_UMAMI_HOST, 'NUXT_UMAMI_HOST')
const umamiOrigin = umamiHost ? new URL(umamiHost).origin : null
const productionPublicSWRPagePaths = [
  '/transparencia/igualdad',
  '/transparencia/informes-economicos',
  '/transparencia/mic',
  '/legal',
] as const
const productionFastChangingPagePaths = [
  '/conocenos/comites',
  '/conocenos/equipo',
  '/conocenos/equipo/**',
  '/conocenos/eventos',
  '/conocenos/eventos/**',
  '/conocenos/miembros',
  '/conocenos/que-es',
  '/comision-de-asuntos-sectoriales',
  '/politica/informes-ejecutivos',
  '/politica/posicionamientos',
  '/politica/resoluciones',
  '/transparencia/normativa',
] as const

const buildSWRRouteRules = (paths: readonly string[], ttlSeconds: number) =>
  Object.fromEntries(paths.map((path) => [path, { swr: ttlSeconds }]))

const buildNoRateLimitRouteRules = (paths: readonly string[]) =>
  Object.fromEntries(paths.map((path) => [`${path}/**`, { security: { rateLimiter: false } }]))

const ADMIN_UPLOAD_SECURITY_MAX_REQUEST_BYTES = 24 * 1024 * 1024
const adminUploadRoutePaths = [
  '/api/admin/about/upload',
  '/api/admin/equality/upload',
  '/api/admin/financial-reports/upload',
  '/api/admin/home/upload',
  '/api/admin/media/upload',
  '/api/admin/newsletter/upload',
  '/api/admin/press/upload',
  '/api/admin/press-dossier/upload',
] as const
const adminUploadRouteRules = Object.fromEntries(
  adminUploadRoutePaths.map((path) => [
    path,
    {
      security: {
        requestSizeLimiter: {
          maxUploadFileRequestInBytes: ADMIN_UPLOAD_SECURITY_MAX_REQUEST_BYTES,
        },
      },
    },
  ])
)

const productionPublicSWRRouteRules = isDev
  ? {}
  : buildSWRRouteRules(productionPublicSWRPagePaths, 3600)

const productionFastChangingPageRouteRules = isDev
  ? {}
  : buildSWRRouteRules(productionFastChangingPagePaths, 300)

const adminNoIndexHeaders = {
  headers: {
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  },
}
const localizedAdminRouteRules = Object.fromEntries(
  SUPPORTED_LOCALE_CODES.filter((code) => code !== DEFAULT_LOCALE_CODE).map((code) => [
    `/${code}/admin/**`,
    adminNoIndexHeaders,
  ])
)
const adminRobotsDisallow = [
  '/admin/',
  ...SUPPORTED_LOCALE_CODES.filter((code) => code !== DEFAULT_LOCALE_CODE).map(
    (code) => `/${code}/admin/`
  ),
]

const routeRules = {
  '/admin/**': adminNoIndexHeaders,
  // Localized admin routes (prefix_except_default) must be excluded from indexing too.
  ...localizedAdminRouteRules,
  '/api/**': {
    headers: {
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  },
  '/_ipx/**': {
    security: {
      rateLimiter: false,
    },
  },
  ...adminUploadRouteRules,
  ...buildNoRateLimitRouteRules(INTERNAL_IMAGE_PROXY_PATH_BASES),
  ...productionPublicSWRRouteRules,
  ...productionFastChangingPageRouteRules,
  '/_nuxt/**': {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
} satisfies Record<string, NitroRouteConfig & { security?: NuxtSecurityRouteRules }>

// Always use the internal Nitro server address for IPX to fetch source images.
// Handles both static public-dir files and dynamic server routes (external API proxies)
// without depending on the external site URL, which is unreachable from within the container.
const ipxInternalOrigin = `http://localhost:${process.env.PORT || 3000}`
const internalImageAlias = Object.fromEntries(
  INTERNAL_IMAGE_PROXY_PATH_BASES.map((path) => [path, `${ipxInternalOrigin}${path}`])
)

const siteName = 'CREUP'
const siteDescription =
  'Coordinadora de Representantes de Estudiantes de Universidades Públicas - Representando a más de 1.000.000 de estudiantes en toda España.'
const adminAuthHandler = './server/handlers/admin-auth.ts'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-04-09',
  devtools: { enabled: isDev },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: isDev ? ['localhost', '127.0.0.1', '.trycloudflare.com'] : undefined,
    },
    build: {
      // Framework vendor (Vue + reka-ui) and the already-lazy rich-text editor
      // chunk exceed Vite's default 500 kB raw-size warning; they are split and
      // cached/loaded on demand, so raise the threshold to silence the noise.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) {
              return
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
  imports: {
    dirs: ['composables/**'],
  },
  modules: [
    'nuxt-security',
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    '@nuxt/a11y',
    'nuxt-umami',
  ],

  security: {
    nonce: true,
    rateLimiter: {
      tokensPerInterval: 500,
      interval: 300000,
    },
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'nonce-{{nonce}}'",
          "'strict-dynamic'",
          'https://challenges.cloudflare.com',
          "'sha256-wrGO/XlWuOftY7acUwy9OWAcCMeVCUtdtyCfbtKZTus='",
        ],
        'style-src': ["'self'", "'unsafe-inline'"],
        'style-src-attr': ["'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https://lh3.googleusercontent.com'],
        'font-src': ["'self'", 'data:'],
        'connect-src': [
          "'self'",
          ...(umamiOrigin ? [umamiOrigin] : []),
          'https://challenges.cloudflare.com',
        ],
        'report-uri': ['/api/csp-report'],
        'frame-src': [
          ...(isDev ? ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'] : []),
          'https://challenges.cloudflare.com',
        ],
        'frame-ancestors': ['https://firu.es', 'https://www.firu.es'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: 'cross-origin',
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubdomains: true,
      },
      xContentTypeOptions: 'nosniff',
      xFrameOptions: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
      },
    },
  },

  icon: {
    provider: 'server',
    fallbackToApi: false,
    collections: ['tabler', 'circle-flags', 'lucide'],
    serverBundle: {
      collections: ['tabler', 'circle-flags', 'lucide'],
    },
  },

  runtimeConfig: {
    externalApiBaseUrl: process.env.NUXT_EXTERNAL_API_BASE_URL,
    externalAssetBaseUrl:
      process.env.NUXT_EXTERNAL_ASSET_BASE_URL || process.env.NUXT_EXTERNAL_API_BASE_URL,
    externalAssetProxyAllowedOrigins:
      process.env.NUXT_EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS ||
      process.env.NUXT_EXTERNAL_ASSET_BASE_URL ||
      process.env.NUXT_EXTERNAL_API_BASE_URL,
    externalAssetProxyTimeoutMs: process.env.NUXT_EXTERNAL_ASSET_PROXY_TIMEOUT_MS,
    externalAssetProxyImageMaxBytes: process.env.NUXT_EXTERNAL_ASSET_PROXY_IMAGE_MAX_BYTES,
    externalAssetProxyPdfMaxBytes: process.env.NUXT_EXTERNAL_ASSET_PROXY_PDF_MAX_BYTES,
    externalApiCacheMaxAgeSeconds: process.env.NUXT_EXTERNAL_API_CACHE_MAX_AGE_SECONDS,
    externalApiCacheStaleSeconds: process.env.NUXT_EXTERNAL_API_CACHE_STALE_SECONDS,
    redisUrl: process.env.NUXT_REDIS_URL,
    siteUrl: siteUrl,
    umamiHost: umamiHost ?? undefined,
    smtpHost: process.env.NUXT_SMTP_HOST,
    smtpPort: process.env.NUXT_SMTP_PORT,
    smtpSecure: process.env.NUXT_SMTP_SECURE,
    smtpUser: process.env.NUXT_SMTP_USER,
    smtpPass: process.env.NUXT_SMTP_PASS,
    smtpFromEmail: process.env.NUXT_SMTP_FROM_EMAIL,
    smtpToEmail: process.env.NUXT_SMTP_TO_EMAIL,
    smtpPressEmail: process.env.NUXT_SMTP_PRESS_EMAIL,
    googleCalendarApiKey: process.env.NUXT_GOOGLE_CALENDAR_API_KEY,
    googleCalendarId: process.env.NUXT_GOOGLE_CALENDAR_ID,
    turnstileSecretKey: process.env.NUXT_TURNSTILE_SECRET_KEY,
    public: {
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
      siteUrl: siteUrl,
    },
  },

  nitro: {
    compressPublicAssets: false,
  },

  css: ['~/assets/css/main.css'],

  // Nuxt SEO Configuration
  site: {
    url: canonicalSiteUrl,
    name: siteName,
    description: siteDescription,
    defaultLocale: 'es',
    trailingSlash: false,
    env: isDev ? 'development' : 'production',
    indexable: !isDev,
    twitter: '@CREUPCREUP',
  },

  ogImage: {
    enabled: false,
  },

  // Sitemap configuration
  sitemap: {
    autoLastmod: false,
    sitemaps: {
      main: {
        includeAppSources: true,
        sources: ['/api/__sitemap__/urls'],
      },
      press: {
        sources: ['/api/__sitemap__/press-articles'],
        chunks: 1000,
      },
    },
    xsl: false,
  },

  // Robots configuration
  robots: {
    allow: ['/'],
    disallow: [...adminRobotsDisallow, '/api/', '/_ipx/'],
  },

  routeRules,

  serverHandlers: [
    {
      route: '/api/admin/**',
      middleware: true,
      handler: adminAuthHandler,
    },
  ],

  i18n: {
    vueI18n: './i18n.config.ts',
    locales: [
      {
        code: 'es',
        language: 'es-ES',
        file: 'es.json',
        name: 'Español',
        flag: 'i-circle-flags-es',
      },
      {
        code: 'en',
        language: 'en-GB',
        file: 'en.json',
        name: 'English',
        flag: 'i-circle-flags-gb',
      },
      {
        code: 'ca',
        language: 'ca-ES',
        file: 'ca.json',
        name: 'Català',
        flag: 'i-circle-flags-es-ct',
      },
    ],
    defaultLocale: 'es',
    baseUrl: canonicalSiteUrl,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    componentIslands: true,
  },

  // Font optimization
  fonts: {
    defaults: {
      subsets: ['latin'],
    },
    families: [
      {
        name: 'Raleway',
        provider: 'google',
        global: true,
        weights: [400, 700],
        styles: ['normal', 'italic'],
        subsets: ['latin'],
      },
      {
        name: 'Red Rose',
        provider: 'none',
      },
      {
        name: 'Fira Code',
        provider: 'none',
      },
    ],
  },

  // Image optimization
  image: {
    quality: 80,
    format: ['webp', 'avif', 'png', 'jpg'],
    domains: Array.from(new Set([siteImageHostname, 'localhost', '127.0.0.1'])),
    alias: internalImageAlias,
    ipx: {
      maxAge: 60 * 60 * 24 * 30,
      http: {
        maxAge: 60 * 60 * 24 * 30,
        ignoreCacheControl: true,
      },
    },
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
    enabled: isDev,
    defaultHighlight: false,
    logIssues: true,
  },

  // Umami Analytics — self-hosted, cookie-free measurement
  umami: {
    autoTrack: true,
    host: umamiHost ?? undefined,
    ignoreLocalhost: true,
    proxy: 'cloak',
  },
})
