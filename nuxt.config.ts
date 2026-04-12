import tailwindcss from '@tailwindcss/vite'
import { getOptionalConfigUrl, requireConfigUrl } from './shared/utils/config'
import { INTERNAL_IMAGE_PROXY_PATH_BASES } from './shared/constants/assetPaths'

const isDev = process.env.NODE_ENV !== 'production'
const appSecret = process.env.APP_SECRET?.trim() || undefined
const siteUrl = isDev
  ? requireConfigUrl(process.env.SITE_URL || 'http://localhost:3000', 'SITE_URL')
  : requireConfigUrl(process.env.SITE_URL, 'SITE_URL')
const canonicalSiteUrl =
  isDev && ['localhost', '127.0.0.1'].includes(new URL(siteUrl).hostname)
    ? 'https://www.creup.es'
    : siteUrl
const siteImageHostname = new URL(siteUrl).hostname
const siteOrigin = new URL(siteUrl).origin
const umamiHost = getOptionalConfigUrl(process.env.NUXT_UMAMI_HOST, 'NUXT_UMAMI_HOST')
const umamiOrigin = umamiHost ? new URL(umamiHost).origin : null
const turnstileSiteKey = process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
const turnstileEnabled = turnstileSiteKey.length > 0
const turnstileOrigin = 'https://challenges.cloudflare.com'
const connectSrcDirectives = [
  "'self'",
  ...(umamiOrigin && umamiOrigin !== siteOrigin ? [umamiOrigin] : []),
  ...(turnstileEnabled ? [turnstileOrigin] : []),
]
const scriptSrcDirectives = [
  "'self'",
  "'unsafe-inline'",
  ...(turnstileEnabled ? [turnstileOrigin] : []),
]
const frameSrcDirectives = turnstileEnabled ? [turnstileOrigin] : ["'none'"]
const imgSrcDirectives = ["'self'", 'data:', 'blob:', 'https://lh3.googleusercontent.com']
const contentSecurityPolicyHeader = [
  "default-src 'self'",
  `script-src ${scriptSrcDirectives.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrcDirectives.join(' ')}`,
  "font-src 'self' data:",
  `connect-src ${connectSrcDirectives.join(' ')}`,
  `frame-src ${frameSrcDirectives.join(' ')}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const internalImageAlias = Object.fromEntries(
  INTERNAL_IMAGE_PROXY_PATH_BASES.map((path) => [path, `${siteOrigin}${path}`])
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
      // Vite 7 requires localhost to be listed explicitly when allowedHosts is an array
      allowedHosts: isDev ? ['localhost', '127.0.0.1', '.trycloudflare.com'] : undefined,
    },
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        'better-auth/vue',
        '@formkit/auto-animate/vue',
        'sortablejs',
        '@internationalized/date',
        'zod',
        'photoswipe/lightbox',
        'photoswipe',
      ],
    },
    build: {
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
  modules: [
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

  icon: {
    provider: 'server',
    fallbackToApi: false,
    collections: ['tabler', 'circle-flags', 'lucide'],
  },

  runtimeConfig: {
    externalApiBaseUrl: process.env.EXTERNAL_API_BASE_URL,
    externalAssetProxyAllowedOrigins:
      process.env.EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS || process.env.EXTERNAL_API_BASE_URL,
    externalAssetProxyTimeoutMs: process.env.EXTERNAL_ASSET_PROXY_TIMEOUT_MS,
    externalAssetProxyImageMaxBytes: process.env.EXTERNAL_ASSET_PROXY_IMAGE_MAX_BYTES,
    externalAssetProxyPdfMaxBytes: process.env.EXTERNAL_ASSET_PROXY_PDF_MAX_BYTES,
    externalApiCacheMaxAgeSeconds: process.env.EXTERNAL_API_CACHE_MAX_AGE_SECONDS,
    externalApiCacheStaleSeconds: process.env.EXTERNAL_API_CACHE_STALE_SECONDS,
    redisUrl: process.env.REDIS_URL,
    siteUrl,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpSecure: process.env.SMTP_SECURE,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFromEmail: process.env.SMTP_FROM_EMAIL,
    smtpToEmail: process.env.SMTP_TO_EMAIL,
    smtpPressEmail: process.env.SMTP_PRESS_EMAIL,
    googleCalendarApiKey: process.env.GOOGLE_CALENDAR_API_KEY,
    googleCalendarId: process.env.GOOGLE_CALENDAR_ID,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    public: {
      turnstileSiteKey,
    },
  },

  nitro: {
    storage: {
      cache: {
        driver: 'redis',
        url: process.env.REDIS_URL,
        base: 'creup:web:cache',
      },
    },
    compressPublicAssets: true,
    prerender: {
      crawlLinks: false,
      failOnError: true,
    },
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

  // OG Image configuration
  ogImage: {
    security: {
      secret: appSecret,
    },
    defaults: {
      width: 1200,
      height: 630,
    },
  },

  // Sitemap configuration
  sitemap: {
    autoLastmod: true,
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
    disallow: ['/admin/'],
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        // CSP: unsafe-inline still required by Nuxt SSR inline scripts + Tailwind CSS-in-JS.
        // unsafe-eval has been removed — if a dependency reintroduces it, audit before re-adding.
        // TODO: replace unsafe-inline with a nonce strategy once Nuxt supports it end-to-end.
        'Content-Security-Policy': contentSecurityPolicyHeader,
      },
    },
    '/admin/**': {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    },
    '/api/**': {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    },
    '/_nuxt/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  },

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
    ],
    defaultLocale: 'es',
    baseUrl: canonicalSiteUrl,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'user-locale',
      fallbackLocale: 'es',
      redirectOn: 'root',
    },
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    componentIslands: true,
  },

  // Image optimization
  image: {
    quality: 80,
    format: ['webp', 'avif', 'png', 'jpg'],
    domains: Array.from(new Set([siteImageHostname, 'localhost', '127.0.0.1'])),
    alias: internalImageAlias,
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
