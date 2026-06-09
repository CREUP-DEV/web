/**
 * Database seed script for Drizzle ORM
 * Run with: pnpm db:seed
 */

import 'dotenv/config'
import { existsSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../server/db/schema'
import { requireConfigString } from '../shared/utils/config'
import { dateValueToDateOnly } from '../shared/utils/date'
import {
  ABOUT_HERO_DEFAULT_IMAGE,
  EQUALITY_DOCUMENTS_PUBLIC_PATH,
  FINANCIAL_REPORTS_PUBLIC_PATH,
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
  HOME_CAROUSEL_SITE_DEFAULT_PUBLIC_PATH,
  HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
  PRESS_DEFAULT_COVERS_PUBLIC_PATH,
  PRESS_DOCUMENT_PUBLIC_PATH,
  PRESS_MEDIA_LOGO_PUBLIC_PATH,
  PRESS_DOSSIER_PUBLIC_PATH,
} from '../shared/constants/assetPaths'
import { slugify } from '../server/utils/core/slug'
import { sanitizeRichTextHtml } from '../server/utils/press/pressTranslation'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '../shared/constants/siteDefaultImages'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')
const db = drizzle(connectionString, { schema })

const buildHomeImagePath = (publicPath: string, title: string) =>
  `${publicPath}/${slugify(title) || 'imagen'}.webp`

const padMonth = (month: number) => String(month).padStart(2, '0')

const buildNewsletterMonthKey = (year: number, month: number) => `${year}-${padMonth(month)}`

const buildNewsletterPdfPath = (monthKey: string) =>
  `${NEWSLETTER_DOCUMENT_PUBLIC_PATH}/newsletter-${monthKey}.pdf`

const buildNewsletterCoverPath = (monthKey: string) =>
  `${NEWSLETTER_COVER_IMAGE_PUBLIC_PATH}/newsletter-${monthKey}-portada.webp`

const buildPublicAssetPath = (publicPath: string) => `public${publicPath}`

const publicAssetExists = (publicPath: string) => {
  return existsSync(buildPublicAssetPath(publicPath))
}

const parseSpanishDate = (value: string) => {
  const [dayRaw, monthRaw, yearRaw] = value.split('/')
  const day = Number(dayRaw)
  const month = Number(monthRaw)
  const year = Number(yearRaw)

  if (!day || !month || !year) {
    throw new Error(`Invalid Spanish date in seed: ${value}`)
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

function assertUniqueValues(values: string[], label: string) {
  const seen = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Seed ${label} contains a duplicate value: ${value}`)
    }

    seen.add(value)
  }
}

const MISSING_MEDIA_OUTLET_LOGO = ''

const createFinancialReportPdfPathBuilder = () => {
  const slugUsage = new Map<string, number>()

  return (title: string) => {
    const baseSlug = slugify(title) || 'informe-economico'
    const nextUsage = (slugUsage.get(baseSlug) ?? 0) + 1
    slugUsage.set(baseSlug, nextUsage)

    const reportSlug = nextUsage === 1 ? baseSlug : `${baseSlug}-${nextUsage}`
    return `${FINANCIAL_REPORTS_PUBLIC_PATH}/${reportSlug}.pdf`
  }
}

const createPressDocumentPdfPathBuilder = () => {
  const slugUsage = new Map<string, number>()

  return (title: string, publishedAt: Date) => {
    const baseSlug = slugify(title) || 'documento-prensa'
    const nextUsage = (slugUsage.get(baseSlug) ?? 0) + 1
    slugUsage.set(baseSlug, nextUsage)
    const year = publishedAt.getUTCFullYear()
    const month = String(publishedAt.getUTCMonth() + 1).padStart(2, '0')
    const occurrenceSlug = nextUsage === 1 ? baseSlug : `${baseSlug}-${nextUsage}`

    const orderedSlugs = [
      occurrenceSlug,
      `${occurrenceSlug}-${year}-${month}`,
      `${occurrenceSlug}-${year}`,
      baseSlug,
      `${baseSlug}-${year}-${month}`,
      `${baseSlug}-${year}`,
      `${baseSlug}-2`,
    ]

    // Stored asset filenames were truncated to 60 chars at creation time, so
    // also probe the 60-char-truncated form of each candidate slug.
    const candidateSlugs = orderedSlugs.flatMap((documentSlug) =>
      documentSlug.length > 60 ? [documentSlug, documentSlug.slice(0, 60)] : [documentSlug]
    )

    for (const documentSlug of [...new Set(candidateSlugs)]) {
      const publicPath = `${PRESS_DOCUMENT_PUBLIC_PATH}/${documentSlug}.pdf`
      if (publicAssetExists(publicPath)) {
        return publicPath
      }
    }

    throw new Error(`Missing press document asset for seed article: ${title}`)
  }
}

type FinancialReportSeed = {
  title: string
  approvedAt: Date
  pdfUrl?: string
}

async function main() {
  const cliArgs = new Set(process.argv.slice(2))
  const hasConfirmFlag = cliArgs.has('--confirm')
  const isProduction = process.env.NODE_ENV === 'production'
  const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true'
  const requiresConfirm = isProduction

  if (requiresConfirm && !hasConfirmFlag) {
    throw new Error('Refusing to run destructive seed without --confirm.')
  }

  if (isProduction && !allowProductionSeed) {
    throw new Error('Refusing to run seed in production unless ALLOW_PRODUCTION_SEED=true.')
  }

  console.log('🌱 Starting database seeding...')

  if (!requiresConfirm) {
    console.log('ℹ️ Development mode detected. Skipping --confirm requirement.')
  }

  // Clear existing data (in correct order for foreign keys)
  console.log('🗑️ Clearing existing data...')
  await db.delete(schema.aboutPageContent)
  await db.delete(schema.pressDossier)
  await db.delete(schema.siteDefaultImages)
  await db.delete(schema.equalityDocumentTranslations)
  await db.delete(schema.equalityDocuments)
  await db.delete(schema.newsletterDeliveries)
  await db.delete(schema.newsletterSubscriptionEvents)
  await db.delete(schema.newsletterSubscribers)
  await db.delete(schema.newsletters)
  await db.delete(schema.carouselItemTranslations)
  await db.delete(schema.carouselItems)
  await db.delete(schema.pressArticleTags)
  await db.delete(schema.pressArticleTranslations)
  await db.delete(schema.pressArticles)
  await db.delete(schema.mediaOutlets)
  await db.delete(schema.featuredLinkTranslations)
  await db.delete(schema.featuredLinks)
  await db.delete(schema.tagTranslations)
  await db.delete(schema.tags)

  console.log('📝 Creating tags...')
  const tagsData = [
    {
      slug: 'all',
      translations: [
        { locale: 'es', name: 'Todas' },
        { locale: 'en', name: 'All' },
        { locale: 'ca', name: 'Totes' },
      ],
    },
    {
      slug: 'university-policy',
      translations: [
        { locale: 'es', name: 'Política universitaria' },
        { locale: 'en', name: 'University policy' },
        { locale: 'ca', name: 'Política universitària' },
      ],
    },
    {
      slug: 'scholarships-funding',
      translations: [
        { locale: 'es', name: 'Becas y financiación' },
        { locale: 'en', name: 'Scholarships and funding' },
        { locale: 'ca', name: 'Beques i finançament' },
      ],
    },
    {
      slug: 'student-economy',
      translations: [
        { locale: 'es', name: 'Economía estudiantil' },
        { locale: 'en', name: 'Student economy' },
        { locale: 'ca', name: 'Economia estudiantil' },
      ],
    },
    {
      slug: 'internships-employability',
      translations: [
        { locale: 'es', name: 'Prácticas y empleabilidad' },
        { locale: 'en', name: 'Internships and employability' },
        { locale: 'ca', name: 'Pràctiques i ocupabilitat' },
      ],
    },
    {
      slug: 'rights-coexistence-equality',
      translations: [
        { locale: 'es', name: 'Derechos, convivencia e igualdad' },
        { locale: 'en', name: 'Rights, coexistence and equality' },
        { locale: 'ca', name: 'Drets, convivència i igualtat' },
      ],
    },
    {
      slug: 'university-quality',
      translations: [
        { locale: 'es', name: 'Calidad universitaria' },
        { locale: 'en', name: 'University quality' },
        { locale: 'ca', name: 'Qualitat universitària' },
      ],
    },
    {
      slug: 'university-life-wellbeing',
      translations: [
        { locale: 'es', name: 'Vida universitaria y bienestar' },
        { locale: 'en', name: 'University life and wellbeing' },
        { locale: 'ca', name: 'Vida universitària i benestar' },
      ],
    },
    {
      slug: 'access-to-university',
      translations: [
        { locale: 'es', name: 'Acceso a la universidad' },
        { locale: 'en', name: 'Access to university' },
        { locale: 'ca', name: 'Accés a la universitat' },
      ],
    },
    {
      slug: 'international-mobility',
      translations: [
        { locale: 'es', name: 'Internacional y movilidad' },
        { locale: 'en', name: 'Internationalisation and mobility' },
        { locale: 'ca', name: 'Internacional i mobilitat' },
      ],
    },
    {
      slug: 'student-representation',
      translations: [
        { locale: 'es', name: 'Representación estudiantil' },
        { locale: 'en', name: 'Student representation' },
        { locale: 'ca', name: 'Representació estudiantil' },
      ],
    },
  ]

  const tags: Record<string, string> = {}
  for (let i = 0; i < tagsData.length; i++) {
    const tagData = tagsData[i]
    const [tag] = await db
      .insert(schema.tags)
      .values({
        slug: tagData.slug,
        order: i,
      })
      .returning()

    await db.insert(schema.tagTranslations).values(
      tagData.translations.map((t) => ({
        locale: t.locale,
        name: t.name,
        tagId: tag.id,
      }))
    )

    tags[tagData.slug] = tag.id
  }

  console.log('🎠 Creating carousel items...')
  const carouselData = [
    {
      image: `${HOME_CAROUSEL_IMAGE_PUBLIC_PATH}/conoce-a-la-asociacion-que-representa-a-mas-de-1000000-de-es.webp`,
      href: '/conocenos/que-es',
      translations: [
        {
          locale: 'es',
          title: 'Conoce a la asociación que representa a más de 1.000.000 de estudiantes.',
          buttonText: '¿Qué es CREUP?',
        },
        {
          locale: 'en',
          title: 'Meet the association that represents more than 1,000,000 students.',
          buttonText: 'What is CREUP?',
        },
        {
          locale: 'ca',
          title: "Coneix l'associació que representa més d'1.000.000 d'estudiants.",
          buttonText: 'Què és CREUP?',
        },
      ],
    },
  ]

  for (let i = 0; i < carouselData.length; i++) {
    const item = carouselData[i]
    const [carouselItem] = await db
      .insert(schema.carouselItems)
      .values({
        image: item.image,
        href: item.href,
        order: i,
      })
      .returning()

    await db.insert(schema.carouselItemTranslations).values(
      item.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        buttonText: t.buttonText,
        carouselItemId: carouselItem.id,
      }))
    )
  }

  console.log('ℹ️ Creating about page content...')
  await db.insert(schema.aboutPageContent).values({
    heroImage: ABOUT_HERO_DEFAULT_IMAGE,
    heroVisible: true,
  })

  console.log('📋 Creating press dossier singleton...')
  await db.insert(schema.pressDossier).values({
    id: 'singleton',
    pdfUrl: PRESS_DOSSIER_PUBLIC_PATH,
    active: true,
  })

  const redisUrl = process.env.NUXT_REDIS_URL?.trim() || process.env.REDIS_URL?.trim()
  if (redisUrl) {
    console.log('🧹 Clearing Nitro cache for press dossier API...')
    const { purgeNitroHandlerCacheByPrefixes } =
      await import('../server/utils/cache/nitroRedisCachePurge')
    await purgeNitroHandlerCacheByPrefixes(redisUrl, [
      'nitro/handlers/press-dossier',
      'nitro/handlers/public-press-dossier',
    ])
  } else {
    console.log(
      'ℹ️ NUXT_REDIS_URL not set: if the dossier link is missing in the header, restart the dev server (Nitro in-memory cache).'
    )
  }

  console.log('🖼️ Creating site default image slots...')
  await db.insert(schema.siteDefaultImages).values([
    {
      scope: SITE_DEFAULT_IMAGE_SCOPE.press,
      slot: SITE_DEFAULT_IMAGE_SLOT.pressRelease,
      image: `${PRESS_DEFAULT_COVERS_PUBLIC_PATH}/portada-nota-prensa.webp`,
    },
    {
      scope: SITE_DEFAULT_IMAGE_SCOPE.press,
      slot: SITE_DEFAULT_IMAGE_SLOT.statement,
      image: `${PRESS_DEFAULT_COVERS_PUBLIC_PATH}/portada-comunicado.webp`,
    },
    {
      scope: SITE_DEFAULT_IMAGE_SCOPE.press,
      slot: SITE_DEFAULT_IMAGE_SLOT.mediaAppearance,
      image: `${PRESS_DEFAULT_COVERS_PUBLIC_PATH}/portada-aparicion-medios.webp`,
    },
    {
      scope: SITE_DEFAULT_IMAGE_SCOPE.newsletter,
      slot: SITE_DEFAULT_IMAGE_SLOT.newsletterCover,
      image: null,
    },
    {
      scope: SITE_DEFAULT_IMAGE_SCOPE.carousel,
      slot: SITE_DEFAULT_IMAGE_SLOT.carouselSlide,
      image: `${HOME_CAROUSEL_SITE_DEFAULT_PUBLIC_PATH}/banner-carrusel-defecto.webp`,
    },
    {
      scope: SITE_DEFAULT_IMAGE_SCOPE.seo,
      slot: SITE_DEFAULT_IMAGE_SLOT.ogImage,
      image: '/og/default.jpg',
    },
  ])

  console.log('🗞️ Creating media outlets...')
  const mediaOutletsData = [
    {
      key: '20-minutos',
      name: '20 Minutos',
      website: 'https://www.20minutos.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'abc',
      name: 'ABC',
      website: 'https://www.abc.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'acpua',
      name: 'ACPUA',
      website: 'https://acpua.aragon.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'andalucia-informacion',
      name: 'Andalucía Información',
      website: 'https://www.andaluciainformacion.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'aprendemas',
      name: 'Aprendemas',
      website: 'https://www.aprendemas.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'aula-magna',
      name: 'Aula Magna',
      website: 'https://www.aulamagna.com.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'bolsamania',
      name: 'Bolsamanía',
      website: 'https://www.bolsamania.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'cadena-ser',
      name: 'Cadena SER',
      website: 'https://cadenaser.com/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/cadena-ser.svg`,
    },
    {
      key: 'canal-sur',
      name: 'Canal Sur',
      website: 'https://www.canalsur.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'castellon-informacion',
      name: 'Castellón Información',
      website: 'https://www.castelloninformacion.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'catalunya-press',
      name: 'Catalunya Press',
      website: 'https://www.catalunyapress.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'cinco-dias',
      name: 'Cinco Días',
      website: 'https://cincodias.elpais.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'cope',
      name: 'COPE',
      website: 'https://www.cope.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'crue',
      name: 'CRUE',
      website: 'https://www.crue.org/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'cuadernos-de-pedagogia',
      name: 'Cuadernos de Pedagogía',
      website: 'https://www.cuadernosdepedagogia.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'diario-de-leon',
      name: 'Diario de León',
      website: 'https://www.diariodeleon.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'diario-jaen',
      name: 'Diario Jaén',
      website: 'https://www.diariojaen.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'diario-siglo-xxi',
      name: 'Diario Siglo XXI',
      website: 'https://www.diariosigloxxi.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'diario-veterinario',
      name: 'Diario Veterinario',
      website: 'https://www.diarioveterinario.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'dream-alcala',
      name: 'Dream Alcalá',
      website: 'https://www.dream-alcala.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'economia-digital',
      name: 'Economía Digital',
      website: 'https://www.economiadigital.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'educaweb',
      name: 'Educaweb',
      website: 'https://www.educaweb.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-boletin',
      name: 'El Boletín',
      website: 'https://www.elboletin.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-confidencial',
      name: 'El Confidencial',
      website: 'https://www.elconfidencial.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-correo',
      name: 'El Correo',
      website: 'https://www.elcorreo.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-debate',
      name: 'El Debate',
      website: 'https://www.eldebate.com/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/el-debate.svg`,
    },
    {
      key: 'el-diario-alerta',
      name: 'El Diario Alerta',
      website: 'https://www.eldiarioalerta.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-economista',
      name: 'El Economista',
      website: 'https://www.eleconomista.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-espanol',
      name: 'El Español',
      website: 'https://www.elespanol.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-huffpost',
      name: 'El HuffPost',
      website: 'https://www.huffingtonpost.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-imparcial',
      name: 'El Imparcial',
      website: 'https://www.elimparcial.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-liberal',
      name: 'El Liberal',
      website: 'https://www.elliberal.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-mundo',
      name: 'El Mundo',
      website: 'https://www.elmundo.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-nacional',
      name: 'El Nacional',
      website: 'https://www.elnacional.cat/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-pais',
      name: 'El País',
      website: 'https://elpais.com/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/el-pais.svg`,
    },
    {
      key: 'el-plural',
      name: 'El Plural',
      website: 'https://www.elplural.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'el-salto',
      name: 'El Salto',
      website: 'https://www.elsaltodiario.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'eldiario-es',
      name: 'elDiario.es',
      website: 'https://www.eldiario.es/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/eldiarioes.svg`,
    },
    {
      key: 'esdiario',
      name: 'EsDiario',
      website: 'https://www.esdiario.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'espacios-de-educacion-superior',
      name: 'Espacios de Educación Superior',
      website: 'https://www.espaciosdeeducacionsuperior.es/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/espacios-de-educacion-superior.webp`,
    },
    {
      key: 'europa-press',
      name: 'Europa Press',
      website: 'https://www.europapress.es/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/europa-press.webp`,
    },
    {
      key: 'europa-press-tv',
      name: 'Europa Press TV',
      website: 'https://www.europapress.tv/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'galicia-press',
      name: 'Galicia Press',
      website: 'https://www.galiciapress.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'gn-diario',
      name: 'GN Diario',
      website: 'https://www.gndiario.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'granada-hoy',
      name: 'Granada Hoy',
      website: 'https://www.granadahoy.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'heraldo',
      name: 'Heraldo',
      website: 'https://www.heraldo.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'il-fatto-quotidiano',
      name: 'Il Fatto Quotidiano',
      website: 'https://www.ilfattoquotidiano.it/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'infolibre',
      name: 'infoLibre',
      website: 'https://www.infolibre.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'la-informacion',
      name: 'La Información',
      website: 'https://www.lainformacion.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'la-moncloa',
      name: 'La Moncloa',
      website: 'https://www.lamoncloa.gob.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'la-razon',
      name: 'La Razón',
      website: 'https://www.larazon.es/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/la-razon.svg`,
    },
    {
      key: 'la-vanguardia',
      name: 'La Vanguardia',
      website: 'https://www.lavanguardia.com/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/la-vanguardia.svg`,
    },
    {
      key: 'lanza-digital',
      name: 'Lanza Digital',
      website: 'https://www.lanzadigital.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'lasexta',
      name: 'laSexta',
      website: 'https://www.lasexta.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'madridpress',
      name: 'MadridPress',
      website: 'https://madridpress.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'magisnet',
      name: 'Magisnet',
      website: 'https://www.magisnet.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'magisterio',
      name: 'Magisterio',
      website: 'https://www.magisnet.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'maldita-es',
      name: 'Maldita.es',
      website: 'https://maldita.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'moncloa-com',
      name: 'Moncloa.com',
      website: 'https://www.moncloa.com/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/moncloacom.webp`,
    },
    {
      key: 'mundo-deportivo',
      name: 'Mundo Deportivo',
      website: 'https://www.mundodeportivo.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'murcia-economia',
      name: 'Murcia Economía',
      website: 'https://murciaeconomia.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'murcia-com',
      name: 'Murcia.com',
      website: 'https://www.murcia.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'newtral',
      name: 'Newtral',
      website: 'https://www.newtral.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'onda-cero',
      name: 'Onda Cero',
      website: 'https://www.ondacero.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'portal-parados',
      name: 'Portal Parados',
      website: 'https://www.portalparados.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'publico',
      name: 'Público',
      website: 'https://www.publico.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'que',
      name: 'Qué!',
      website: 'https://www.que.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'redaccion-medica',
      name: 'Redacción Médica',
      website: 'https://www.redaccionmedica.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'revista-nuve',
      name: 'Revista NUVE',
      website: 'https://revistanuve.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'rtve',
      name: 'RTVE',
      website: 'https://www.rtve.es/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/rtve.svg`,
    },
    {
      key: 'salamanca-24-horas',
      name: 'Salamanca 24 Horas',
      website: 'https://www.salamanca24horas.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'salamanca-rtv-al-dia',
      name: 'Salamanca RTV al Día',
      website: 'https://salamancartvaldia.es/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/salamanca-rtve-al-dia.webp`,
    },
    {
      key: 'servimedia',
      name: 'Servimedia',
      website: 'https://www.servimedia.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'telecinco',
      name: 'Telecinco',
      website: 'https://www.telecinco.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'telemadrid',
      name: 'Telemadrid',
      website: 'https://www.telemadrid.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'teleprensa',
      name: 'Teleprensa',
      website: 'https://www.teleprensa.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'the-objective',
      name: 'The Objective',
      website: 'https://theobjective.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'tribuna-salamanca',
      name: 'Tribuna Salamanca',
      website: 'https://www.tribunasalamanca.com/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/tribuna-salamanca.webp`,
    },
    {
      key: 'uned',
      name: 'UNED',
      website: 'https://portal.uned.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'universidad-de-alcala',
      name: 'Universidad de Alcalá',
      website: 'https://portalcomunicacion.uah.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'universidad-de-cantabria',
      name: 'Universidad de Cantabria',
      website: 'https://web.unican.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'universidad-de-zaragoza',
      name: 'Universidad de Zaragoza',
      website: 'https://www.unizar.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'universitat-de-valencia',
      name: 'Universitat de València',
      website: 'https://www.uv.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'valencia-plaza',
      name: 'Valencia Plaza',
      website: 'https://valenciaplaza.com/',
      logo: `${PRESS_MEDIA_LOGO_PUBLIC_PATH}/valencia-plaza.webp`,
    },
    {
      key: 'vozpopuli',
      name: 'Vozpópuli',
      website: 'https://www.vozpopuli.com/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'a-punt',
      name: 'À Punt',
      website: 'https://www.apuntmedia.es/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
    {
      key: 'exito-educativo',
      name: 'Éxito Educativo',
      website: 'https://exitoeducativo.net/',
      logo: MISSING_MEDIA_OUTLET_LOGO,
    },
  ]

  const mediaOutlets: Record<string, string> = {}
  for (let i = 0; i < mediaOutletsData.length; i++) {
    const item = mediaOutletsData[i]
    const [mediaOutlet] = await db
      .insert(schema.mediaOutlets)
      .values({
        name: item.name,
        website: item.website,
        logo: item.logo,
        order: i,
      })
      .returning()

    mediaOutlets[item.key] = mediaOutlet.id
  }

  console.log('📰 Creating press articles...')
  const pressData = [
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '15/12/2025',
      tagSlugs: ['scholarships-funding', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado dice basta a la subida de precios en los comedores universitarios',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) y la Delegación General de Estudiantes de la Universidad de Granada denuncian la infrafinanciación universitaria y la falta de escucha al estudiantado.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/10/2025',
      tagSlugs: ['student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP exige una estrategia nacional de salud mental universitaria y recursos suficientes para su atención',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas, reclama la puesta en marcha de una estrategia estatal de salud mental en el ámbito universitario y una dotación económica suficiente para garantizar el bienestar psicológico del estudiantado.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '25/09/2025',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title:
            'A la espera del Estatuto de Becario, el Ministerio de Trabajo sigue ignorando a la comunidad universitaria',
          description:
            'A menos de unas semanas de la fecha prevista de la aprobación del Estatuto del Becario, el Ministerio de Trabajo no se ha puesto en contacto con ninguno de los actores universitarios más importantes.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/09/2025',
      tagSlugs: ['scholarships-funding', 'student-economy', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP denuncia que la subida del 14 % en el precio de las habitaciones expulsa a miles de estudiantes de la universidad pública',
          description:
            'La Coordinadora advierte de que la crisis habitacional amenaza la igualdad de oportunidades y exige un plan urgente de residencias públicas, ayudas al alquiler y regulación de precios en ciudades universitarias.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/07/2025',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP denuncia la injerencia en la autonomía universitaria',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), alerta de que la reforma de la Ley de Consejos Sociales en Canarias socava la autonomía universitaria.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/07/2025',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Comunicado de la representación del estudiantado en apoyo de la ampliación del grado en veterinaria a 360 ECTS',
          description:
            'Desde la representación estudiantil del Consejo de Estudiantes Universitario del Estado, la Coordinadora de Representantes de Estudiantes en Universidades Públicas y el Consejo Nacional de Estudiantes de Veterinaria queremos mostrar nuestro respaldo a la propuesta de modificación de la Orden ECI 333/2008 de 13 de febrero, presentada por la Conferencia de Decanos y Decanas de Facultades de Veterinaria de España. Dicha modificación supone la ampliación del grado en Veterinaria a 360 ECTS.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/07/2025',
      tagSlugs: ['university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Universidades privadas en hospitales públicos: la Conselleria amenaza la formación médica',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) y el Consejo Estatal de Estudiantes de Medicina (CEEM) denuncian una situación crítica que pone en riesgo el futuro de la educación médica pública en la Comunitat Valenciana.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '12/05/2025',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'El estudiantado apuesta por una universidad de calidad',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), muestra su apoyo al proyecto presentado por el Gobierno de reforma del Real Decreto 640/2021 de creación, reconocimiento y autorización de universidades y centros universitarios, y acreditación institucional de centros universitarios.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '5/04/2025',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP celebra su 77.ª asamblea general ordinaria en la Universidad de Sevilla',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), el máximo órgano de representación del estudiantado español, celebra su 77.ª Asamblea General Ordinaria en la Universidad de Sevilla.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '31/10/2024',
      tagSlugs: ['university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado lamenta los hechos producidos por la DANA y pide a las universidades que no jueguen con la vida de las personas',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) ha elaborado una serie de medidas para el estudiantado y para las universidades.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '4/10/2024',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title:
            'El Ministerio de Trabajo sigue sin reunirse con el estudiantado universitario para ultimar el Estatuto del Becario',
          description:
            'En ningún momento hemos apoyado el texto acordado con sindicatos y Trabajo y esperamos que tras la audiencia pública tengamos una reunión con el ministerio.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '29/07/2024',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado español denuncia las violentas actuaciones contra el estudiantado de Bangladesh',
          description:
            'La Coordinadora de Representantes de Estudiantes de las Universidades Públicas (CREUP) deja claro que las represiones y las persecuciones que se están dando en Bangladesh deben terminar y denuncian los asesinatos a estudiantes.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '4/07/2024',
      tagSlugs: ['access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP rechaza los acuerdos firmados en el pacto sobre la Prueba de Acceso a la Universidad (PAU) en las CC. AA. gobernadas por el Partido Popular',
          description:
            'Consideramos fundamental la adecuación de la Prueba de Acceso a la Universidad (PAU) a las realidades curriculares dentro de nuestro estado con el objetivo de evitar que esta prueba degenere en un agravio comparativo entre las diferentes comunidades autónomas.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '27/05/2024',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP responde a las universidades israelíes y al gobierno y pide que las universidades españolas cumplan su palabra',
          description:
            'Las acampadas en favor de Palestina no terminan en la mayoría de universidades pese el reconocimiento de Palestina por el presidente del gobierno, CREUP indica que esto no es suficiente y se deben atender las demandas de los estudiantes de las acampadas.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '10/05/2024',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP defiende las protestas en apoyo a Palestina',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) celebra que tras meses de reivindicaciones del estudiantado finalmente el sistema universitario de un paso adelante en la defensa del pueblo palestino.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '30/12/2023',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes piden al Gobierno retomar las negociaciones del nuevo Estatuto del Estudiante Universitario',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) insta al Ministerio de Ciencia, Innovación y Universidades a recuperar las negociaciones del Estatuto del Estudiante Universitario, que fueron detenidas antes de la campaña electoral.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '23/11/2023',
      tagSlugs: ['university-life-wellbeing', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'La CREUP pide al Gobierno que esta legislatura los estudiantes no vuelvan a ser los grandes olvidados',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) espera que no se vuelvan a repetir los mismos errores de la pasada legislatura y que se apueste por el diálogo y la negociación, también con el estudiantado.',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>La Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) espera que no se vuelvan a repetir los mismos errores de la pasada legislatura y que se apueste por el di&aacute;logo y la negociaci&oacute;n, tambi&eacute;n con el estudiantado.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '16/11/2023',
      tagSlugs: ['scholarships-funding', 'student-economy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Aumentan las penalizaciones e intereses económicos para los estudiantes más desfavorecidos',
          description:
            'El Gobierno de España vuelve a legislar sin tener en cuenta a las universidades y al estudiantado. La devolución del importe de las becas MEFP para el año 2023/2024 conllevará un interés económico para el estudiantado que no supere los criterios académicos.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '25/09/2023',
      tagSlugs: ['international-mobility', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'España acogerá en Zaragoza la 46ª edición de la European Student Convention',
          description:
            'La CREUP celebrará este mes en la capital aragonesa un evento que congregará a los universitarios de más de 27 países que forman parte de la European Students’ Union (ESU), el principal órgano de representación estudiantil a nivel europeo.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/09/2023',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado de las universidades públicas condena los mensajes machistas en un chat de novatadas',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) rechazan los mensajes emitidos el pasado viernes en un grupo de WhatsApp de Magisterio en la Universidad de La Rioja.',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) rechazan los mensajes emitidos el pasado viernes en un grupo de WhatsApp de Magisterio en la Universidad de La Rioja.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '28/08/2023',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'María Navarro, nueva presidenta de la CREUP',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), el máximo órgano de representación del estudiantado español, ha elegido en su última asamblea a la que será su nueva Comisión Ejecutiva.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/08/2023',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado de las universidades públicas condena los mensajes machistas en un chat de novatadas',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) rechazan los mensajes emitidos el pasado viernes en un grupo de WhatsApp de Magisterio en la Universidad de La Rioja.',
          contentHtml:
            '<p>Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) rechazan los mensajes emitidos el pasado viernes en un grupo de WhatsApp de Magisterio en la Universidad de La Rioja.</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) rechazan los mensajes emitidos el pasado viernes en un grupo de WhatsApp de Magisterio en la Universidad de La Rioja.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/07/2023',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP se reúne con los partidos políticos para trasladar las reivindicaciones del estudiantado',
          description:
            'En un esfuerzo por asegurar mejoras significativas en el sistema universitario, los representantes del estudiantado han mantenido encuentros con representantes del Partido Popular (PP), el Partido Socialista Obrero Español (PSOE), Sumar y Esquerra Republicana de Catalunya (ERC).',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '4/07/2023',
      tagSlugs: ['scholarships-funding', 'student-economy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP reivindica la nueva legislatura como una nueva oportunidad para mejorar el sistema universitario',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas reclama a los partidos políticos que se tome en consideración sus reivindicaciones para mejorar el sistema público de universidades, entre las que se incluye reformar el Estatuto del Estudiante o la mejora del sistema de becas',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '27/06/2023',
      tagSlugs: [
        'internships-employability',
        'rights-coexistence-equality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario muestra su firme oposición al retraso en la cotización de las prácticas',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas evidencia que este aplazamiento podría suponer que las prácticas nunca lleguen a ser cotizadas en la seguridad social debido al posible cambio de gobierno.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/06/2023',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP denuncia la exclusión del estudiantado en la negociación del Estatuto del Becario',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas se opone a las últimas declaraciones de la CRUE donde exige que se elimine cualquier tipo compensación por los gastos derivados de las prácticas, algo que es imprescindible para evitar la utilización fraudulenta del estudiantado como mano de obra gratuita.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '16/02/2023',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title: 'El estudiantado universitario denuncia que el Estatuto del Becario es un fraude',
          description:
            'Tras un único acercamiento con la representación estudiantil, el Ministerio de Trabajo ultima los detalles de uno de sus proyectos estrella sin interesarse por la realidad de las prácticas en la Universidad.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '14/02/2023',
      tagSlugs: ['scholarships-funding', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title: 'Bajan las matrículas universitarias, los problemas continúan',
          description:
            'Los datos expuestos en el último informe del Observatorio del Sistema Universitario sobre los precios públicos de matrícula evidencian que los problemas que las nuevas medidas pretendían resolver siguen siendo acuciantes para la mayoría de estudiantes',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '12/01/2023',
      tagSlugs: ['student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'Querido estudiante: que no te engañen',
          description:
            'En las últimas semanas se han viralizado textos que debatían sobre el comportamiento o la implicación del estudiantado universitario. Los estudiantes se han convertido en el objeto de discusión, como si no tuvieran voz ni opinión en esto. Nada más lejos de la realidad: aquí la carta de la Coordinadora de Representantes de Estudiantes de Universidades Públicas para el estudiantado.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/12/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario exige cambios urgentes en la Ley Orgánica del Sistema Universitario',
          description:
            'El trámite parlamentario de la nueva Ley de Universidades continúa su marcha sin incorporar cambios significativos en materia de estudiantes, dando la espalda una vez más las necesidades del colectivo mayoritario de la universidad',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '17/11/2022',
      tagSlugs: ['internships-employability', 'university-quality', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'El Ministerio de Trabajo abandona al estudiantado en el Estatuto del Estudiante en Formación Práctica',
          description:
            'Tras varios meses de reivindicaciones por parte del estudiantado universitario, el Ministerio de Yolanda Díaz elabora un Estatuto del Estudiante en Prácticas que no garantiza la calidad de las prácticas académicas, no asegura su remuneración y elimina la posibilidad de realizarlas en instituciones públicas',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '19/10/2022',
      tagSlugs: ['internships-employability', 'university-quality', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'El Ministerio de Trabajo ignora las reclamaciones del estudiantado para lograr unas prácticas remuneradas y de calidad',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) reivindica una nueva redacción para el Estatuto del Estudiante en Formación Práctica, señalan que el actual texto no profundiza en la calidad formativa de las prácticas ni ofrece soluciones viables a los problemas actuales del estudiantado',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/09/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP reivindica en el Congreso una transformación profunda de la Ley Orgánica del Sistema Universitario',
          description:
            'El presidente de CREUP intervino ayer ante la Comisión de Ciencia, Innovación y Universidades del Congreso de los Diputados para reclamar una transformación de la futura Ley de Universidades, hacia un modelo en el que el estudiantado sea protagonista de su aprendizaje y de la gobernanza de la universidad',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '19/09/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP comparece en el Congreso para defender las reivindicaciones del estudiantado universitario',
          description:
            'El presidente de CREUP, la organización que representa al estudiantado de las universidades públicas españolas, comparecerá el miércoles 21 en el Congreso de los Diputados para elevar las reivindicaciones del estudiantado de cara a la tramitación parlamentaria de la Ley Orgánica del Sistema Universitario.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '30/08/2022',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario demanda al Ministerio de Trabajo que no elimine las prácticas en entidades públicas',
          description:
            'El Estatuto del Estudiante en Prácticas recoge la laboralización de las prácticas extracurriculares, lo que implicaría la desaparición de todas aquellas que se realicen en instituciones públicas, pese a que estas representan el 70 por ciento del total de las prácticas universitarias',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/06/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Subirats deja de lado al estudiantado en el anteproyecto de Ley Orgánica del Sistema Universitario',
          description:
            'El Anteproyecto de Ley Orgánica del Sistema Universitario aprobado ayer en el Consejo de Ministros recoge nuevos derechos pero relega la participación estudiantil a un segundo plano, desoyendo las demandas de este colectivo, que espera que mejore en el proceso de tramitación parlamentaria',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '2/06/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado reivindica cambios al Ministerio de Universidades en el nuevo borrador de la LOSU',
          description:
            'En la reunión mantenida ayer entre la representación estudiantil y el Ministerio de Universidades, convocada para debatir el último borrador de la Ley Orgánica del Sistema Universitario, los representantes expusieron sus reivindicaciones para que la futura reforma sitúe al estudiante en el centro.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '10/05/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario evidencia que la LOSU no avanza lo suficiente en participación estudiantil',
          description:
            'El Ministerio de Universidades dio a conocer ayer un nuevo texto de la Ley Orgánica del Sistema Universitario, que incorpora algunos cambios con respecto al anterior, pero deja fuera las reivindicaciones del estudiantado en materia de gobernanza y democracia universitaria',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/05/2022',
      tagSlugs: ['student-economy', 'internships-employability', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP se reúne con Yolanda Díaz para analizar los puntos clave del nuevo Estatuto del Estudiante en Prácticas',
          description:
            'La regulación de las prácticas académicas, planteada en la reforma laboral, incorporará las principales reivindicaciones del estudiantado universitario, abordando la compensación económica o el contenido de la actividad formativa',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '6/05/2022',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title: 'El estudiantado universitario reivindica unas prácticas formativas y remuneradas',
          description:
            'El estudiantado universitario reivindica que el Estatuto del Becario, la norma que regulará las prácticas académicas en las Universidades, recoja sus propuestas para garantizar un modelo de prácticas formativo, que ponga en valor el papel del estudiante y que garantice su remuneración',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '4/05/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'La representación estudiantil consigue el paro académico como derecho en la Ley Orgánica del Sistema Universitario',
          description:
            'En la reunión mantenida hoy con el Ministerio de Universidades se ha tratado el nuevo texto de la LOSU, que incorpora la reivindicación histórica del paro académico y otros derechos del estudiantado universitario',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/04/2022',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title: 'El estudiantado universitario reivindica unas prácticas académicas dignas',
          description:
            'La reforma laboral aprobada en diciembre plantea abordar una regulación de las prácticas académicas, a través del Estatuto del Becario, en un plazo máximo de seis meses, una de las demandas principales de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), que lleva meses demandando un nuevo marco normativo que dignifique las prácticas y evite malas praxis con estas.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '21/04/2022',
      tagSlugs: ['student-economy', 'university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario rechaza el cierre de los edificios universitarios ante el encarecimiento de la energía',
          description:
            'Las medidas adoptadas por las Universidades a raíz de la escalada de precios de la energía, llevadas a cabo sin contar con la representación estudiantil y entre las que se incluye el cierre anticipado de edificios o el reajuste de los horarios para la actividad docente, pueden limitar el derecho al estudio, la calidad de la docencia y la vida universitaria.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '24/02/2022',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario pide al Gobierno que difunda masivamente los cambios en los plazos de solicitud de becas',
          description:
            'Desde CEUNE y CREUP celebran la reducción en la nota media para acceder a las becas para los másteres no habilitantes, pero consideran que tienen que seguir avanzando en la eliminación de los requisitos académicos',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '23/02/2022',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario conquista avances en las becas del Ministerio para el curso 2022/2023',
          description:
            'Las becas del Ministerio para este curso incluirán varias reivindicaciones del estudiantado, situarán en el 5 la nota media exigida para acceder a las becas de másteres no habilitantes, y acelerarán los plazos de la convocatoria para que se conozca cuanto antes si se recibe la beca y su cuantía.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '17/02/2022',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado reclama a las instituciones universitarias que respeten el acuerdo alcanzado con la representación estudiantil en la implantación de la Ley de Convivencia Universitaria',
          description:
            'En la sesión celebrada el miércoles 16 de febrero, el Senado aprobó una Ley de Convivencia Universitaria que no respeta el acuerdo alcanzado entre los agentes sociales universitarios, por el que se fijaba la mediación como el principal mecanismo para la resolución de conflictos, y que con el actual texto pasa a depender de la regulación de cada Universidad',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '14/02/2022',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario reclama a Yolanda Díaz acordar una postura conjunta para abordar la reforma de las prácticas',
          description:
            'La reciente aprobación de la reforma laboral compromete al Ministerio de Trabajo a comenzar las negociaciones del futuro Estatuto del Estudiante en Prácticas en un plazo máximo de seis meses sin haber iniciado todavía el diálogo con el estudiantado universitario',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '4/02/2022',
      tagSlugs: ['student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'La Universidad de Sevilla acoge las reuniones de la directiva de la Coordinadora de Representantes de Estudiantes de Universidades Públicas',
          description:
            'Los días 4 y 5 de febrero la Universidad de Sevilla acogerá en sus instalaciones las reuniones entre las distintas áreas de la directiva de CREUP, que prepararán las principales líneas de trabajo de los representantes de estudiantes universitarios hasta el próximo otoño',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '20/01/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario traslada a Subirats la necesidad de situar al estudiante en el centro de la nueva Ley de Universidades',
          description:
            'El presidente de la Coordinadora de Representantes de Estudiantes de las Universidades Públicas, Nicolás Hernández, se ha reunido con el Ministro de Universidades, Joan Subirats, para trasladar los principales temas a tratar durante la legislatura',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '4/01/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario considera insuficiente el protocolo de vuelta a las aulas',
          description:
            'El estudiantado universitario recrimina al Ministerio de Universidades, así como a las diferentes instituciones universitarias, no haber consultado su opinión de cara a establecer los posibles protocolos de vuelta a los campus',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '20/12/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'El estudiantado universitario propone a Subirats reiniciar la ‘ley Castells’',
          description:
            'El estudiantado universitario solicita al recién nombrado Ministro de Universidades, Joan Subirats, un nuevo proceso de diálogo que permita alcanzar una Ley Orgánica del Sistema Universitario que mejore la situación en los campus',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '16/11/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Consejo de Estudiantes Universitario del Estado aprueba convocar paro académico estatal',
          description:
            'Esta mañana se han reunido los representantes de estudiantes de las universidades españolas en el pleno del CEUNE, órgano que preside el Ministro, en el que se ha emitido un informe desfavorable a la Ley Orgánica del Sistema Universitario y se ha incorporado en el acta el soporte al paro académico estatal para el próximo 18 de noviembre',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/11/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario anuncia movilizaciones contra las reformas universitarias de Castells para el próximo 18 de noviembre',
          description:
            'El estudiantado universitario ha anunciado movilizaciones en distintas ciudades españolas como protesta ante las enmiendas presentadas por Esquerra Republicana, PSOE y Unidas Podemos a la Ley de Convivencia Universitaria y contra las propuestas planteadas en el proyecto Ley Orgánica del Sistema Universitario',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '5/11/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El enfado del estudiantado universitario explota y #SiFueraCastells llega este viernes a número 3 en Tendencias de Twitter',
          description:
            'El estudiantado universitario ha hecho una protesta virtual este viernes, llegando a ser uno de los temas más importantes de la mañana en redes sociales a través del hashtag #SiFueraCastells, mostrando su rechazo a las últimas acciones del Ministerio y los grupos parlamentarios',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '27/10/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado denuncia que la «ley Castells» no avanza respecto a la LOU, abandonando la participación estudiantil',
          description:
            'El Ministerio de Universidades ha remitido el segundo borrador de la Ley Orgánica del Sistema Universitario a la Conferencia de Rectores, estudiantes, sindicatos de profesores, Consejos Sociales y Comunidades Autónomas, sin presentar avances respecto a la Ley Orgánica de Universidades de 2001',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/10/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado reclama cambios en la Ley de Convivencia Universitaria antes de ser aprobada en el Congreso',
          description:
            'El Consejo de Ministros aprobó el pasado 7 de septiembre el proyecto de Ley de Convivencia Universitaria que deroga el decreto franquista de 1954, por lo que será debatida en los próximos días en el Congreso de los Diputados, donde los estudiantes demandan modificaciones que garanticen una convivencia real',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '19/10/2021',
      tagSlugs: ['scholarships-funding', 'student-economy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado reclama que la «ley Castells» inicie el camino hacia la gratuidad de las tasas universitarias',
          description:
            'El Ministerio de Universidades mantuvo ayer una mesa de negociación mixta con Crue, estudiantes, sindicatos, consejos sociales y comunidades autónomas tras la aprobación del anteproyecto de Ley Orgánica del Sistema Universitario, para debatir sobre la financiación de las universidades públicas',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/10/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado denuncia que la «ley Castells» no avanza en democracia universitaria respecto a la LOU a pesar de los últimos cambios',
          description:
            'El Ministro de Universidades emitió hace unos días un documento con las modificaciones realizadas respecto a la gobernanza universitaria tras la mesa de negociación mixta con Crue, estudiantes, sindicatos, consejos sociales y comunidades autónomas que no ha terminado de convencer a los estudiantes, que consideran que sigue sin avanzar en este punto',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '30/09/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes denuncian que la «ley Castells» solo ha sido negociada y acordada con la Conferencia de Rectores',
          description:
            'El Ministro de Universidades mantuvo ayer una mesa de negociación mixta con Crue, estudiantes, sindicatos, consejos sociales y comunidades autónomas para debatir la gobernanza universitaria, tras la aprobación del anteproyecto de ley orgánica del sistema universitario, donde quedó patente la influencia de los rectores en la redacción del anteproyecto',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/09/2021',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado prepara sus alegaciones a una ‘ley Castells’ para la que solicitan cambios estructurales',
          description:
            'La nueva Ley Orgánica del Sistema Universitario ha generado un amplio rechazo entre el estudiantado universitario, que considera que el Ministerio de Universidades debe apostar por la democracia interna y los derechos estudiantiles, así como por una Universidad gratuita, accesible y de calidad',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '17/09/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado muestra su oposición unánime a la ‘Ley Castells’ ante el Ministro de Universidades',
          description:
            'El Ministro de Universidades se reunió ayer, en sesión plenaria del Consejo de Estudiantes Universitario del Estado, con representantes de estudiantes del conjunto de universidades españolas, en el que se expresó la oposición unánime del estudiantado a la LOSU',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '14/09/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Castells planta al estudiantado para acudir a la mesa de diálogo con Cataluña',
          description:
            'Ministerio y estudiantes tenían prevista una reunión para este jueves, 16 de septiembre, que ha sido desconvocada para que Castells asista a la mesa de diálogo con Cataluña, algo que ha indignado al estudiantado, sumándose al enfado tras la falta de negociación y diálogo con la nueva Ley de Universidades',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/09/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes demandan avanzar en la convivencia universitaria y la igualdad en derechos entre los colectivos universitarios',
          description:
            'La nueva Ley de Convivencia Universitaria, anteproyecto que ha sido aprobado esta mañana por parte del ejecutivo, pondrá fin al decreto franquista de 1954, incluyendo numerosos cambios introducidos por la representación estudiantil',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/el-estudiantado-denuncia-que-la-ley-castells-supone-un-atras.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '31/08/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado denuncia que la ‘ley Castells’ supone un atraso en democracia y derechos estudiantiles',
          description:
            'La nueva Ley Orgánica del Sistema Universitario, cuyo anteproyecto ha sido aprobado esta mañana por parte del ejecutivo, tiene como objetivo modernizar el Sistema Universitario Español, si bien el estudiantado considera que supone un atraso con respecto a la norma actual.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '3/08/2021',
      tagSlugs: ['scholarships-funding', 'student-economy', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Las becas del Ministerio incluirán reivindicaciones del estudiantado para el curso 2021/22',
          description:
            'Desde este curso la nota media exigida para acceder a estas becas volverá a situarse en el 5 para los másteres habilitantes, al igual que ocurre con los Grados, y las víctimas de violencia de género no tendrán que sufrir un proceso de revictimización para recibir estas becas.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '19/07/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'La Universidad de Salamanca acoge la LXIX Asamblea General Ordinaria de CREUP',
          description:
            'Entre el 22 y el 24 de julio la Universidad de Salamanca acogerá la 69ª Asamblea de la Coordinadora de Representantes de Universidades Públicas (CREUP)',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/06/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP y CRUE renuevan su compromiso de colaboración para la mejora del sistema universitario',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) y Crue Universidades Españolas renovaron ayer el convenio marco de colaboración entre ambas organizaciones.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '31/05/2021',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'international-mobility',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Carta abierta a las instituciones para garantizar la seguridad del estudiantado en movilidad',
          description:
            'Los estudiantes en movilidad necesitan garantías de cara al próximo curso. Junto a ESN España, solicitamos medidas que garanticen la seguridad y vacunación de este colectivo',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '26/05/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado universitario pide garantías a la nueva Ley de Convivencia Universitaria',
          description:
            'CREUP denuncia que este documento ha sido aprobado sin contar con el respaldo de los representantes de estudiantes. La voluntad de diálogo social en el ámbito universitario tiene que venir acompañada de una inclusión real de las propuestas del estudiantado. Esta falta de escucha ha derivado en una ley que no garantiza la igualdad de derechos.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '21/05/2021',
      tagSlugs: ['university-quality', 'international-mobility', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado de universidades públicas denuncia que el nuevo real decreto del Ministerio devaluará la calidad de las enseñanzas',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), rechaza el proyecto de Real Decreto de Organización de Enseñanzas Universitarias que salió a consulta pública el pasado 19 de mayo. CREUP manifiesta que este documento tiene aspectos que pueden llegar a devaluar la calidad de los títulos universitarios y no resuelve muchos de los problemas actuales de la educación superior.',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/creup-reclama-modificaciones-en-el-nuevo-real-decreto-de-bec.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '13/04/2021',
      tagSlugs: ['scholarships-funding', 'student-economy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP reclama modificaciones en el nuevo Real Decreto de Becas',
          description:
            'CREUP ha trasladado al Ministerio todas sus propuestas y preocupaciones sobre el Real Decreto de Becas, insistiendo en cinco grandes medidas fundamentales para que sean más justas e inclusivas',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/el-ministerio-convoca-por-primera-vez-desde-que-comenzo-la-p.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '23/02/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Ministerio convoca por primera vez desde que comenzó la pandemia a los representantes de estudiantes universitarios del Estado en el Pleno del CEUNE',
          description:
            'El pasado miércoles 17 de febrero, once meses después del anterior, tuvo lugar el Pleno del Consejo de Estudiantes Universitarios del Estado (CEUNE) en formato online. En este, se trataron y debatieron las propuestas de los consejos de cada Universidad, así como los Consejos de Estudiantes Autonómicos y organizaciones de representantes como CREUP.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '12/01/2021',
      tagSlugs: ['university-life-wellbeing', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP denuncia la falta de previsión en las universidades para los exámenes',
          description:
            'Ante la incertidumbre del estudiantado sobre la modalidad de sus exámenes como consecuencia de la situación sanitaria y la deficiencia de los protocolos de actuación CREUP se han reunido con el Ministerio de Universidades para tratar la situación actual. En esta reunión, se ha criticado la falta de información y preparación de las universidades que, de nuevo, está perjudicando a los estudiantes y han trasladado sus peticiones.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/01/2021',
      tagSlugs: ['international-mobility', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Carta abierta al Ministerio de Universidades',
          description:
            'A menos de un mes de la salida definitiva de Reino Unido de la Unión Europea, desde CREUP y ESN España mostramos nuestro rechazo a la decisión de Reino Unido de abandonar el programa de movilidad Erasmus+',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/12/2020',
      tagSlugs: ['university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP reclama que la calidad sea un requisito indispensable para crear nuevas Universidades',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), reivindica que tener un informe favorable de las agencias de calidad sea un requisito para la creación de universidades.',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/creup-se-reune-con-los-grupos-parlamentarios-durante-el-inic.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '17/09/2020',
      tagSlugs: ['university-life-wellbeing', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP se reúne con los grupos parlamentarios durante el inicio de curso',
          description:
            'Las reuniones se han centrado en las demandas del estudiantado para afrontar los retos de este nuevo curso, así como la inclusión de representación estudiantil en las negociaciones del nuevo Estatuto del Personal Docente e Investigador',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '31/08/2020',
      tagSlugs: ['university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes universitarios lanzan sus peticiones para el comienzo de curso',
          description:
            'A escasos días de empezar el curso, la CREUP lanza sus propuestas en una semana en la que se reúnen los principales agentes en materia de universidad, remarcando los temas imprescindibles a trabajar antes de comenzar el curso para que ningún estudiante se quede atrás.',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p><em><strong>A escasos d&iacute;as de empezar el curso, la CREUP lanza sus propuestas en una semana en la que se re&uacute;nen los principales agentes en materia de universidad, remarcando los temas imprescindibles a trabajar antes de comenzar el curso para que ning&uacute;n estudiante se quede atr&aacute;s.</strong></em></p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/miles-de-estudiantes-tendran-que-dejar-la-universidad-si-no-.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '28/04/2020',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'Miles de estudiantes tendrán que dejar la Universidad si no se modifican las becas y tasas',
          description:
            'Con el inicio de la crisis sanitaria ocasionada por la COVID-19, no se podía prever las innumerables consecuencias que acarrearía. Las familias con estudiantes universitarios hoy temen por su futuro, pues cursar estudios universitarios supone un gran peso económico y las becas apenas cubren el 80% del coste real.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '3/04/2020',
      tagSlugs: ['university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'El estudiantado sigue sin saber cómo finalizará el curso',
          description:
            'Sin unas directrices claras y sin un rumbo fijo es como nos encontramos el estudiantado universitario.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '26/03/2020',
      tagSlugs: ['international-mobility', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Representantes de estudiantes piden a instituciones y universidades el máximo apoyo para los Erasmus',
          description:
            'CREUP y ESN España agradecen los esfuerzos de los Ministerios, el SEPIE y las Universidades y solicitan que se de máxima flexibilidad en la aplicación de la cláusula de fuerza mayor',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/el-estudiantado-reivindica-su-participacion-en-la-iniciativa.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '13/02/2020',
      tagSlugs: ['international-mobility'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado reivindica su participación en la iniciativa de universidades europeas',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) y Erasmus Student Network España (ESN España) alientan a las Universidades españolas a introducir la participación estudiantil como principal objetivo de cara a la nueva convocatoria de Universidades Europeas.',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/12/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'international-mobility'],
      translations: [
        {
          locale: 'es',
          title:
            'ESN España y CREUP piden un aumento de la cofinanciación nacional y autonómica para Erasmus+',
          description:
            'Los representantes estudiantiles publican un informe sobre la situación actual con recomendaciones para una movilidad más equitativa en el marco de la campaña #DefiendeTuErasmus',
          contentHtml:
            '<p>Los representantes estudiantiles publican un informe sobre la situación actual con recomendaciones para una movilidad más equitativa en el marco de la campaña #DefiendeTuErasmus</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>La Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas, CREUP, y Erasmus Student Network Espa&ntilde;a, ESN, han publicado un informe conjunto sobre la cofinanciaci&oacute;n nacional y auton&oacute;mica de Erasmus+. La cofinanciaci&oacute;n hace referencia a las ayudas que las instituciones educativas proporcionan para complementar las becas de los estudiantes de movilidad.</p> <p>El informe, que se centra principalmente en analizar la disparidad de ayudas existentes en las Comunidades Aut&oacute;nomas, en la web de ESN se puede encontrar la informaci&oacute;n, y en se&ntilde;alar la bajada de la cofinanciaci&oacute;n nacional, busca reivindicar la importancia del apoyo financiero de las instituciones educativas para que los beneficios de la movilidad internacional estudiantil alcancen a toda la comunidad universitaria. Estos beneficios incluyen el aumento de la empleabilidad, la adquisici&oacute;n de valores comunes y el desarrollo de competencias clave para una sociedad m&aacute;s cohesionada.</p> <p>Aunque Erasmus+ es un programa de la Uni&oacute;n Europea, la Comisi&oacute;n y el Parlamento Europeo recomiendan encarecidamente que los Estados miembros aporten una cofinanciaci&oacute;n para maximizar el alcance y la inclusividad de las movilidades. El informe se&ntilde;ala que todos los estudios realizados en la materia, entre los que se incluyen el Erasmus Impact Study, ESNsurvey y el Eurobar&oacute;metro, coinciden que las barreras financieras constituyen uno de los principales obst&aacute;culos a la movilidad. A pesar de los esfuerzos realizados, Erasmus contin&uacute;a teniendo una participaci&oacute;n mayoritaria de estudiantes de entornos socioecon&oacute;micos elevados.</p> <p>El informe y el estudio realizado arrojan dos conclusiones claras. La primera es que, a pesar de que la financiaci&oacute;n europea aumenta cada a&ntilde;o, la cofinanciaci&oacute;n nacional al programa Erasmus se ha reducido m&aacute;s de un 50% desde el a&ntilde;o 2011, cuando alcanz&oacute; el m&aacute;ximo de m&aacute;s de 62 millones de euros. Este a&ntilde;o, la cantidad invertida ha sido de 30 millones, seg&uacute;n datos del Ministerio de Ciencia, Innovaci&oacute;n y Universidades. La segunda conclusi&oacute;n es que existe una gran disparidad entre las ayudas ofrecidas por las Comunidades Aut&oacute;nomas, principales responsables de la financiaci&oacute;n de las Universidades. El informe destaca el acierto de modelos como el andaluz que garantizan una ayuda complementaria a todos los estudiantes, la cual depende del nivel de renta del pa&iacute;s al que vayan, a&ntilde;adiendo, adem&aacute;s, una cantidad extra para estudiantes con pocos recursos econ&oacute;micos. La mayor&iacute;a de las Comunidades Aut&oacute;nomas cuentan con alg&uacute;n tipo de ayuda complementaria, aunque tanto las cuant&iacute;as como los criterios para optar a estas var&iacute;an enormemente. Por otra parte, se indica que las Comunidades Aut&oacute;nomas de Cantabria, Castilla La-Mancha, La Rioja, Madrid y Murcia, as&iacute; como las Ciudades Aut&oacute;nomas de Ceuta y Melilla, no cuentan con ning&uacute;n tipo de ayuda complementaria. Ambas entidades urgen a las Comunidades Aut&oacute;nomas a potenciar estas ayudas, considerando su gran impacto y valor a&ntilde;adido.</p> <p>El informe integro puede consultarse en las p&aacute;ginas web de CREUP y ESN.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '7/11/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP, CRUE y ESN piden al Gobierno que apoye triplicar la financiación para el Erasmus+',
          description:
            'El presidente de CREUP y los presidentes de Crue Universidades y de ESN Spain han firmado una carta conjunta en la que le piden al presidente del Gobierno en funciones que apoye la propuesta para triplicar la financiación del próximo programa Erasmus+ presentada por el Parlamento Europeo y promovida por la Comisión Europea.',
          contentHtml:
            '<p>El presidente de CREUP y los presidentes de Crue Universidades y de ESN Spain han firmado una carta conjunta en la que le piden al presidente del Gobierno en funciones que apoye la propuesta para triplicar la financiación del próximo programa Erasmus+ presentada por el Parlamento Europeo y promovida por la Comisión Europea.</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>En el documento enviado a La Moncloa, Pablo Alcaraz, Jos&eacute; Carlos G&oacute;mez Villamandos, y Juan Ray&oacute;n le recuerdan a Pedro S&aacute;nchez que ma&ntilde;ana, 8 de noviembre, se re&uacute;ne en Bruselas el Consejo de Asuntos Econ&oacute;micos y Financieros y el Consejo de Educaci&oacute;n, Cultura, Juventud y Deporte para debatir sobre la inversi&oacute;n de la UE en materia de Educaci&oacute;n, &laquo;momento clave para asegurar el suficiente respaldo econ&oacute;mico para la pr&oacute;xima generaci&oacute;n del programa Erasmus&raquo;.</p> <p>El objetivo de triplicar la financiaci&oacute;n de esta consolidada y exitosa iniciativa, que va mucho m&aacute;s all&aacute; de la movilidad de la comunidad universitaria, es asegurar un acceso m&aacute;s igualitario para un mayor n&uacute;mero de beneficiarios. As&iacute; se podr&iacute;a &laquo;dar una respuesta satisfactoria a la mayor demanda de peque&ntilde;as organizaciones y ciudadanos provenientes de entornos desfavorecidos&raquo;. Las tres asociaciones coinciden en la necesidad de reforzar el programa Erasmus+ para impulsar &ldquo;la internacionalizaci&oacute;n de las instituciones educativas&rdquo; y promover &ldquo;valores civiles comunes&rdquo; y una &ldquo;ciudadan&iacute;a activa&raquo;. </p> <ul><li><figure></figure></li><li><figure></figure></li></ul> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/el-estudiantado-estrecha-lazos-por-la-internacionalizacion-d.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '19/10/2019',
      tagSlugs: ['international-mobility'],
      translations: [
        {
          locale: 'es',
          title:
            'El estudiantado estrecha lazos por la internacionalización de la Universidad Española',
          description:
            'Las asociaciones ESN y CREUP firman un convenio para trabajar conjuntamente por la internacionalización y movilidaddel estudiantado universitario.',
          contentHtml:
            '<p>Las asociaciones ESN y CREUP firman un convenio para trabajar conjuntamente por la internacionalización y movilidaddel estudiantado universitario.</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Erasmus Student Network Espa&ntilde;a (ESN Espa&ntilde;a) y la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) ponen en marcha un convenio de colaboraci&oacute;n para trabajar por la internacionalizaci&oacute;n del Sistema Universitario Espa&ntilde;ol.&nbsp;</p> <p>En este convenio las entidades se comprometen a colaborar y cooperar de forma activa antes las instituciones y organismos p&uacute;blicos con el fin de lograr un Sistema Universitario social y de calidad, que garantice la internacionalizaci&oacute;n y movilidad del estudiantado universitario.&nbsp;</p> <p>Ambas entidades coinciden en afirmar que la internacionalizaci&oacute;n de la Universidad y, en especial, de su estudiantado&nbsp;contribuye enormemente a la diversidad cultural que es, a fin de cuentas, un enriquecimiento social.</p> </body></html> <center></center>',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/el-bloqueo-politico-deja-un-ano-mas-a-las-asociaciones-de-un.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '4/10/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'El bloqueo político deja un año más a las asociaciones de universitarios sin subvención',
          description:
            'Este curso académico no se ha convocado la subvención de asociaciones juveniles y a federaciones y confederaciones de estudiantes universitarios. Suele convocarse en el mes de julio o septiembre de cada año, en octubre aún no se tiene noticias. Una misma situación que se produjo en 2016 con la repetición de las Elecciones Generales.',
          contentHtml:
            '<p>Este curso académico no se ha convocado la subvención de asociaciones juveniles y a federaciones y confederaciones de estudiantes universitarios. Suele convocarse en el mes de julio o septiembre de cada año, en octubre aún no se tiene noticias. Una misma situación que se produjo en 2016 con la repetición de las Elecciones Generales.</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Esta subvenci&oacute;n supone una fuente de financiaci&oacute;n imprescindible para el desarrollo de la actividad asociativa universitaria, sin ella las asociaciones ven comprometida su actividad, lo que llega a implicar eventos de divulgaci&oacute;n al estudiantado.</p> <p>Adem&aacute;s de su inexistencia a d&iacute;a de hoy, la subvenci&oacute;n ha sufrido sucesivos recortes pasando de tener una asignaci&oacute;n de 300.000&euro; en 2011 a escasos 20.000&euro; en 2017 mientras el n&uacute;mero de beneficiarias permanece invariante, alrededor de las 20 asociaciones.</p> <p>Tanto el anterior Secretario General de Universidades, Jorge Sainz, como el actual, Jos&eacute; Manuel Pingarr&oacute;n, se comprometieron a aumentar la partida destinada, pero las sucesivas pr&oacute;rrogas de presupuesto han impedido que se haga.</p> <p>El estudiantado son el centro de la Universidad y sin estas subvenciones las asociaciones de estudiantes universitarios pierden su actividad e implicaci&oacute;n a nivel estatal. Por todo ello solicitamos que en pr&oacute;ximos presupuestos se garantice una partida con el suficiente presupuesto para asegurar su estabilidad.</p> </body></html> <center></center>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/09/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP se reúne con los grupos parlamentarios para plantear líneas de trabajo',
          description:
            'Las reuniones se han centrado en la necesidad de incluir al estudiantado en la negociación de la nueva Ley Orgánica de Universidades, la modificación del reglamento de régimen disciplinario de 1954, así como los sistemas de becas y ayudas al estudio, tasas universitarias y prácticas académicas.',
          contentHtml:
            '<p> Las reuniones se han centrado en la necesidad de incluir al estudiantado en la negociación de la nueva Ley Orgánica de Universidades, la modificación del reglamento de régimen disciplinario de 1954, así como los sistemas de becas y ayudas al estudio, tasas universitarias y prácticas académicas.</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Durante los d&iacute;as 10 y 11 de septiembre CREUP, Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas, ha mantenido reuniones con distintos grupos parlamentarios para plantear l&iacute;neas de trabajo que abordar a lo largo de la legislatura.</p> <p><br>Se ha contactado a todos los grupos parlamentarios y, en esta primera ronda, se han mantenido reuniones con el grupo Nacionalista del Senado y con los grupos Ciudadanos, Socialista y Popular del Congreso y del Senado a expensas de reunirse con el resto de grupos pr&oacute;ximamente.</p> <p><br>Las reuniones se han centrado en la necesidad de incluir al estudiantado en la negociaci&oacute;n de la nueva Ley Org&aacute;nica de Universidades, la modificaci&oacute;n del reglamento de r&eacute;gimen disciplinario de 1954, as&iacute; como los sistemas de becas y ayudas al estudio, tasas universitarias y pr&aacute;cticas acad&eacute;micas.</p> <p><br>En lo que respecta a las becas y ayudas al estudio los distintos grupos han coincidido en la urgencia de reformar el sistema actual para que pueda adaptarse a las necesidades del estudiando. La diputada Marta Mart&iacute;n (Ciudadanos) llega incluso a plantear la creaci&oacute;n de un grupo de trabajo mixto con otras asociaciones para estudiar los cambios que requiere el sistema y dise&ntilde;ar un nuevo modelo desde el di&aacute;logo con los colectivos implicados.</p> <p><br>En cuanto al sistema de pr&aacute;cticas, CREUP ha incidido en la necesidad de mejorar los mecanismos de control para evitar abusos en las pr&aacute;cticas y cerciorarse de su car&aacute;cter formativo. Por otro lado, se deben buscar medios para que al estudiante no le cueste dinero realizar pr&aacute;cticas debiendo al menos cubrirse los gastos de desplazamiento y manutenci&oacute;n derivados. No obstante, abordar las reformas propuestas deben ir de la mano con una mejora de la inversi&oacute;n en el sistema universitario. En palabras de Pablo Alcaraz, presidente de CREUP, &ldquo;pretender aspirar a un sistema universitario con el modelo de los pa&iacute;ses n&oacute;rdicos es imposible mientras la inversi&oacute;n p&uacute;blica con respecto al PIB est&eacute; m&aacute;s pr&oacute;xima del modelo privatizado estadounidense. [&hellip;] Espa&ntilde;a invierte 7.000$ menos por estudiante de lo que deber&iacute;a.&rdquo;</p> <ul><li><figure></figure></li><li><figure></figure></li><li><figure></figure></li><li><figure></figure></li><li><figure></figure></li></ul> </body></html> <center></center>',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/la-red-espanola-de-inmigracion-y-la-coordinadora-de-represen.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/08/2019',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'La Red Española de Inmigración y la Coordinadora de Representantes de Universidades Públicas constituyen el observatorio de las migraciones en la universidad',
          description:
            'La Coordinadora de Representantes de Estudiantes de las Universidades Públicas (CREUP) junto con la Red Española de Inmigración y Ayuda al Refugiado han firmado esta mañana el convenio de colaboración para la constitución del 1er Observatorio de Migración y Universidad. El objetivo planteado por las entidades promotoras, será el análisis de la problemática y los […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>La Coordinadora de Representantes de Estudiantes de las Universidades P&uacute;blicas (CREUP) junto con la Red Espa&ntilde;ola de Inmigraci&oacute;n y Ayuda al Refugiado han firmado esta ma&ntilde;ana el convenio de colaboraci&oacute;n para la constituci&oacute;n del 1er Observatorio de Migraci&oacute;n y Universidad. </p> <p>El objetivo planteado por las entidades promotoras, ser&aacute; el an&aacute;lisis de la problem&aacute;tica y los retos de la poblaci&oacute;n migrante en el acceso y permanencia en estudios Universitarios. Este nuevo organismo, buscar&aacute; responder al vac&iacute;o actual de datos y elementos de an&aacute;lisis que, en el caso del Estado Espa&ntilde;ol, carece de evaluaciones continuadas desde el a&ntilde;o 2008.</p> <p>Con esta hoja de ruta, se pretende visibilizar la grave situaci&oacute;n en que se encuentran las personas migrantes, con menos de un 1% de acceso a estudios superiores. </p> </body></html> <center></center>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '18/06/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas presenta enmiendas al RD por el que se establecen los umbrales de renta y patrimonio familiar y las cuantías de las becas y ayudas al estudio para el curso 2019 - 2020',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas, CREUP, presenta un total de 10 enmiendas al RD por el que se establecen los umbrales de renta y patrimonio familiar y las cuantías de las becas y ayudas al estudio para el curso 2019-2020 presentado por el Gobierno, tras entender que no se adecúan a […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>La Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas, CREUP, presenta un total de 10 enmiendas al <strong>RD por el que se establecen los umbrales de renta y patrimonio familiar y las cuant&iacute;as de las becas y ayudas al estudio para el curso 2019-2020</strong> presentado por el Gobierno, tras entender que no se adec&uacute;an a las necesidades reales del estudiantado. </p> <p>Las becas deben asegurar la <strong>igualdad de oportunidades</strong> en el acceso a la educaci&oacute;n, centr&aacute;ndose en aquellas personas que no tienen los medios econ&oacute;micos suficientes para poder comenzar sus estudios superiores. Por lo que carece de sentido que el estudiantado entre en un sistema de concurrencia competitiva, compitiendo por conseguir la cuant&iacute;a variable o que se impongan requisitos acad&eacute;micos para acceder a las diferentes cuant&iacute;as de la beca. &nbsp;Para poder corregir todo esto, las becas deben considerarse como un <strong>derecho subjetivo</strong> basado en criterios puramente econ&oacute;micos, en ning&uacute;n caso acad&eacute;micos. </p> <p>No obstante, para poder llegar a conseguir esto es necesaria la revisi&oacute;n de los umbrales de forma anual en funci&oacute;n del IPC. As&iacute; como, otras medidas como no contabilizar las propiedades de las que la unidad familiar demuestre no ser usufructuaria; regulaci&oacute;n de las cuant&iacute;as de las becas conforme a los cr&eacute;ditos matriculados del estudiantado a matr&iacute;cula parcial; establecer las mismas condiciones para aquellas personas que deciden emprender una segunda carrera o m&aacute;ster, actualmente penalizados y penalizadas por decidir seguir con su formaci&oacute;n; que las becas cubran los gastos necesarios para vivir durante el curso; &nbsp;que se revise la cuant&iacute;a fija ligada a la residencia en funci&oacute;n del lugar de destino o la reserva de una partida presupuestaria por parte del Ministerio para causas sobrevenidas, actualmente financiadas por las universidades o las Comunidades Aut&oacute;nomas. </p> <p>Sin m&aacute;s dilaci&oacute;n desde la Coordinadora de representantes de Estudiantes de Universidades P&uacute;blicas presentamos ante el Ministerio 10 enmiendas que contemplan desde la suspensi&oacute;n de las cuant&iacute;as ligadas a la excelencia acad&eacute;mica hasta la suspensi&oacute;n de la necesidad de certificado de rendimiento acad&eacute;mico para v&iacute;ctimas de violencia de g&eacute;nero. Por &uacute;ltimo, instamos a hacer efectiva la sentencia 188/2001 dictada por el Tribunal Constitucional, en la que se reconoce a la Generalitat de Catalu&ntilde;a la competencia para la gesti&oacute;n y concesi&oacute;n de las becas y ayudas. </p> <p>La Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas, CREUP, presenta un total de 10 enmiendas al <strong>RD por el que se establecen los umbrales de renta y patrimonio familiar y las cuant&iacute;as de las becas y ayudas al estudio para el curso 2019-2020</strong> presentado por el Gobierno, tras entender que no se adec&uacute;an a las necesidades reales del estudiantado.</p> <p>Las becas deben asegurar la <strong>igualdad de oportunidades</strong> en el acceso a la educaci&oacute;n, centr&aacute;ndose en aquellas personas que no tienen los medios econ&oacute;micos suficientes para poder comenzar sus estudios superiores. Por lo que carece de sentido que el estudiantado entre en un sistema de concurrencia competitiva, compitiendo por conseguir la cuant&iacute;a variable o que se impongan requisitos acad&eacute;micos para acceder a las diferentes cuant&iacute;as de la beca. &nbsp;Para poder corregir todo esto, las becas deben considerarse como un <strong>derecho subjetivo</strong> basado en criterios puramente econ&oacute;micos, en ning&uacute;n caso acad&eacute;micos. </p> <p>No obstante, para poder llegar a conseguir esto es necesaria la revisi&oacute;n de los umbrales de forma anual en funci&oacute;n del IPC. As&iacute; como, otras medidas como no contabilizar las propiedades de las que la unidad familiar demuestre no ser usufructuaria; regulaci&oacute;n de las cuant&iacute;as de las becas conforme a los cr&eacute;ditos matriculados del estudiantado a matr&iacute;cula parcial; establecer las mismas condiciones para aquellas personas que deciden emprender una segunda carrera o m&aacute;ster, actualmente penalizados y penalizadas por decidir seguir con su formaci&oacute;n; que las becas cubran los gastos necesarios para vivir durante el curso; &nbsp;que se revise la cuant&iacute;a fija ligada a la residencia en funci&oacute;n del lugar de destino o la reserva de una partida presupuestaria por parte del Ministerio para causas sobrevenidas, actualmente financiadas por las universidades o las Comunidades Aut&oacute;nomas. </p> <p>Sin m&aacute;s dilaci&oacute;n desde la Coordinadora de representantes de Estudiantes de Universidades P&uacute;blicas presentamos ante el Ministerio 10 enmiendas que contemplan desde la suspensi&oacute;n de las cuant&iacute;as ligadas a la excelencia acad&eacute;mica hasta la suspensi&oacute;n de la necesidad de certificado de rendimiento acad&eacute;mico para v&iacute;ctimas de violencia de g&eacute;nero. Por &uacute;ltimo, instamos a hacer efectiva la sentencia 188/2001 dictada por el Tribunal Constitucional, en la que se reconoce a la Generalitat de Catalu&ntilde;a la competencia para la gesti&oacute;n y concesi&oacute;n de las becas y ayudas. </p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '6/06/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas ve necesaria la revisión de las pruebas de acceso a la Universidad y se ofrece a trabajar ello',
          description:
            'Durante estos meses las distintas Comunidades Autónomas realizan las pruebas de acceso a la Universidad, a las que miles de estudiantes se enfrentan buscando alcanzar la nota que les permita entrar en los estudios que desean. Como cada año por estas fechas se abre el debate sobre cómo debería ser el modelo de prueba de […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p> Durante estos meses las distintas Comunidades Auto&#769;nomas realizan las pruebas de acceso a la Universidad, a las que miles de estudiantes se enfrentan buscando alcanzar la nota que les permita entrar en los estudios que desean. Como cada an&#771;o por estas fechas se abre el debate sobre co&#769;mo deberi&#769;a ser el modelo de prueba de acceso, pero este an&#771;o parece que el Gobierno se ha ofrecido a proceder a revisarlo.</p> <p> Desde la Coordinadora de Representantes de Estudiantes de Universidades Pu&#769;blicas, CREUP, nos alegramos que se haya vuelto a abrir el debate y que el Gobierno se muestre favorable a su revisio&#769;n. Tal y como afirmo&#769; la Ministra de Educacio&#769;n en sus declaraciones el pasado mie&#769;rcoles &laquo;He observado que habi&#769;a algunas incidencias que sen&#771;alaban a ciertas dificultades diferentes y eso es lo que vamos a tratar&raquo;, abre la puerta a la confeccio&#769;n de un grupo de trabajo mixto que estari&#769;a integrado por representantes del Ministerio, Comunidades Auto&#769;nomas y Universidades. </p> <p> CREUP observa diversas problema&#769;ticas en esta materia, ya que la en la elaboracio&#769;n de la Orden 47/2017 no se conto&#769; en ningu&#769;n momento con la visio&#769;n de estudiantado, pudiendo proporcionar una visio&#769;n real de la situacio&#769;n. Por esa razo&#769;n proponemos que las pruebas se realicen con criterios cuantitativos y objetivos, que garanticen la igualdad de condiciones a el estudiantado de todo el territorio nacional, lo que supone una unificacio&#769;n de contenido y forma en todas las Comunidades Auto&#769;nomas.</p> <p> Adema&#769;s la existencia de tasas para poder acceder a los derechos de realizacio&#769;n del examen supone una barrera econo&#769;mica para muchas familias, dejando fuera del sistema a una parte de estudiantes. Por ello apostamos por la eliminacio&#769;n de la barrera, hasta llegar a su total eliminacio&#769;n proponemos que en los presupuestos autono&#769;micos se reserve una partida presupuestaria con el objetivo de bonificar las tasas al estudiantado que no pueda asumir el importe. </p> <p> Por u&#769;ltimo, solicitamos que todo cambio en las pruebas o temario de bachillerato se aplique de cara a dos cursos acade&#769;micos, debido a que la prueba de acceso se prepara a lo largo de todo el bachillerato y el estudiantado debe de ser consciente del tipo de prueba a la que se va a enfrentar. </p> <p> Por todo ello desde CREUP nos ofrecemos a colaborar y trabajar en el grupo te&#769;cnico con el fin de trasladar la visio&#769;n y opinio&#769;n del estudiantado </p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: '/prensa/imagenes/ii-congreso-creup-crue-y-x-encuentro-creup-2019-03.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '27/03/2019',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'II Congreso CREUP - CRUE y X Encuentro CREUP',
          description:
            'Durante los días 28, 29 y 30 de marzo de 2019 tendrá lugar en la Universidad Complutense de Madrid el II Congreso de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) y la Conferencia de Rectores de las Universidades de España (CRUE) y el X Encuentro de Representantes de Estudiantes de Universidades Públicas […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Durante los di&#769;as <strong>28, 29 y 30 de marzo</strong> de 2019 tendra&#769; lugar en la <strong>Universidad Complutense de Madrid</strong> el <strong>II Congreso</strong> de la <strong>Coordinadora de Representantes de Estudiantes de Universidades Pu&#769;blicas</strong> (CREUP) y la <strong>Conferencia de Rectores de las Universidades de Espan&#771;a</strong> (CRUE) y el<strong> X Encuentro de Representantes de Estudiantes de Universidades Pu&#769;blicas</strong> (CREUP).</p> <p>A lo largo de los d&iacute;as 28 y 29 se desarrollar&aacute; el II Congreso CREUP-CRUE, en el que m&aacute;s de cien participantes del territorio nacional debatir&aacute;n e intercambiar&aacute;n ideas sobre el Sistema Universitario Espa&ntilde;ol entre representantes de CREUP y CRUE. </p> <p> Dos d&iacute;as repletos de acGvidad en los que a trav&eacute;s de mesas redondas se intercambiar&aacute;n ideas sobre temas como el sistema de acceso y admisi&oacute;n de las diferentes Universidades Espa&ntilde;olas, la pol&iacute;Gca cienOfica, las pr&aacute;cGcas externas o dimensi&oacute;n social. </p> <p> Al finalizar el II Congreso, tendr&aacute; lugar el X Encuentro de la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) en el que los asistentes realizan una simulaci&oacute;n de una Conferencia Ministerial y debatir&aacute;n sobre el papel del docente, la gesti&oacute;n de incidencias en las Universidades o la importancia de la representaci&oacute;n estudiantil. </p> <p>Ambos eventos tienen como objetivo el intercambio de ideas y la uni&oacute;n entre los diferentes representantes de universidades a nivel nacional, profundizando a trav&eacute;s de las mesas redondas sobre el Sistema Universitario actual y sus posibles mejoras de cara al futuro. </p> <p> Todo ello tendr&aacute; lugar en la <strong>Universidad Complutense de Madrid</strong> como sede &uacute;nica, sin la que no hubiera sido posible el desarrollo de los mismos. </p>  </body></html> <center></center>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/10/2018',
      tagSlugs: ['scholarships-funding', 'student-economy', 'international-mobility'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes valoran como un primer paso positivo las medidas contra el «tasazo»',
          description:
            'Tras el anuncio hoy del pacto para la aprobación de los Presupuestos Generales del Estado entre el Gobierno de España y el Grupo parlamentario confederal unidos podemos – en comú podem – en marea, desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas deseamos manifestar nuestra esperanza de que un nuevo tiempo comience a […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Tras el anuncio hoy del pacto para la aprobaci&oacute;n de los Presupuestos Generales del Estado entre el Gobierno de Espa&ntilde;a y el Grupo parlamentario confederal unidos podemos &ndash; en com&uacute; podem &ndash; en marea, desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas deseamos manifestar nuestra esperanza de que un nuevo tiempo comience a abrirse para la educaci&oacute;n superior en nuestro pa&iacute;s.</p> <p>Valoramos muy positivamente que, como ven&iacute;amos reivindicando desde hace tiempo, la universidad haya sido uno de los puntos sobre los que se haya alcanzado un acuerdo que permita revertir los enormes da&ntilde;os producidos por el RD 14/2012, popularmente conocido como el tasazo y que ha implicado que muchos estudiantes hayan tenido que abandonar sus estudios.</p> <p>No obstante, queremos dejar claro que esto simplemente representa un peque&ntilde;o paso en el camino para conseguir la equidad e igualdad de oportunidades en nuestro sistema educativo, siendo necesaria una profunda revisi&oacute;n del actual sistema de becas y ayudas al estudio y de la estructura de nuestro sistema universitario, as&iacute; como contar con la complicidad de las comunidades aut&oacute;nomas, para que doten de los recursos humanos y econ&oacute;micos necesarios a las universidades que de ellas dependen.</p> <p>Se autoriza a la reproducci&oacute;n total o parcial del presente comunicado sin necesidad de citar la fuente.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '2/08/2018',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'Representantes de estudiantes de universidades públicas reclaman un mejor sistema de becas y manifiestan su disconformidad con el real decreto actual',
          description:
            'El Gobierno ha hecho efectiva la publicación del Real Decreto 951/2018 que fija los umbrales de renta y patrimonio familiar y las cuantías de becas y ayudas al estudio para el curso 2018-2019. Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) nos sentimos en la obligación de dejar presente nuestra profunda decepción […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>El Gobierno ha hecho efectiva la publicaci&oacute;n del Real Decreto 951/2018 que fija los umbrales de renta y patrimonio familiar y las cuant&iacute;as de becas y ayudas al estudio para el curso 2018-2019.</p> <p>Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) nos sentimos en la obligaci&oacute;n de dejar presente nuestra profunda decepci&oacute;n sobre el contenido de este Real Decreto, que poco ha cambiado en contenido con respecto al del anterior gobierno y que mantiene a miles de estudiantes en una situaci&oacute;n de incertidumbre, de manera que, una vez m&aacute;s, no conocen la cuant&iacute;a final de su beca hasta su resoluci&oacute;n. Adem&aacute;s, la aparici&oacute;n de criterios de excelencia acad&eacute;mica da lugar a confusi&oacute;n sobre la verdadera finalidad de este Real Decreto, ya que estos no tienen cabida si lo que se persigue es garantizar el derecho a la educaci&oacute;n.</p> <p>Igualmente, no podemos sino mostrar nuestro descontento con la actuaci&oacute;n y las formas del Ministerio durante la tramitaci&oacute;n de este Real Decreto, que, incumpliendo la legislaci&oacute;n vigente, no ha sido trasladado al pleno del Consejo de Estudiantes Universitario del Estado (CEUNE), sentando un m&aacute;s que peligroso precedente al someterse &uacute;nica y malamente a la Comisi&oacute;n Permanente de &eacute;ste.</p> <p>Como bien ha se&ntilde;alado la Conferencia de Rectores de Universidades Espa&ntilde;olas (CRUE), resulta inaudito que, siendo Espa&ntilde;a el cuarto Estado de la Uni&oacute;n Europea con los precios p&uacute;blicos m&aacute;s altos (muy por encima de nuestros socios m&aacute;s cercanos), el presupuesto destinado a becas y ayudas al estudio se encuentre por debajo de la media de la OCDE. De nuevo, se muestra c&oacute;mo claramente la falta de inter&eacute;s en la inversi&oacute;n en la educaci&oacute;n y en las ayudas para garantizar un acceso equitativo a &eacute;sta no se encuentran entre las prioridades de este Ejecutivo, como tampoco lo han sido de los anteriores ejecutivos.</p> <p>Para esta organizaci&oacute;n, el sistema de becas y ayudas al estudio es la materializaci&oacute;n del derecho fundamental de acceso y continuaci&oacute;n de la educaci&oacute;n superior universitaria y tiene como fin la eliminaci&oacute;n de aquellas barreras socioecon&oacute;micas que lo impidan para dar lugar a una universidad libre de precios p&uacute;blicos y dotada de ayudas que permitan hacer frente a los costes derivados de la formaci&oacute;n del estudiantado.</p> <p>Desde CREUP llevamos a&ntilde;os trabajando en la elaboraci&oacute;n de propuestas que permitan conseguir de la manera m&aacute;s r&aacute;pida y eficaz este fin.</p> <p>Entre ellas, destacan las m&uacute;ltiples peticiones al Gobierno para que las becas sean un derecho subjetivo para el estudiantado, de manera que la daci&oacute;n de estas ayudas no est&eacute; limitada a una partida presupuestaria, o la solicitud de &nbsp;la eliminaci&oacute;n de requisitos acad&eacute;micos permitiendo as&iacute; que solo se tenga en cuenta la situaci&oacute;n sociecon&oacute;mica del estudiantado y garantizando de este modo la igualdad en el acceso.</p> <p>Tambi&eacute;n, se ha instado a que se tengan en cuenta los complementos de distancia y movilidad de estudiantes respecto al centro en el que estudian y que se actualice la cuant&iacute;a por residencia, y a que el estudiantado a tiempo parcial reciba una beca proporcional al n&uacute;mero de cr&eacute;ditos matriculados.</p> <p>A pesar de todo, agradecemos al nuevo Gobierno su prop&oacute;sito firme de revisar en profundidad el actual modelo de becas y ayudas al estudio y que tenga en mente aumentar su financiaci&oacute;n para incrementar el n&uacute;mero de estudiantes con beca, as&iacute; como la cuant&iacute;a de las propias becas.</p> <p>Consideramos que, para ello, debe darse un proceso de di&aacute;logo y an&aacute;lisis serio y riguroso con los agentes educativos implicados para analizar la pol&iacute;tica de becas, en el que, por supuesto, esperamos que el contacto con la representaci&oacute;n del estudiantado universitario vaya m&aacute;s all&aacute; de la Comisi&oacute;n Permanente del CEUNE.</p> <p>Del mismo modo, es necesario que se vuelva a convocar el Observatorio de Becas, Ayudas al Estudio y Rendimiento Acad&eacute;mico, inactivo desde su creaci&oacute;n en 2010, y esencial para obtener una visi&oacute;n general de las necesidades, de las posibilidades, y del futuro del sistema de becas y ayudas en este Estado.</p> <p>Como representantes de estudiantes, vemos imprescindible que los cambios legislativos vengan acompa&ntilde;ados de un profundo di&aacute;logo, m&aacute;s a&uacute;n cuando los temas son de vital importancia, como es la pol&iacute;tica de becas y ayudas al estudio. Desde CREUP tendemos nuestra mano al Ejecutivo para colaborar en el dise&ntilde;o y la creaci&oacute;n del nuevo marco legislativo universitario, y del nuevo sistema de becas y ayudas, que tan ansiadamente esperamos.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '18/06/2018',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Carta abierta al Grupo Parlamentario Ciudadanos en el Congreso de los Diputados',
          description:
            'A/A Grupo Parlamentario Ciudadanos en el Congreso de los Diputados Hace casi un mes que el Grupo Parlamentario Ciudadanos presentaba una propuesta de ley de mejora de la autonomía y la rendición de cuentas de las universidades españolas. Una propuesta llevada a cabo sin la participación de ninguno de los colectivos que forman la Universidad […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>A/A Grupo Parlamentario Ciudadanos en el Congreso de los Diputados</p> <p>Hace casi un mes que el Grupo Parlamentario Ciudadanos presentaba una propuesta de ley de mejora de la autonom&iacute;a y la rendici&oacute;n de cuentas de las universidades espa&ntilde;olas. Una propuesta llevada a cabo sin la participaci&oacute;n de ninguno de los colectivos que forman la Universidad (estudiantes, personal docente e investigador y personal de administraci&oacute;n y servicios) ni de sus representantes (Consejos de Estudiantes, sindicatos de trabajadores, CRUE).</p> <p>Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas, al igual que se ha manifestado desde la Conferencia de Rectores de las Universidades Espa&ntilde;olas, no podemos comprender c&oacute;mo un texto que surge de una situaci&oacute;n en la que se clama por la transparencia ha seguido el procedimiento m&aacute;s opaco posible: ni se ha contactado con ning&uacute;n colectivo, ni se ha informado a &eacute;stos de que se empezaba a trabajar en &eacute;l; ni siquiera se ha pedido una m&iacute;nima opini&oacute;n a quienes d&iacute;a tras d&iacute;a, vivimos y hacemos universidad.</p> <p>Comprendemos que, dadas las caracter&iacute;sticas de la situaci&oacute;n en la que emana el texto, con dudas sobre la transparencia y la actividad de la Universidad, sea urgente y necesario plantear medidas para evitar que se repitan estos hechos. No obstante, el oportunismo pol&iacute;tico no puede justificar en ning&uacute;n caso que se obvie a la representaci&oacute;n de los sectores a los que afectar&aacute; directamente un cambio legislativo. Es una irresponsabilidad que ning&uacute;n partido deber&iacute;a cometer.</p> <p>Desde la CREUP esperamos que tanto el Grupo Parlamentario Ciudadanos, como el resto de Grupos con intenciones de realizar proposiciones relacionadas con la Educaci&oacute;n, tomen en cuenta de una vez por todas a todos los agentes implicados en la realidad universitaria, en vez de escudarse en idearios alejados de lo que de verdad aspira a ser la Universidad.</p> <p>Queremos, por tanto, tender la mano y ofrecer nuestra colaboraci&oacute;n en el debate sobre estado de la Universidad. Creemos que la consulta a los diferentes sectores que la conforman es la base para trabajar desde una perspectiva real de la situaci&oacute;n y as&iacute; poder analizar en profundidad cu&aacute;les son las cuestiones que pueden y deben ser reformadas.</p> <p>Desde CREUP disentimos de lo expresado en esta propuesta, que es contraria a nuestros posicionamientos y que, creemos, nace de un an&aacute;lisis equivocado de los problemas que pueden afectar a la Universidad.</p> <p>Se autoriza a publicar lo recogido en este documento sin necesidad de citar la fuente.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '23/05/2018',
      tagSlugs: ['scholarships-funding', 'student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Sobre los nuevos criterios para becas',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), como voz de los estudiantes querríamos manifestar nuestra disconformidad y decepción con los criterios para la concesión de las becas para estudiantes universitarios durante el curso 2018-2019 anunciadas hoy por el ministro Méndez de Vigo. En primer lugar, estamos de acuerdo en que se […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP), como voz de los estudiantes querr&iacute;amos manifestar nuestra disconformidad y decepci&oacute;n con los criterios para la concesi&oacute;n de las becas para estudiantes universitarios durante el curso 2018-2019 anunciadas hoy por el ministro M&eacute;ndez de Vigo.</p> <p>En primer lugar, estamos de acuerdo en que se haya realizado por fin una bajada de los criterios acad&eacute;micos en la beca de matr&iacute;cula de un 5,5 a un 5 para aquellos estudiantes que habiendo aprobado la prueba de acceso a la universidad se matriculen por primera vez de sus estudios universitarios.</p> <p>Un sistema de becas para estudiantes con necesidades econ&oacute;micas tiene como fin garantizar la igualdad de oportunidades permitiendo el acceso a la universidad a todo el estudiantado sin que se d&eacute; una discriminaci&oacute;n por motivos de renta, por lo que, si queremos garantizar un acceso universal, los criterios acad&eacute;micos no pueden suponer una barrera a la hora de recibir una beca para un estudiante de renta baja.</p> <p>Sin embargo, de cara al curso que viene se seguir&aacute;n manteniendo los criterios acad&eacute;micos para concesi&oacute;n de beca a estudiantes matriculados de segundos y posteriores cursos, as&iacute; como los criterios de devoluci&oacute;n de la beca, manteniendo adem&aacute;s un sistema de concurrencia competitiva que no permite a los estudiantes m&aacute;s necesitados acceder al sistema universitario, pues no debemos olvidar que muchos de estos estudiantes, deben hacer frente a los gastos que conlleva estudiar (que no son &uacute;nicamente los de matr&iacute;cula) e incluso sostener econ&oacute;micamente a sus familias.</p> <p>Una vez m&aacute;s lamentamos que estas noticias deban llegar a trav&eacute;s de la prensa y no del di&aacute;logo con los agentes sociales, ya que, a d&iacute;a de hoy, los estudiantes seguimos sin tener el texto de la nueva convocatoria de becas y no se nos ha convocado para emitir el informe preceptivo que establece la ley, de igual modo que no se ha convocado al Observatorio de Becas.</p> <p>Es por ello que desde CREUP instamos al gobierno a revisar en profundidad y en conjunto con la comunidad universitaria, especialmente con los representantes de los estudiantes, el Real Decreto por el que se establece el r&eacute;gimen de las becas y ayudas al estudio personalizadas de tal modo que permita que ning&uacute;n estudiante se quede fuera del sistema por motivos socioecon&oacute;micos.</p> <p>Estudiar no es un privilegio, es un derecho.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '5/04/2018',
      tagSlugs: ['university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Caso cifuentes',
          description:
            'La pasada semana con motivo de lo acontecido en la Universidad Rey Juan Carlos respecto al máster cursado por Cristina Cifuentes, desde CREUP solicitamos a la ANECA (como Agencia de Calidad) que revisara el máster de dicha universidad y a los y las profesoras involucrados en este caso. Ayer recibimos la respuesta de ANECA y […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>La pasada semana con motivo de lo acontecido en la Universidad Rey Juan Carlos respecto al m&aacute;ster cursado por Cristina Cifuentes, desde CREUP solicitamos a la ANECA (como Agencia de Calidad) que revisara el m&aacute;ster de dicha universidad y a los y las profesoras involucrados en este caso.</p> <p>Ayer recibimos la respuesta de ANECA y en esta respuesta nos comunican que no es esta agencia la competente sino que lo es la Fundaci&oacute;n para el Conocimiento Madri+d.</p> <p>No pensamos que una fundaci&oacute;n que depende de la Comunidad de Madrid &ndash; La propia Cifuentes nombr&oacute; al director de esta fundaci&oacute;n &ndash; sea la que garantice la objetividad del proceso de evaluaci&oacute;n de este m&aacute;ster.</p> <p>Los y las representantes de estudiantes consideramos que los mayores damnificados en este asunto son los estudiantes de la URJC en concreto y de las universidades p&uacute;blicas en general, pues este caso est&aacute; sirviendo para atacar esta instituci&oacute;n y no creemos que las declaraciones de Cristina Cifuentes en el pleno extraordinario del 4 de abril hayan servido para esclarecer los diferentes hechos expuesto por algunos medios y desde luego tampoco para transmitir seguridad a la comunidad universitaria.</p> <p>Por ello solicitamos ser parte del equipo que, de manera externa, va a inspeccionar los hechos acontecidos para tratar de arrojar un poco de luz a este caso.</p> <p>Nuestra mayor preocupaci&oacute;n es y ser&aacute; siempre la defensa de la educaci&oacute;n p&uacute;blica.</p> <p>&nbsp;</p> <p>En Madrid, 5 de abril de 2018</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '30/01/2018',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP y CRUE firman un convenio de cooperación',
          description:
            'Se estrechan lazos entre la representación académica y estudiantil universitaria Tona, 30 de enero de 2018 Esta tarde Carmen Romero, Presidenta de CREUP y Roberto Fernández, Presidente de CRUE y Rector de la Universitat de Lleida han firmado un convenio de cooperación entre la Coordinadora de Representantes de Estudiantes de Universidades Públicas, que representan a […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1>Se estrechan lazos entre la representaci&oacute;n acad&eacute;mica y estudiantil universitaria <p><em>Tona, 30 de enero de 2018</em></p> <p>Esta tarde <strong>Carmen Romero,</strong> Presidenta de CREUP y <strong>Roberto Fern&aacute;ndez,</strong> Presidente de CRUE y Rector de la Universitat de Lleida han firmado un convenio de cooperaci&oacute;n entre la <strong>Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas, </strong>que representan a m&aacute;s de un mill&oacute;n de estudiantes, y <strong>Crue Universidades Espa&ntilde;olas.</strong></p> <p>Ambas partes han acordado colaborar en diversas actividades que intensifiquen la relaci&oacute;n entre CRUE y CREUP. Asimismo, han enfatizado la importancia de una relaci&oacute;n m&aacute;s estrecha entre la representaci&oacute;n acad&eacute;mica y estudiantil universitaria, con el fin de que cada una comprenda mejor las necesidades de la otra organizaci&oacute;n, y se retroalimenten positivamente para un mayor impacto positivo en la sociedad y se responda mejor a sus desaf&iacute;os actuales.</p> <p>Este acuerdo, que tiene una duraci&oacute;n de un a&ntilde;o y con opci&oacute;n a renovaci&oacute;n, sedesa&nbsp; rroll ar&aacute; mediante convenios de colaboraci&oacute;n espec&iacute;ficos. De tal forma que seconcretar&aacute;n sus objetivos y actuaciones con cada uno de los acuerdos para tratar todas las problem&aacute;ticas de la vida acad&eacute;mica y estudiantil de manera &aacute;gil y rigurosa.</p> <p>Tras la reuni&oacute;n, Carmen Romero se ha mostrado satisfecha con la firma del convenio y ha manifestado que &ldquo;desde CREUP estamos muy contentos con la formalizaci&oacute;n de la relaci&oacute;n con CRUE a trav&eacute;s de la cual podremos seguir mejorando el sistema universitario espa&ntilde;ol conjuntamente&rdquo;.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '20/09/2017',
      tagSlugs: ['university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP inaugura el curso académico 2017/2018',
          description:
            'Un año más, CREUP inaugura el curso académico 2017/2018 abriendo las puertas de su Escuela de Participación Estudiantil (EPE), con una de sus actividades más esperadas: la cuarta edición del Stage Formativo, durante los días 20 a 24 de septiembre. El evento reunirá a representantes de estudiantes de las treinta-i-cinco universidades públicas que componen CREUP […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Un a&ntilde;o m&aacute;s, CREUP inaugura el curso acad&eacute;mico 2017/2018 abriendo las puertas de su Escuela de Participaci&oacute;n Estudiantil (EPE), con una de sus actividades m&aacute;s esperadas: la cuarta edici&oacute;n del Stage Formativo, durante los d&iacute;as 20 a 24 de septiembre.</p> <p>El evento reunir&aacute; a representantes de estudiantes de las treinta-i-cinco universidades p&uacute;blicas que componen CREUP con el objetivo de contribuir a la formaci&oacute;n de &eacute;stos con las habilidades necesarias para transmitir esos mismos conocimientos y din&aacute;micas a sus compa&ntilde;eros en sus universidades de origen, y all&iacute; donde se soliciten sus servicios, una vez completada su formaci&oacute;n.</p> <p>Las principales l&iacute;neas a trabajar en la presente edici&oacute;n ser&aacute;n la garant&iacute;a de la calidad (interna y externa), la pol&iacute;tica universitaria y estrategia pol&iacute;tica comunicativa, siempre teniendo como hilo conductor un enfoque centrado en la<br>igualdad. Todas las sesiones ser&aacute;n impartidas por expertos en las distintas &aacute;reas.</p> <p>Las jornadas de convivencia y formaci&oacute;n tendr&aacute;n lugar en el albergue juvenil Las Dehesas, propiedad de la Comunidad de Madrid, a 2 km de la localidad de Cerdecillas.</p> <p>CREUP invita a todos los medios a hacerse eco de esta noticia y a cubrirla de modo presencial, si lo estima oportuno.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '16/04/2017',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'I Congreso «La Universidad del Mañana»',
          description:
            'El I Congreso “La Universidad del Mañana” tendrá lugar en la Universidad Politécnica de Madrid el 20 y 21 de abril de 2017, es el primer Congreso celebrado conjuntamente entre la Coordinadora de Representantes de Estudiantes de las Universidades Públicas (CREUP) y la Conferencia de Rectores de las Universidades de España (CRUE). A lo largo […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>El I Congreso &ldquo;La Universidad del Ma&ntilde;ana&rdquo; tendr&aacute; lugar en la <strong>Universidad Polit&eacute;cnica de Madrid</strong> el <strong>20 y 21 de abril de 2017</strong>, es el primer Congreso celebrado conjuntamente entre la Coordinadora de Representantes de Estudiantes de las Universidades P&uacute;blicas (CREUP) y la Conferencia de Rectores de las Universidades de Espa&ntilde;a (CRUE). A lo largo de dos d&iacute;as, <strong>m&aacute;s de cien participantes</strong> de toda la pen&iacute;nsula intercambiar&aacute;n ideas y plantear&aacute;n un nuevo panorama para la Educaci&oacute;n Universitaria en Espa&ntilde;a.</p> <p>El Sistema Universitario Espa&ntilde;ol ha vivido una de sus &eacute;pocas m&aacute;s convulsas en los &uacute;ltimos a&ntilde;os. Despu&eacute;s de duros recortes, inestabilidad y poco debate, se abre tras la crisis econ&oacute;mica, una nueva etapa donde juntos tenemos que decidir cu&aacute;l debe ser el futuro de la Universidad en Espa&ntilde;a de los pr&oacute;ximos a&ntilde;os.</p> <p>La formaci&oacute;n, el debate y la comprensi&oacute;n se tornan valores m&aacute;s importantes que nunca si queremos llegar a un punto en com&uacute;n sobre que&#769; modelo de Universidad necesita nuestro pa&iacute;s. Esta primera edici&oacute;n (La Universidad del Ma&ntilde;ana) pretende ser un espacio donde poder llevar a cabo esta labor. El primer evento conjunto entre <strong>Rectorados y </strong><strong>Representantes de Estudiantes</strong> pretende ser un punto de encuentro donde a trav&eacute;s de distintas mesas redondas, profundizar sobre el presente y el futuro de la Universidad Espa&ntilde;ola.</p> <p>Para m&aacute;s informaci&oacute;n puede consultar la p&aacute;gina web del evento: <a href="/prensa/documentos/i-congreso-la-universidad-del-manana-2017-04.pdf">I Congreso CREUP -CRUE &laquo;La Universidad del Ma&ntilde;ana&raquo;</a> o ponerse en contacto con nosotros.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '20/06/2016',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Gorka Martín, nuevo presidente de CREUP',
          description:
            'Gorka Martín Terrón, toma posesión de su cargo como Presidente de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) tras los 45 días establecidos por los estatutos de esta. La elección tuvo lugar durante la LVI Asamblea General Ordinaria de CREUP, celebrada en la Universidad de Castilla-La Mancha el pasado mes de mayo […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Gorka Mart&iacute;n Terr&oacute;n, toma posesi&oacute;n de su cargo como Presidente de la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) tras los 45 d&iacute;as establecidos por los estatutos de esta. La elecci&oacute;n tuvo lugar durante la LVI Asamblea General Ordinaria de CREUP, celebrada en la Universidad de Castilla-La Mancha el pasado mes de mayo y que cont&oacute; con la presencia de un centenar de representantes de estudiantes de toda Espa&ntilde;a.</p> <p>Gorka Mart&iacute;n, estudiante de 25 a&ntilde;os y de la Universidad de Granada (UGR), cuenta con una amplia experiencia en la representaci&oacute;n estudiantil a nivel regional y estatal. Antes de ser elegido como Presidente de la Coordinadora, fue Coordinador General de Estudiantes de la UGR y Vocal de Organizaciones Estudiantiles de CREUP.</p> <p>El nuevo equipo que formar&aacute; la nueva Comisi&oacute;n Ejecutiva de CREUP cuenta con Gorka Mart&iacute;n de Presidente; Kenji Muro, estudiante de la Carlos III, como Secretario; Oriol Rivera, de la Polit&eacute;cnica de Catalu&ntilde;a, como Vicepresidente de Relaciones Externas; B&aacute;rbara Espinosa, de la Miguel Hern&aacute;ndez de Elche, como Vicepresidenta de Organizaci&oacute;n; Esther L&oacute;pez, Juan Pablo Carrasco y Cruz Ruiz, de la Universidad de Castilla-La Mancha, como Tesorera, Vicepresidente de Pol&iacute;tica Universitaria y Formaci&oacute;n y Director del Gabinete de Comunicaci&oacute;n, respectivamente.</p> <p>&laquo;Nos presentamos con mucha ilusi&oacute;n, pero sobretodo con una gran responsabilidad. Somos un equipo con mucha experiencia en todos los &aacute;mbitos y vamos a trabajar para que se hable de Universidad&raquo; fueron las palabras de Gorka Mart&iacute;n tras conocerse el resultado de las elecciones. El nuevo Presidente tambi&eacute;n declar&oacute; que &laquo;la universidad se encuentra en un momento crucial, estamos a pocos d&iacute;as de las elecciones y necesitamos que se hable de educaci&oacute;n. Hay que luchar y pelear para bajar las tasas. Tenemos que hacer un ejercicio de pedagog&iacute;a para hacer entender que esto no es un gasto, es una necesaria inversi&oacute;n de futuro&raquo;.</p> <strong>Primer acto oficial de Mart&iacute;n como presidente de CREUP</strong> <p>Seg&uacute;n palabras de Gorka Mart&iacute;n: &laquo;Este ejercicio de pedagog&iacute;a se est&aacute; llevando a cabo con la campa&ntilde;a #DerechoAEstudiar. Tras la reuni&oacute;n mantenida con la Defensora del Pueblo se demuestra que est&aacute; dando sus frutos para que la sociedad se involucre en la defensa de la Universidad P&uacute;blica que defendemos&raquo;.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '16/06/2016',
      tagSlugs: ['scholarships-funding', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP traslada a la Defensora del Pueblo los problemas del Sistema de Becas y ayudas',
          description:
            'En la mañana de hoy CREUP se ha reunido con la Defensora del Pueblo, Soledad Becerril, tras la carta remitida por la Organización estudiantil el pasado 4 de junio en la que solicitaba una investigación sobre el sistema de becas y ayudas al estudio. A la reunión, que ha tenido lugar en la sede de […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>En la ma&ntilde;ana de hoy CREUP se ha reunido con la Defensora del Pueblo, Soledad Becerril, tras la carta remitida por la Organizaci&oacute;n estudiantil el pasado 4 de junio en la que solicitaba una investigaci&oacute;n sobre el sistema de becas y ayudas al estudio.</p> <p>A la reuni&oacute;n, que ha tenido lugar en la sede de la Defensora del Pueblo en Madrid, ha asistido el nuevo Presidente de CREUP, Gorka Mart&iacute;n, acompa&ntilde;ado del expresidente, Luis Cereijo, y &Aacute;lvaro Cerame, ex Vicepresidente de Relaciones Externas.</p> <p>CREUP, ha trasladado a la Defensora los problemas del actual Sistema de Becas y Ayudas al Estudio, centrados en aspectos relacionados con la cuant&iacute;a de las ayudas, la falta de certidumbre de las familias al no saber la cuant&iacute;a ni la fecha de recepci&oacute;n de la ayuda, as&iacute; como los criterios acad&eacute;micos.</p> <p>Asimismo, la falta de interlocuci&oacute;n entre el estudiantado y el actual Gobierno ha sido uno de los problemas comunicados a Soledad Becerril. Se le ha comunicado los incumplimientos de los reales decretos que establecen la obligatoriedad de convocar el Consejo de Estudiantes Universitarios del Estado y el Observatorio de Ayudas al Estudio y Rendimiento Acad&eacute;mico.</p> <p>Tras la reuni&oacute;n mantenida, Gorka Mart&iacute;n se ha manifestado satisfecho con la reuni&oacute;n: &laquo;es agradable percibir de una instituci&oacute;n del Estado sensibilidad a la problem&aacute;tica que est&aacute; viviendo el colectivo estudiantil&raquo;. Asimismo, a&ntilde;adi&oacute; que &laquo;nos alegra conocer el trabajo de la Defensora del Pueblo con el sistema de becas y comprobar que compartimos sus posturas, especialmente la relacionada con la carencia de participaci&oacute;n en el dise&ntilde;o de becas, campo en el que se va a centrar esta actuaci&oacute;n&raquo;.</p> <p>Desde CREUP recuerdan que los reales decretos aprobados en esta Legislatura pol&iacute;tica han contado con el rechazo total de la CRUE, la Conferencia de Rectores de las Universidades de Espa&ntilde;a. Esta situaci&oacute;n refuerza la posici&oacute;n de CREUP para hacer que, desde la Defensora del Pueblo, se investigue la viabilidad de los actuales sistemas de ayudas y becas del Ministerio de Educaci&oacute;n.</p> </body></html>',
        },
      ],
    },
    {
      type: 'press_release',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '30/11/2015',
      tagSlugs: ['scholarships-funding', 'student-economy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP clausura su LVI Asamblea General exigiendo un sistema universitario libre de tasas',
          description:
            'Más de 70 representantes universitarios de 30 organizaciones estudiantiles se dieron cita desde el jueves en la Universidad de Salamanca Salamanca, 30 de noviembre de 2015 La Coordinadora de Representantes de Estudiantes de Universidades Públicas ha clausurado este domingo su LV Asamblea General que se ha celebrado desde el jueves 26 en la Universidad de […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1>M&aacute;s de 70 representantes universitarios de 30 organizaciones estudiantiles se dieron cita desde el jueves en la Universidad de Salamanca <p><em>Salamanca, 30 de noviembre de 2015</em></p> <p>La Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas ha clausurado este domingo su LV Asamblea General que se ha celebrado desde el jueves 26 en la Universidad de Salamanca con la presencia de m&aacute;s de 70 representantes universitarios de m&aacute;s de una treintena de organizaciones estudiantiles de todo el Estado.</p> <p>Durante esta Asamblea General, la principal organizaci&oacute;n estudiantil del Estado -que ya representa a m&aacute;s de 1.000.000 de estudiantes universitarios- ha aprobad diversos posicionamientos acad&eacute;micos y resoluciones, entre los que se encuentra el referido en la Dimensi&oacute;n Social de la Educaci&oacute;n Superior y las Barreras de Acceso a esta en la que CREUP exige que las primeras matr&iacute;culas de los estudios universitarios oficiales est&eacute;n libres de ning&uacute;n tipo de coste asociado a los derechos acad&eacute;micos.</p> <p>El documento, que fue aprobado por unanimidad de su Asamblea General tras el proceso de debate y votaci&oacute;n de las enmiendas presentadas, establece un posicionamiento claro y expl&iacute;cito del colectivo estudiantil en referencia a los precios p&uacute;blicos, becas y ayudas al estudio, la conciliaci&oacute;n de la vida acad&eacute;mica y la vida personal o la atenci&oacute;n a grupos infrarrepresentados como aquellos con diversidad funcional, diversidad afectivo sexual o diversidad cultural.</p> <p>Sobre este asunto, Victor Mar&iacute;n, Vicepresidente de Pol&iacute;tica Universitaria de la organizaci&oacute;n estudiantil, afirm&oacute; al t&eacute;rmino de la Asamblea que &laquo;hoy el colectivo estudiantil universitario del Estado ha tomado una postura firme sobre qu&eacute; Universidad y sobre los retos que debe asumir para cumplir su misi&oacute;n como agente determinante en la garant&iacute;a de la igualdad de oportunidades de una sociedad plural, justa y democr&aacute;tica&raquo;.</p> <p>Luis Cereijo, Presidente de CREUP, ha declarado que &laquo;exigimos que las fuerzas pol&iacute;ticas que gobiernen el Estado durante la pr&oacute;xima legislatura, as&iacute; como nuestras Universidades y Comunidades Aut&oacute;nomas, establezcan las pol&iacute;ticas necesarias para cumplir con lo que el colectivo estudiantil esperamos de nuestro Sistema Universitario, construyendo as&iacute; un Sistema Universitario democr&aacute;tico, justo y accesible para toda la ciudadan&iacute;a independientemente de sus circunstancias socioecon&oacute;micas y culturales&raquo;.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/02/2026',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP se posiciona en contra de la ley universitaria para andalucía (LUPA)',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de las Universidades Públicas (CREUP) manifestamos nuestro firme rechazo a la Ley Universitaria para Andalucía (LUPA) que se aprueba hoy en el Parlamento andaluz, una norma que afecta directamente al presente y al futuro del estudiantado universitario.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '15/01/2026',
      tagSlugs: ['rights-coexistence-equality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Comunicado de CREUP ante la intervención militar en la Universidad de Birzeit',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) expresa su firme condena ante la intervención militar ocurrida el pasado 6 de enero en la Universidad palestina de Birzeit, en Cisjordania, durante el desarrollo de la actividad académica, y que, según la información disponible, dejó al menos once estudiantes heridos.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '27/11/2025',
      tagSlugs: ['student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Comunicado de CREUP acerca de las manifestaciones de las universidades públicas madrileñas',
          description:
            'Desde CREUP queremos mostrar nuestro firme apoyo y solidaridad a la comunidad universitaria de las seis universidades públicas madrileñas convocantes de la huelga de 26 y 27 de noviembre de 2025.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/07/2025',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Comunicado de CREUP sobre el veto a nuevos grados en universidades públicas andaluzas en favor de las privadas',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) mostramos nuestra disconformidad con la política que se está llevando a cabo por parte del gobierno andaluz, en relación a las universidades públicas de Andalucía.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '21/06/2024',
      tagSlugs: ['rights-coexistence-equality', 'access-to-university', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Comunicado de repulsa a las agresiones contra las protestas estudiantiles de la Universidad de Sevilla',
          description:
            'Esta actitud por parte de las fuerzas de seguridad del Estado es inadmisible, especialmente considerando que el Equipo de Gobierno no ha establecido pautas de acción seguras para esta situación.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '7/10/2022',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Comunicado de repulsa al acto de violencia machista vivido en el Colegio Mayor Elías Ahúja',
          description:
            'Es fundamental la existencia en las universidades de protocolos y planes de sensibilización, prevención y actuación, especialmente que atiendan, protejan y garanticen la seguridad de las víctimas. La Universidad debe intervenir con contundencia ante estas conductas, retrógradas y misóginas, y no mirar hacia otro lado.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/11/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Manifiesto por la universidad pública',
          description:
            'El estudiantado universitario ha anunciado movilizaciones en distintas ciudades españolas como protesta ante las enmiendas presentadas por Esquerra Republicana, PSOE y Unidas Podemos a la Ley de Convivencia Universitaria y contra las propuestas planteadas en el proyecto Ley Orgánica del Sistema Universitario',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '29/10/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CRUE, CREUP y CEUNE rechazan las enmiendas pactadas por PSOE, Unidas Podemos y ERC al proyecto de Ley de Convivencia Universitaria',
          description:
            'La comunidad universitaria quiere trasladar su malestar a las fuerzas políticas por desoír sus propuestas. Estas enmiendas deben ser modificadas o retiradas para que la Ley se distancie verdaderamente del Régimen Sancionador de 1954 al que está todavía sujeto el Sistema Universitario Español.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '5/09/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Carta abierta sobre la situación del estudiantado afgano',
          description:
            'Trasladamos al Gobierno de España un llamamiento urgente con recomendaciones específicas de actuación para apoyar al personal docente e investigador, estudiantado y agentes de la sociedad civil de Afganistán',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '28/01/2021',
      tagSlugs: ['rights-coexistence-equality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'En defensa de la seguridad de la comunidad universitaria',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades públicas (CREUP) y el Consejo de Estudiantes Universitario del Estado (CEUNE) lanzan un comunicado en respuesta a las declaraciones del 28 de enero de 2021 de la Conferencia de Rectores de Universidades Españolas (CRUE) mostrando su indignación ante estas.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '31/08/2020',
      tagSlugs: ['student-economy', 'university-life-wellbeing', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes universitarios lanzan sus peticiones para el comienzo de curso',
          description:
            'Consideramos que se deben de flexibilizar las metodologías docentes para adaptarlas a las necesidades y situaciones de cada estudiante. Además, es necesario asegurar el acceso a los medios para eliminar las brechas socioeconómicas en la educación superior.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/05/2020',
      tagSlugs: ['student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'Malestar del estudiantado ante las declaraciones realizadas',
          description:
            'Consideramos pertinente recordarle la delicada situación que está atravesando el estudiantado debido a la situación actual. Ni el tono ni el fondo del mensaje fue el apropiado, mostrando a nuestro colectivo como un agente superficial e infravalorando una situación atípica, extraordinaria y perjudicial.',
        },
      ],
    },
    {
      type: 'statement',
      image: '/prensa/imagenes/el-ministro-de-universidades-se-reune-con-los-representantes.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '19/04/2020',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'El ministro de universidades se reúne con los representantes de estudiantes',
          description:
            'El ministro ha puesto en valor en varias ocasiones el papel del estudiantado ante la situación en la que nos encontramos y la necesidad de que las instituciones universitarias nos tengan en cuenta.',
        },
      ],
    },
    {
      type: 'statement',
      image: '/prensa/imagenes/recogida-de-pertenencias-de-estudiantes-2020-04.webp',
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '17/04/2020',
      tagSlugs: ['student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Recogida de pertenencias de estudiantes',
          description:
            'El COVID-19 ha llevado al país a un estado de alerta en el que, afectados, muchos y muchas estudiantes volvieron a sus residencias familiares tras su proclamación. En un inicio, la duración estimada de la situación era de dos semanas, pero esta se ha ido alargando y la mayoría de universidades españolas han optado por finalizar el curso académico de manera no presencial.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '1/04/2020',
      tagSlugs: [
        'internships-employability',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Medidas anunciadas por CRUE en el artículo Las universidades aplazarán materia y reducirán las horas de prácticas este curso',
          description:
            'Este miércoles 1 de abril de 2020 Crue - Conferencia de Rectores de Universidades Españolas - ha expresado en un artículo de El País las líneas de actuación que se están planteando ante la crisis sanitaria que ha afectado al Sistema Universitario Español.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '14/03/2020',
      tagSlugs: ['university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP se suma al movimiento #YoMeQuedoEnCasa',
          description:
            'Las universidades han comenzado a establecer protocolos de actuación ante la suspensión de la presencialidad en la docencia y otras actividades derivadas del desarrollo académico del estudiantado. Para cualquier tipo de duda o cuestión específica debéis poneros en contacto con vuestras universidades.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/03/2020',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los representantes de estudiantes del Estado ponen sobre la mesa reivindicaciones históricas del estudiantado en el pleno del CEUNE tras más de un año sin convocarse',
          description:
            'Tras más de un año sin poder convocarse, desde el 9 de octubre de 2018, el Consejo de Estudiantes Universitario del Estado -CEUNE-, los representantes de estudiantes del Estado hemos podido compartir y debatir medidas con el Ministerio de Universidades para la mejora del Sistema Universitario Español - SUE-.',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '15/10/2019',
      tagSlugs: ['access-to-university', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Carta abierta al Ministerio de Ciencia, Innovación y Universidades',
          description:
            'Los estudiantes reclaman ser escuchados en el grupo de trabajo que estudiará el modelo actual de prueba de acceso a la Universidad.',
          contentHtml:
            '<p>Los estudiantes reclaman ser escuchados en el grupo de trabajo que estudiará el modelo actual de prueba de acceso a la Universidad.</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p><strong>&iquest;Se puede aprobar un modelo de carrera docente sin profesores?</strong></p> <p>Sucede lo mismo con el grupo de trabajo creado para revisar el actual modelo de pruebas de acceso a la Universidad. No contar con la voz del estudiantado supone no contar con el epicentro del sistema educativo.</p> <p>Hace unos d&iacute;as el Gobierno, en concreto el Ministerio de Educaci&oacute;n y Formaci&oacute;n Profesional junto al Ministerio de Ciencia, Innovaci&oacute;n y Universidad, y la Conferencia de Rectores de Universidades Espa&ntilde;olas (CRUE) anunciaron la creaci&oacute;n de forma &ldquo;inminente&rdquo; un grupo de trabajo para revisar el actual modelo de pruebas de acceso a la universidad, antes de las elecciones del 10 de noviembre. El estudiantado ha quedado excluido de dicho grupo de trabajo, es mejor no contar con la voz de aquellas personas que hace pocos a&ntilde;os han pasado por esa situaci&oacute;n y pueden aportar el conocimiento desde la propia experiencia personal y, sobre todo, tras una puesta en com&uacute;n por parte de los representantes de estudiantes de las universidades p&uacute;blicas del Estado. Se aboga por el estudiantado como centro del sistema educativo, sin embargo, se nos excluye de los elementos y decisiones que nos afectan.</p> <p>Por todo ello, solicitamos a ambos Ministerios y a CRUE que procedan a introducir a CREUP y CANAE en dicho grupo de trabajo con el objetivo de contar con la voz de millones de estudiantes que actualmente est&aacute; siendo ignorada. </p> <p><strong>ACTUALIZACI&Oacute;N<br></strong>El d&iacute;a 16/10/2019 a las 14:16 el Ministerio de Ciencia, Innovaci&oacute;n y Universidades ha escrito a la entidad para ofrecerle integrarse en el grupo de trabajo.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '23/09/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title: 'Propuestas de cara a la XIV Legislatura',
          description:
            'Las becas, las prácticas, las tasas y el reglamento disciplinario son los asuntos que más preocupan a los estudiantes y esperan poderlos abordar en la XIV Legislatura.',
          contentHtml:
            '<p>Las becas, las prácticas, las tasas y el reglamento disciplinario son los asuntos que más preocupan a los estudiantes y esperan poderlos abordar en la XIV Legislatura.</p><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Ante la convocatoria de elecciones para la XIV Legislatura, como presidente de la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas &ndash; CREUP le quiero dar traslado de los principales temas que consideramos importantes abordar y solucionar en la pr&oacute;xima legislatura con el fin de que su organizaci&oacute;n los tenga en consideraci&oacute;n a la hora de realizar en programa electoral.<br></p> <p>Quedo a su completa disposici&oacute;n para todo tipo de cuestiones que le puedan surgir y conf&iacute;o en que podamos colaborar en la XIV Legislatura para mejorar el sistema universitario. </p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '7/06/2019',
      tagSlugs: ['access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP no solicita una prueba única, sino una equiparabilidad de contenido y forma de la prueba de acceso a la Universidad',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas, CREUP, nos gustaría realizar una aclaración respecto a lo emitido en el día de ayer en relación a la unificación de criterios en contenido y forma de la prueba de acceso a la Universidad. CREUP no solicita una prueba única en todo el territorio del […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p> Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas, CREUP, nos gustar&iacute;a realizar una aclaraci&oacute;n respecto a lo emitido en el d&iacute;a de ayer en relaci&oacute;n a la unificaci&oacute;n de criterios en contenido y forma de la prueba de acceso a la Universidad.</p> <p>CREUP no solicita una prueba &uacute;nica en todo el territorio del Estado. Con unificaci&oacute;n de criterios de contenido y forma se hace referencia a la equiparabilidad de las pruebas en las distintas Comunidades Aut&oacute;nomas, posiblemente la palabra escogida para comunicarlo no sea la m&aacute;s adecuada y es por ello que procedemos a aclarar este punto.</p> <p>Por lo tanto, solicitamos que las pruebas de acceso sean equiparables en contenidoy forma en todo el territorio del Estado, siendo necesario establecer unos procedimientos que garanticen la coordinaci&oacute;n de las pruebas. Esto debe ser organizado por el Ministerio competente en materia de Educaci&oacute;n, que re&uacute;ne a las Comunidades Aut&oacute;nomas que deben consensuar con la comunidad universitaria unos m&iacute;nimos de contenido, con el fin de homogeneizar la materia sujeta a evaluaci&oacute;n para el acceso universitario, y que todo el estudiantado del territorio estatal tenga las mismas<br>oportunidades formativas y de acceso. </p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '29/04/2019',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Propuesta de creación de una comisión mixta en el congreso sobre la regulación de las prácticas académicas',
          description:
            'A/A. Diputados y Diputadas de la XIII Legislatura Quería empezar felicitándoles por su elección y agradecerles el compromiso que demuestran ofreciéndose al servicio de la ciudadanía para marcar políticas que mejoren el conjunto del Estado. Como presidente de la Coordinadora de Representantes de Estudiantes de Universidades Públicas - CREUP, que es la asociación que aúna […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>A/A. Diputados y Diputadas de la XIII Legislatura</p> <p>Quer&iacute;a empezar felicit&aacute;ndoles por su elecci&oacute;n y agradecerles el compromiso que demuestran ofreci&eacute;ndose al servicio de la ciudadan&iacute;a para marcar pol&iacute;ticas que mejoren el conjunto del Estado.</p> <p>Como presidente de la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas &ndash; CREUP, que es la asociaci&oacute;n que a&uacute;na la mayor representaci&oacute;n del estudiantado universitario de nuestro pa&iacute;s, quer&iacute;a trasladarles la disposici&oacute;n de la organizaci&oacute;n que represento para colaborar con ustedes para definir las pol&iacute;ticas que se requieren en materia de Educaci&oacute;n Superior.</p> <p>En la legislatura anterior se estuvo negociando una propuesta de ley reguladora de las pr&aacute;cticas universitarias que naci&oacute; sin el di&aacute;logo con los colectivos que forman la Universidad. Si bien el grupo parlamentario proponente corrigi&oacute; r&aacute;pidamente y atendi&oacute; a estudiantes y rectores, este no es el &uacute;nico caso de intentar lanzar medidas sin un di&aacute;logo social que es, sin duda alguna, fundamental para elaborar medidas eficaces que resuelvan los problemas de hoy sin causar problemas ma&ntilde;ana.</p> <p>La regulaci&oacute;n de las pr&aacute;cticas causa gran revuelo y m&aacute;s cuando se acompa&ntilde;a de las medidas introducidas en el RDL 28/2018. Con el fin de poder arrojar luz en un &aacute;mbito normativamente complejo y queriendo dar respuesta a las motivaciones pol&iacute;ticas que subyacen les propongo la creaci&oacute;n de una comisi&oacute;n mixta en el Congreso de los Diputados para tratar este tema, en la que deber&aacute;n estar presentes rectores, representados por CRUE, y estudiantes, representados por CREUP.</p> <p>Para cualquier otro asunto quedo a su disposici&oacute;n.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/09/2018',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP lamenta el daño nuevamente causado por los representantes públicos a la imagen del sistema universitario español',
          description:
            'Alcalá de Henares, 11 de septiembre de 2018 Tras las noticias aparecidas desde el día de ayer en las que se cuestionaba la forma en la que la exministra Carmen Montón obtuvo su título de máster y la rueda de prensa ofrecida hoy, desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas, valoramos […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1> <p>Alcal&aacute; de Henares, 11 de septiembre de 2018</p> <p>&nbsp;</p> <p> Tras las noticias aparecidas desde el di&#769;a de ayer en las que se cuestionaba la forma en la que la exministra Carmen Monto&#769;n obtuvo su ti&#769;tulo de ma&#769;ster y la rueda de prensa ofrecida hoy, desde la Coordinadora de Representantes de Estudiantes de Universidades Pu&#769;blicas, valoramos como necesaria la decisio&#769;n adoptada puesto que no se puede consentir que ningu&#769;n representante poli&#769;tico, con independencia de su gestio&#769;n, manche ni siquiera mi&#769;nimamente el prestigio las instituciones.</p> <p> Respecto a las acusaciones de plagio, y au&#769;n a la espera de que se esclarezca la situacio&#769;n, no podemos ma&#769;s que decir que cualquier indicio demostrable de este tipo de actividad debe ser denunciado, y las instituciones al cargo deben realizar todo cuanto este&#769; en su mano para acabar con estas pra&#769;cticas.</p> <p> No obstante, lamentamos profundamente que este nuevo esca&#769;ndalo venga a ensuciar una vez ma&#769;s la imagen de las universidades pu&#769;blicas, especialmente de la Universidad Rey Juan Carlos, y del resto de estudiantes que di&#769;a a di&#769;a se dejan la piel para obtener una titulacio&#769;n universitaria en nuestro pai&#769;s.</p> <p> Desde CREUP queremos transmitir al conjunto de la sociedad nuestra ma&#769;s plena confianza en nuestro sistema universitario, que, si bien puede ser mejorado, goza de los ma&#769;s altos esta&#769;ndares de calidad y de control y que es tenido en alta estima en el plano internacional.</p> <p>&nbsp;</p> <p>&nbsp;</p> <p>Se autoriza a la reproduccio&#769;n total o parcial del presente comunicado sin necesidad de citar la fuente.</p>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '28/06/2018',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title: 'Comunicado CREUP 28J - Orgullo LGTB+',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) manifestamos nuestro apoyo hacia el colectivo LGTB+ y nos sumamos a la lucha por la igualdad, dignidad y reconocimiento de la diversidad afectivo-sexual. Hace casi medio siglo de los disturbios acaecidos en el barrio neoyorquino de Greenwich Village, donde por primera vez la comunidad […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p><strong>Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) manifestamos nuestro apoyo hacia el colectivo LGTB+ y nos sumamos a la lucha por la igualdad, dignidad y reconocimiento de la diversidad afectivo-sexual.</strong></p> <p> Hace casi medio siglo de los disturbios acaecidos en el barrio neoyorquino de Greenwich Village, donde por primera vez la comunidad se alza contra las fuerzas policiales que persegu&iacute;an, con el benepl&aacute;cito del gobierno, a homosexuales y trans. Son los conocidos disturbios de Stonewall del 28 de junio de 1969.</p> <p> Tras d&eacute;cadas de avances significativos tanto en el terreno jur&iacute;dico como social, es innegable que hoy d&iacute;a persiste un sentimiento de animadversi&oacute;n hacia la orientaci&oacute;n sexual e identidad de g&eacute;nero en casi todos los contextos. Curiosamente, esta hostilidad se reproduce entre las generaciones m&aacute;s j&oacute;venes de nuestra sociedad. Este rechazo hacia las personas pertenecientes al colectivo LGTB+ atiende a diferentes excusas: una de ellas es el orden biol&oacute;gico, identificando como perversi&oacute;n, desviaci&oacute;n o patolog&iacute;a cualquier orientaci&oacute;n sexual diferente a la heterosexualidad. Otros argumentos son de &iacute;ndole religiosa, comprendiendo la sexualidad exclusivamente con fines de procreaci&oacute;n.</p> <p> Nuestra cultura, a trav&eacute;s de un pensamiento social hegem&oacute;nico, nos muestra el prototipo &uacute;nico de ser hombre y mujer. Este modelo de comportamiento heterosexual es la pauta que seguir y cualquier desviaci&oacute;n conlleva contravenir la norma y caer en la discriminaci&oacute;n.</p> <p> Desde el contexto universitario, es necesaria la divulgaci&oacute;n de una &eacute;tica c&iacute;vica basada en el respeto de los derechos humanos, reconociendo y garantizando el libre desarrollo de la afectividad y la sexualidad como derecho fundamental. Para que esto sea posible, no solo es esencial desarrollar protocolos de actuaci&oacute;n, sino tambi&eacute;n atender a los siguientes aspectos:<br>&bull; Las universidades deben desarrollar una labor social que permita a todo el estudiantado conocer la realidad del mundo, de forma que se deben desarrollar conferencias, talleres, exposiciones, etc., que traten la realidad LGBT+, as&iacute; como las situaciones de doble discriminaci&oacute;n (lesbianas refugiadas, transexuales gays, etc.).<br>&bull; La Universidad debe ser un espacio seguro para el estudiantado LGBT+. El primer paso es visibilizar el apoyo institucional por parte de la Universidad, de forma que cualquier estudiante conozca los mecanismos y protocolos a seguir ante comportamientos que considere discriminatorios o da&ntilde;inos.<br>&bull; El material docente no deber&aacute; atentar contra la diversidad afectivo-sexual y de g&eacute;nero. Son muchos los apuntes, libros o materiales que niegan la realidad LGBT+ o incluso la censuran.<br>&bull; El profesorado universitario debe recibir formaci&oacute;n en diversidad e igualdad. A&uacute;n existen docentes que emiten en el aula descalificaciones hacia el colectivo LGBT+ con total impunidad, influyendo negativamente en la libertad de expresi&oacute;n la juventud LGBT+ y creando actitudes negativas en el resto del estudiantado.<br>&bull; Las universidades deben garantizar el libre desarrollo de la personalidad de sus estudiantes, de forma que no deben permitir ning&uacute;n comportamiento LGBTIf&oacute;bico por parte del estudiantado o personal del centro.<br>&bull; Creaci&oacute;n de espacios p&uacute;blicos que se adec&uacute;en a las necesidades de la nueva sociedad, evitando la segregaci&oacute;n y abogando por espacios neutros. Un ejemplo de ello son los ba&ntilde;os &laquo;sin g&eacute;nero&raquo;, ba&ntilde;os inclusivos que eliminan la segregaci&oacute;n anteriormente mencionada.</p> <p>Reconocer las diferencias es la &uacute;nica forma de conseguir la igualdad.</p> <p>Se autoriza a publicar lo recogido en este documento sin necesidad de citar la fuente.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '9/06/2018',
      tagSlugs: ['university-life-wellbeing', 'access-to-university', 'international-mobility'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP muestra todo su apoyo al estudiantado que ha realizado la EBAU en Extremadura',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) queremos mostrar todo nuestro apoyo al estudiantado afectado por la situación causada a raíz de la presunta filtración de exámenes de la EBAU ocurrida en la Universidad de Extremadura, así como al Consejo de Estudiantes de dicha universidad en su labor de defender a […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Desde la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) queremos mostrar todo nuestro apoyo al estudiantado afectado por la situaci&oacute;n causada a ra&iacute;z de la presunta filtraci&oacute;n de ex&aacute;menes de la EBAU ocurrida en la Universidad de Extremadura, as&iacute; como al Consejo de Estudiantes de dicha universidad en su labor de defender a las personas afectadas y esclarecer lo sucedido.</p> <p>Nos encontramos ante una situaci&oacute;n totalmente excepcional en la que miles de estudiantes podr&iacute;an pagar las consecuencias de un error del que no son culpables, y ante el cual no se ha establecido un di&aacute;logo formal con sus representantes para buscar soluciones que no afecten negativamente a personas inocentes en un hecho tan trascendental como es su potencial acceso a la Universidad. Desde CREUP queremos resaltar la importancia de tomar al estudiantado como agente activo y centro del modelo educativo, haci&eacute;ndole as&iacute; part&iacute;cipe de las decisiones que le afectan.</p> <p>Por lo descrito anteriormente, reclamamos a las autoridades pertinentes de la Universidad de Extremadura lo siguiente:</p> <ul> <li>Que se esclarezcan y reconozcan, p&uacute;blicamente y ante el estudiantado afectado, los errores cometidos, depurando las responsabilidades pertinentes.</li> <li>Que se abra un espacio de di&aacute;logo con la representaci&oacute;n estudiantil para buscar soluciones de forma coherente y justa.</li> <li>Que se garantice que esta situaci&oacute;n no vuelva a ocurrir, poniendo para ello todos los medios y esfuerzos necesarios, ya sea desde la Junta o la universidad.</li> </ul> <p>&nbsp;</p> <p><em>Madrid, a 9 de junio de 2018.</em></p> <p>&nbsp;</p> <p>Se autoriza a publicar lo recogido en este documento sin necesidad de citar la fuente.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '29/03/2018',
      tagSlugs: ['university-quality', 'international-mobility'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP insta a ANECA a revisar el máster de la URJC',
          description:
            'Desde CREUP seguimos con intriga y preocupación lo ocurrido durante la pasada semana con Cristina Cifuentes en la Universidad Rey Juan Carlos (URJC). Respetando la presunción de inocencia, consideramos que en cualquier caso este uso e imagen que se da de la universidad pública es intolerable y por ello condenamos todo lo ocurrido. La universidad […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Desde CREUP seguimos con intriga y preocupaci&oacute;n lo ocurrido durante la pasada semana con Cristina Cifuentes en la Universidad Rey Juan Carlos (URJC).</p> <p>Respetando la presunci&oacute;n de inocencia, consideramos que en cualquier caso este uso e imagen que se da de la universidad p&uacute;blica es intolerable y por ello condenamos todo lo ocurrido.</p> <p>La universidad p&uacute;blica tiene que ser gu&iacute;a y faro de una sociedad mejor y que se desarrolla en pro de la conciencia cr&iacute;tica y el progreso y desde luego lo ocurrido estos d&iacute;as se aleja mucho de ello.</p> <p>Nos alegramos que desde la CRUE se busquen las medidas necesarias, objetivas y externas a la propia URJC para arrojar un poco de luz a este sin sentido. En cualquier caso no creemos que sea suficiente y por ellos desde CREUP:</p> <p>Instamos a la ANECA a evaluar de nuevo no s&oacute;lo el m&aacute;ster universitario en Derecho P&uacute;blico del Estado Auton&oacute;mico de la URJC sino tambi&eacute;n a los y las profesoras han sido implicados en este caso.</p> <p>No podemos dejar que la universidad est&eacute; al servicio de los intereses particulares de unos cuantos y no sea la instituci&oacute;n p&uacute;blica que merece respeto y distinci&oacute;n.</p> <p>&nbsp;</p> <p>En Madrid, 29 de Marzo de 2018</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '8/03/2018',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title: 'Comunicado sobre el 8m',
          description:
            'CREUP, así como el estudiantado en general, es consciente de la desigualdad que se produce en España en todos los sectores; especialmente laboral, con una preocupante brecha salarial así como con una falta de mujeres elevada en los puestos directivos además del creciente número de agresiones machistas. Por todo esto, consideramos que esta huelga convocada […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>CREUP, as&iacute; como el estudiantado en general, es consciente de la desigualdad que se produce en Espa&ntilde;a en todos los sectores; especialmente laboral, con una preocupante brecha salarial as&iacute; como con una falta de mujeres elevada en los puestos directivos adem&aacute;s del creciente n&uacute;mero de agresiones machistas.</p> <p>Por todo esto, consideramos que esta huelga convocada con motivo del D&iacute;a de la Mujer, est&aacute; m&aacute;s que justificada, y animamos a todos los estudiantes a sumarse, echando de menos las garant&iacute;as necesarias para el transcurso normal de un paro acad&eacute;mico por parte de las Universidades. Especialmente, es en la Universidad donde m&aacute;s motivos para hacer paro existe, debido a las grandes desigualdades que se producen d&iacute;a a d&iacute;a: solo cuatro rectoras ocupan el m&aacute;ximo cargo de gobierno de las universidades, adem&aacute;s de haber una gran brecha dentro de los catedr&aacute;ticos, requisito necesario para llegar a tal puesto: solo un 21 % del grueso de los catedr&aacute;ticos es mujer.&nbsp; Adem&aacute;s, el n&uacute;mero de las editoras en revistas cient&iacute;ficas es m&iacute;nimo, as&iacute; como las mujeres dan menos conferencias y son invitadas a menos seminarios en la Academia.</p> <p>Al mismo tiempo, tambi&eacute;n podemos ver una clara desigualdad en el sector del estudiantado, especialmente en las mujeres dentro de las carreras de Ingenier&iacute;as, a pesar de ser ellas las que mejores notas sacan, y las que m&aacute;s se grad&uacute;an.</p> <p>Todo esto junto a las jerarqu&iacute;as que se forman dentro de la Universidad, y que promueven situaciones de acoso y agresiones dentro de la misma. Por esta raz&oacute;n, una vez m&aacute;s apoyamos y felicitamos a las universidades que hayan aprobado un Protocolo de Acoso, y que est&eacute;n trabajando en proteger a todas las v&iacute;ctimas de estas agresiones, as&iacute; como animamos a aquellas que no lo tienen todav&iacute;a, a establecer en su normativa este tipo de procedimiento.</p> <p>Por estos motivos, exigimos una universidad donde exista una representaci&oacute;n real de las mujeres y apoyamos a todas las que hoy paran, precisamente para llevar nuestra voz a todos lados, y demostrar que si paramos nosotras, se para el mundo.</p> <p>Granada, 8 de marzo de 2018</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '11/02/2018',
      tagSlugs: ['rights-coexistence-equality', 'international-mobility'],
      translations: [
        {
          locale: 'es',
          title:
            'El día de la mujer y la niña en la ciencia nos recuerdan las carencias de la universidad',
          description:
            'Días como el de hoy, 11 de febrero, donde celebramos el día Internacional de la Mujer y la Niña en la Ciencia, visibilizando la labor científica de las mujeres, nos recuerdan las propias carencias en el sector universitario español respecto a este ámbito. Las mujeres son el sector mayoritario en la Universidad, no obstante su […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>D&iacute;as como el de hoy, 11 de febrero, donde celebramos el d&iacute;a Internacional de la Mujer y la Ni&ntilde;a en la Ciencia, visibilizando la labor cient&iacute;fica de las mujeres, nos recuerdan las propias carencias en el sector universitario espa&ntilde;ol respecto a este &aacute;mbito. Las mujeres son el sector mayoritario en la Universidad, no obstante su ausencia es inexplicable en algunas titulaciones, especialmente en las carreras t&eacute;cnicas, como las diversas ingenier&iacute;as.</p> <p>Seg&uacute;n datos del Ministerio de Educaci&oacute;n, 3 de cada 4 personas matriculadas durante el curso 2016/2017 en alguna ingenier&iacute;a es hombre. En total, solo un 25% del estudiantado de estas carreras es mujer, llegando la cifra menos de un 15% en las aspirantes a estudiar ingenier&iacute;as como inform&aacute;tica o el&eacute;ctrica.</p> <p>Estos datos chocan con la realidad y con la participaci&oacute;n universitaria femenina, ellas sacan la mejor nota en Selectividad en 14 de 17 Comunidades Aut&oacute;nomas, adem&aacute;s de componer el grueso de los premios de excelencia de bachillerato.</p> <p>Desde CREUP creemos que esta falta de mujeres en las carreras STEM, se debe mayoritariamente a la desinformaci&oacute;n que se produce de estas profesiones, adem&aacute;s de la falta de programas o motivaci&oacute;n hacia este sector por parte de los centros de secundaria.&nbsp; Es dif&iacute;cil elegir una profesi&oacute;n de la que se conoce bastante poco, o de la que solo nos llegan t&oacute;picos infundados.</p> <p>Es por eso que consideramos fundamental que las carreras t&eacute;cnicas sean promocionadas en todas las etapas de la ense&ntilde;anza obligatoria, tanto por proyectos curriculares como extraescolares.</p> <p>La falta de mujeres en este sector produce una mayor desigualdad entre hombres y mujeres en toda la sociedad, especialmente si tenemos en cuenta que cada vez m&aacute;s los puestos de trabajos est&aacute;n enfocados a este sector. Es en inter&eacute;s de todos que motivemos la entrada de mujeres en estas profesiones.</p> <p>Sevilla, 11 de febrero de 2018</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/01/2018',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Casos como el de Albacete se han convertido en un motivo de inseguridad de los estudiantes',
          description:
            'CREUP, así como el resto de estudiantes del país, fue testigo la semana pasada de lo ocurrido en el Campus de Albacete de la Universidad de Castilla-La Mancha. Esta organización considera inaceptable los sucesos ocurridos y se adhiere al rechazo expresado por la dirección de la universidad y por el consejo de estudiantes de la […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>CREUP, as&iacute; como el resto de estudiantes del pa&iacute;s, fue testigo la semana pasada de lo ocurrido en el Campus de Albacete de la Universidad de Castilla-La Mancha. Esta organizaci&oacute;n considera inaceptable los sucesos ocurridos y se adhiere al rechazo expresado por la direcci&oacute;n de la universidad y por el consejo de estudiantes de la misma.</p> <p>Ante este tipo de sucesos, queremos recordar que los casos de acoso son, desgraciadamente, una realidad que sufren los estudiantes d&iacute;a tras d&iacute;a. Uno de los casos m&aacute;s espeluznantes, se daba hace unos d&iacute;as cuando estudiantes de Albacete hablaban por una red social sobre c&oacute;mo violar a otra estudiante.</p> <p>Es precisamente por este tipo de casos por los cuales los Protocolos de Prevenci&oacute;n y Respuesta ante el acoso cobran m&aacute;s importancia que nunca, as&iacute; como la creaci&oacute;n de espacios seguros de car&aacute;cter psicol&oacute;gico y jur&iacute;dico donde los estudiantes que han sufrido este tipo de experiencias se sientan acogidos.</p> <p>Por lo tanto, animamos a las universidades que no cuenten ya con un protocolo, a regular esta figura dentro de su estructura, y a las que s&iacute; lo hacen, a que sigan revisando su procedimiento y su forma de actuar.</p> <p>Son muchos los estudiantes que han sufrido acoso dentro de las paredes de la universidad: pero pocos lo denuncian, en concreto m&aacute;s de un 91 % no lo hace, seg&uacute;n un estudio elaborado por la Universidad de Barcelona sobre violencia machista en la universidad. Esto se debe mayoritariamente a la lentitud de los procesos y de la burocracia universitaria, adem&aacute;s de un inter&eacute;s por esta en proteger sus instituciones y su reputaci&oacute;n, hecho que est&aacute; cambiando poco a poco con la inclusi&oacute;n y la presencia de protocolos y dem&aacute;s figuras jur&iacute;dicas creadas para ayudar al estudiante.</p> <p>Precisamente para prevenir este tipo de situaciones, una de las claves es sin duda la educaci&oacute;n. La universidad, as&iacute; como el sistema educativo espa&ntilde;ol en su conjunto, deben hacerse cargo de la formaci&oacute;n en igualdad de sus estudiantes.</p> <p>En definitiva, desde CREUP seguimos comprometidos con nuestra lucha contra la violencia de g&eacute;nero, y cualquier tipo de acoso, dentro de la Universidad.</p> <p>Granada, 22 de enero de 2018</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '22/12/2017',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Ministro de educación repite desplante: cita al estudiantado y no se presenta',
          description:
            'Hoy, 22 de diciembre de 2017 en Madrid, se ha celebrado un pleno del Consejo de Estudiantes Universitarios del Estado (CEUNE) a la que ha asistido entre otros la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP). Como pasó en el último pleno del CEUNE, el Ministro de Educación y Presidente de éste órgano, […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Hoy, 22 de diciembre de 2017 en Madrid, se ha celebrado un pleno del Consejo de Estudiantes Universitarios del Estado (CEUNE) a la que ha asistido entre otros la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP).</p> <p>Como pas&oacute; en el &uacute;ltimo pleno del CEUNE, el Ministro de Educaci&oacute;n y Presidente de &eacute;ste &oacute;rgano, no se ha personado. &Iacute;&ntilde;igo M&eacute;ndez de Vigo convoc&oacute; el pleno en esta fecha personalmente, y pese a la fecha tan complicada de convocatoria, los y las representantes de estudiantes de universidades de todo el Estado se han desplazado hasta Madrid.</p> <p>Desde CREUP consideramos una falta de respeto hacia quienes se han acudido a esta convocatoria, que el Ministro no haya asistido sin pretexto alguno.</p> <p>Es intolerable la actitud del Ministro M&eacute;ndez de Vigo que convoque un &oacute;rgano del cual es el presidente y no asista.</p> <p>Desde CREUP no dejaremos de trabajar para mejorar las condiciones de los y las estudiantes y de las universidades p&uacute;blicas.</p> <p>Madrid, 22 de diciembre de 2017</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '23/07/2017',
      tagSlugs: ['scholarships-funding', 'student-economy', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'El RD destinado a garantizar un derecho se ha convertido en motivo de inseguridad para el estudiantado',
          description:
            'CREUP, así como todo el colectivo estudiantil del país, asistía hoy con expectación a la presentación del RD 726/2017 por el que se presentaban las establecen los umbrales de renta y patrimonio familiar y las cuantías de las becas y ayudas al estudio para el curso 2017-2018. Esta organización considera innegociable el derecho a la […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>CREUP, as&iacute; como todo el colectivo estudiantil del pa&iacute;s, asist&iacute;a hoy con expectaci&oacute;n a la presentaci&oacute;n del RD 726/2017 por el que se presentaban las establecen los umbrales de renta y patrimonio familiar y las cuant&iacute;as de las becas y ayudas al estudio para el curso 2017-2018.</p> <p>Esta organizaci&oacute;n considera innegociable el derecho a la educaci&oacute;n, por lo que valora las becas y ayudas al estudio como m&aacute;xima garant&iacute;a del mismo. Por esta raz&oacute;n trabajamos diariamente para hacer de ellas un instrumento m&aacute;s efectivo, flexible y basado en el deber constitucional de garantizar la igualdad en el acceso a la educaci&oacute;n. Nuestro estupor no ha podido ser mayor cuando a pesar de que el gobierno ha nombrado ese deber en la presentaci&oacute;n del texto, ha condenado inmediatamente a todos los estudiantes del pa&iacute;s a la inseguridad y el miedo a trav&eacute;s de la disposici&oacute;n adicional cuarta del RD, donde se expresan los criterios para obtener becas en el primer curso, sin hacer<br>distinci&oacute;n de su naturaleza.</p> <p>Resulta inaudito que sea la sociedad civil quien deba explicarle a un gobierno, con facultad de legislar, que las normas de mismo rango dictadas con posterioridad derogan a aquellas a las que contradicen.</p> <p>Por lo tanto, este RD que ha sido presentado, desde el ministerio, como un avance y apuesta por las becas al estudio es inaceptable para todo estudiante. El motivo es claro, excluyen del acceso a beca de matr&iacute;cula a cualquiera que, cumpliendo requisitos de renta y patrimonio, no haya obtenido al menos un 6,5 de puntuaci&oacute;n en su v&iacute;a de acceso a la Universidad.</p> <p>Desde CREUP instamos al gobierno a modificar el RD 726/2017 por otro donde, al menos, se mantengan los criterios citados al efecto en el RD 1721/2007 si quiere seguir manteniendo que apuesta por que &ldquo;nadie abandone sus estudios postobligatorios por motivos econ&oacute;micos&rdquo;, que quiere &ldquo;asegurar que quienes tienen vocaci&oacute;n y aptitudes puedan desarrollarlas&rdquo; o que quiere &ldquo;avanzar en el esfuerzo, la responsabilidad y la igualdad de oportunidades&rdquo;. Y a&ntilde;adimos, si el gobierno quiere abanderar esos tres principios sobre los que sustentar las becas al estudio, como de hecho hace CREUP, ser&aacute; necesario un RD m&aacute;s ambicioso donde se garantice el acceso a la beca por motivos socioecon&oacute;micos y no se excluya a nadie por motivos de rendimiento.</p> <p>Menorca, 23 de julio de 2017</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '14/07/2017',
      tagSlugs: ['university-life-wellbeing', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Ministro de Educación menosprecia a los estudiantes una vez más',
          description:
            'Hoy, 14 de julio de 2017 en Madrid, se ha celebrado después de casi dos años de inactividad una convocatoria del Consejo de Estudiantes Universitarios del Estado (CEUNE) a la que ha asistido entre otros la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP). Quién no ha asistido a pesar de ser quien tiene […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Hoy, 14 de julio de 2017 en Madrid, se ha celebrado despu&eacute;s de casi dos a&ntilde;os de inactividad una convocatoria del Consejo de Estudiantes Universitarios del Estado (CEUNE) a la que ha asistido entre otros la Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP). Qui&eacute;n no ha asistido a pesar de ser quien tiene<br>potestad para convocar este &oacute;rgano es el Ministro de Educaci&oacute;n, &Iacute;&ntilde;igo M&eacute;ndez de Vigo.</p> <p>Desde CREUP consideramos una falta de respeto a los y las representantes de estudiantes de las diferentes universidades del estado espa&ntilde;ol que se han desplazado a Madrid para esta convocatoria, que el Ministro no haya asistido alegando que no pod&iacute;a faltar al Consejo de Ministros (como cada viernes). En un momento en el que la situaci&oacute;n que vive la comunidad universitaria es catastr&oacute;fica:</p> <ul> <li>La cuant&iacute;a media de la beca por estudiante ha ca&iacute;do un 20% entre</li> <li>los a&ntilde;os 2013 y 2015.Espa&ntilde;a invierte en becas un 0.13% del PIB, menos de la mitad que la inversi&oacute;n media en becas en los pa&iacute;ses de la OCDE.</li> <li>M&aacute;s de 100.000 estudiantes han sido expulsados de la universidad por motivos econ&oacute;micos.</li> </ul> <p>Es inadmisible que se convoque un &oacute;rgano y a sus miembros cuando ni siquiera el Presidente del mismo, M&eacute;ndez de Vigo, asiste. Desde CREUP no vamos a cesar en nuestro intento porque la voz de los y las estudiantes sea escuchada. Iremos siempre de la mano de quien defienda la Universidad P&uacute;blica, no de quien la desmantela.</p> <p>Madrid, 14 de julio de 2017</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '16/06/2017',
      tagSlugs: ['student-economy', 'university-life-wellbeing', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'La comunidad estudiantil celebra avances en la reducción de barreras económicas en la universidad',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) aplaude las noticias que llegan desde distintas comunidades autónomas españolas (Andalucía, La Rioja y Canarias) que suponen un paso más en la reducción de barreras económicas en el acceso y mantenimiento de los Estudiantes a la vida universitaria. Esta organización quiere manifestar su satisfacción ante […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>La Coordinadora de Representantes de Estudiantes de Universidades P&uacute;blicas (CREUP) <strong>aplaude las noticias</strong> que llegan desde distintas comunidades aut&oacute;nomas espa&ntilde;olas (Andaluc&iacute;a, La Rioja y Canarias) <strong>que suponen un paso m&aacute;s en la reducci&oacute;n de barreras econ&oacute;micas</strong> en el acceso y mantenimiento de los Estudiantes a la vida universitaria.</p> <p>Esta organizaci&oacute;n quiere manifestar su satisfacci&oacute;n ante el anuncio del pasado 5 de junio realizado por la Junta de Andaluc&iacute;a de bonificar el 99% del coste de la matr&iacute;cula a los estudiantes (sin beca MECD), en funci&oacute;n de sus resultados acad&eacute;micos. Esta medida, que se calcula con un coste que ronda el 2% del presupuesto total de las universidades andaluzas, puede llegar a beneficiar a 30.000 estudiantes.</p> <p>Andaluc&iacute;a se suma as&iacute; a comunidades aut&oacute;nomas como La Rioja, que propone una homologaci&oacute;n de precios p&uacute;blicos, o Canarias, que hace unos meses anunci&oacute; un descenso de las tasas universitarias de 8% en grados y hasta 15% en m&aacute;steres, en sus deseos y esfuerzos de progresar en la consecuci&oacute;n de un objetivo compartido con CREUP: la<br>eliminaci&oacute;n de barreras econ&oacute;micas en la Universidad P&uacute;blica espa&ntilde;ola, que garantice la igualdad efectiva de todos los estudiantes, independientemente de su nivel socioecon&oacute;mico.</p> <p>CREUP anima en&eacute;rgicamente al resto de comunidades aut&oacute;nomas a escuchar las demandas de los representantes estudiantiles en esta direcci&oacute;n y les invita a seguir el ejemplo de estos gobiernos regionales, mientras seguimos trabajando en la futura, y esperamos, pr&oacute;xima derogaci&oacute;n del RD 14/2012.</p> <p>Menorca, 16 de junio de 2017</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '15/12/2016',
      tagSlugs: ['university-quality', 'international-mobility'],
      translations: [
        {
          locale: 'es',
          title: 'Respecto a los plagios en la Universidad',
          description:
            'A la luz de las noticias publicadas por diversos medios de comunicación en relación a los presuntos plagios académicos del rector de la Universidad Rey Juan Carlos, desde CREUP queremos dejar patente nuestra gran preocupación al respecto. Fomentar el traspaso de conocimientos es imprescindible para que otras personas puedan continuar desarrollando esa labor investigadora, pero […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>A la luz de las noticias publicadas por diversos medios de comunicaci&oacute;n en relaci&oacute;n a los presuntos plagios&nbsp; acad&eacute;micos del rector de la Universidad Rey Juan Carlos, desde CREUP queremos dejar patente nuestra gran preocupaci&oacute;n al respecto.</p> <p>Fomentar el traspaso de conocimientos es imprescindible para que otras personas puedan continuar desarrollando esa labor investigadora, pero siempre reconociendo el trabajo de los antecesores. La investigaci&oacute;n y la producci&oacute;n cient&iacute;fica en cualquiera de sus aspectos es un pilar de gran importancia en nuestra sociedad. Sin este pilar, es imposible construir una sociedad avanzada y desarrollada. Es por ello que pr&aacute;cticas denigrantes para este tipo de actividades, como el plagio, deben ser perseguidas y erradicadas en las instituciones de ense&ntilde;anza.</p> <p>Plagiar supone aprovecharse del trabajo de una persona para un beneficio propio, en lugar de buscar un respeto, reconocimiento y colaboraci&oacute;n mutua. Es intolerable que dentro de la comunidad acad&eacute;mica se haga un uso tan inmoral de la autor&iacute;a intelectual de los trabajos de personas.</p> <p>Este tipo de actuaciones no son da&ntilde;inas &uacute;nicamente para las personas afectadas. Plagiar supone deslegitimar la labor cient&iacute;fica e investigadora de nuestros compa&ntilde;eros y compa&ntilde;eras. Es fundamental que la universidad muestre toda la labor que realiza en beneficio de la sociedad, que los ciudadanos sientan que la inversi&oacute;n que realizan en &eacute;sta es en beneficio de todos. Que las instituciones p&uacute;blicas se vean envueltas en estas pol&eacute;micas supone un ataque a esta labor de concienciaci&oacute;n y acaba siendo un perjuicio para todos. Cualquier indicio demostrable de este tipo de actividad debe ser denunciado, y las instituciones al cargo deben realizar todo cuanto est&eacute; en su mano para acabar con estas pr&aacute;cticas.</p> <p>Los estudiantes mostramos nuestro total apoyo a la labor cient&iacute;fica e investigadora que realizan much&iacute;simos compa&ntilde;eros estudiantes y acad&eacute;micos que debe ser valorada por todos como un beneficio para la sociedad. Que la mala praxis de unos, no empa&ntilde;e el gran trabajo de tantas otras personas que trabajan en pos de sociedad.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '16/11/2016',
      tagSlugs: ['international-mobility'],
      translations: [
        {
          locale: 'es',
          title: 'Manifiesto #17Now',
          description:
            'Hoy, 17 de noviembre de 2016, el mundo celebra el Día Internacional de Estudiante. Desde la Coordinadora de Representantes de Estudiantes de Universidad Públicas (CREUP) no podemos permitir que este día pase sin pena ni gloria en estos tiempos donde tantos universitarios se están viendo obligados a dejar sus estudios por la desmesurada subida de […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Hoy, 17 de noviembre de 2016, el mundo celebra el D&iacute;a Internacional de Estudiante. Desde la Coordinadora de Representantes de Estudiantes de Universidad P&uacute;blicas (CREUP) no podemos permitir que este d&iacute;a pase sin pena ni gloria en estos tiempos donde tantos universitarios se est&aacute;n viendo obligados a dejar sus estudios por la desmesurada subida de precios p&uacute;blicos.</p> <p>Nuestro trabajo como la mayor organizaci&oacute;n estudiantil universitaria de todo el Estado es luchar para que este &ldquo;nuevo&rdquo; Ministerio deje de hacer o&iacute;dos sordos a la clamorosa petici&oacute;n de que la Educaci&oacute;n es la base del futuro de Espa&ntilde;a. Hoy nos presentamos en sus puertas para reivindicar una educaci&oacute;n superior p&uacute;blica, de calidad y accesible para toda esa sociedad que se ha visto obligada a detener sus estudios por culpa de unos precios que hacen de la universidad un privilegio.</p> <p>La entrada en vigor del Real Decreto Ley 14/2012, ha supuesto el mayor ataque a la Universidad P&uacute;blica desde su creaci&oacute;n. No solo se ha traducido en un esfuerzo econ&oacute;mico que las familias de los estudiantes han intentado solventar como han podido, sino que adem&aacute;s ha supuesto una gran p&eacute;rdida en la igualdad de oportunidades en nuestro pa&iacute;s. La Universidad debe ser un motor de transformaci&oacute;n social que permita que miles de estudiantes mejoren sus vidas y puedan ofrecer un servicio &uacute;til a la sociedad. Las pol&iacute;ticas del Gobierno actual en su anterior legislatura, ha supuesto un bloqueo total para la consecuci&oacute;n de este fin.</p> <p>Una situaci&oacute;n que se ha visto agravada por un sistema de becas incapaz de absorber una masa de estudiantes que por el contexto socioecon&oacute;mico actual no puede pagarse los estudios. Un modelo que ha disminuido la cuant&iacute;a de ayuda econ&oacute;mica de tal forma que, en muchos casos, al estudiante no le es suficiente para poder subsistir. Las becas no est&aacute;n cumpliendo su funci&oacute;n, en muchos casos la ayuda llega mal y tarde, obligando al estudiante a buscar otro tipo de financiaci&oacute;n para asumir el coste de sus estudios.</p> <p>Podr&iacute;amos hablar adem&aacute;s de que el 3+2 se hizo sin ning&uacute;n tipo de consenso con la Comunidad Universitaria, que supondr&aacute; un encarecimiento a&uacute;n mayor de la Universidad o de que la LOMCE ha supuesto una incertidumbre inaceptable para el acceso a la Universidad de los futuros estudiantes.</p> <p>Pero, aunque no hay que olvidar el pasado, queremos hablar del futuro. Los estudiantes universitarios queremos un Pacto con la Comunidad Educativa donde se hable de la Universidad que necesitamos, donde se hable de una Universidad con la financiaci&oacute;n suficiente como para ofrecer calidad e igualdad, libre de tasas para los estudiantes en primera matr&iacute;cula.</p> <p>Necesitamos una Universidad centrada en el estudiante, donde podamos aprender, debatir y formarnos, no solo como futuros profesionales, sino tambi&eacute;n como personas. Una Universidad que acoja a los investigadores que se est&aacute;n marchando de Espa&ntilde;a en busca de un trabajo. Una Universidad P&uacute;blica, justa y social que permita que la sociedad sea un lugar mejor para todos.</p> <p>Desde CREUP, entendemos que ha llegado el momento de que desde el Ministerio se comience un di&aacute;logo real y cree una mesa de negociaci&oacute;n con todos los sectores implicados, a fin de buscar el entendimiento y conseguir alcanzar un pacto educativo que brinde a la sociedad la Universidad que necesita. Los estudiantes estamos dispuestos a sentarnos a colaborar por lograr ese pacto, es nuestra responsabilidad apostar por el futuro de la educaci&oacute;n.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '13/11/2016',
      tagSlugs: ['rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title: 'Denuncia de los abusos en la Universidad de Sevilla',
          description:
            'Las recientes noticias sobre la sentencia condenatoria del catedrático y antiguo decano de la Facultad de Ciencias de la Educación de la Universidad de Sevilla, el Sr. Romero Granados, son una demostración más de que, en el terreno de la igualdad, sigue siendo necesario luchar cada día para solucionar situaciones denigrantes como la acaecida en […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>Las recientes noticias sobre la sentencia condenatoria del catedr&aacute;tico y antiguo decano de la Facultad de Ciencias de la Educaci&oacute;n de la Universidad de Sevilla, el Sr. Romero Granados, son una demostraci&oacute;n m&aacute;s de que, en el terreno de la igualdad, sigue siendo necesario luchar cada d&iacute;a para solucionar situaciones denigrantes como la acaecida en<br>la Universidad de Sevilla.</p> <p>El catedr&aacute;tico ha sido condenado a casi siete a&ntilde;os de c&aacute;rcel por tres delitos continuados de abuso sexual, diez a&ntilde;os despu&eacute;s del comienzo de los abusos. Las v&iacute;ctimas sufr&iacute;an acoso de diferentes formas mientras que &eacute;ste les obligaba supuestamente a mantener silencio a trav&eacute;s de amenazas y chantajes. Durante este tiempo, el Sr. Romero ha seguido impartiendo clases mientras que las v&iacute;ctimas se han visto forzadas a abandonar su puesto de trabajo, algo totalmente intolerable y que no podemos permitir.</p> <p>El uso de la coacci&oacute;n y la amenaza por parte de miembros del cuerpo docente de cualquier universidad &uacute;nicamente replica los comportamientos que no se han podido eliminar de la sociedad en su conjunto. Desde CREUP repudiamos todas las actuaciones de esta &iacute;ndole, pues entendemos que la universidad deber&iacute;a ser el instrumento que promoviera el progreso y el desarrollo de la sociedad, por lo que estos actos no tienen cabida en nuestra instituci&oacute;n. Adem&aacute;s, resulta particularmente hiriente que, seg&uacute;n la informaci&oacute;n publicada en diferentes medios, el acosador fuese respaldado por otros compa&ntilde;eros del Departamento, en lugar de apoyar a las v&iacute;ctimas. Hay que recordar que, si no eres parte de la soluci&oacute;n, te conviertes en parte del problema.</p> <p>La discriminaci&oacute;n y el acoso, ya sea laboral, sexual o de cualquier otro tipo, se nutre de un entorno que permite por inacci&oacute;n u omisi&oacute;n denigrar y maltratar, algo que no tiene cabida alguna en los tiempos actuales. Desgraciadamente, no se trata de un caso aislado, y lo que es peor, no se denuncian estas actuaciones denigrantes. Por esta raz&oacute;n, consideramos que se necesita urgentemente el desarrollo de planes de igualdad, donde toda la comunidad universitaria se sienta respaldada, con una aplicaci&oacute;n y revisi&oacute;n adecuada de los mismos. Unos planes de igualdad que no sean meramente decorativos, que recojan sanciones acordes a la gravedad de tales actos, incluida la expulsi&oacute;n de quien realice los abusos. No se pueden volver a repetir situaciones como la vivida en la Universidad de Sevilla.</p> <p>Tanto desde CREUP, como a trav&eacute;s de las Delegaciones y de los Consejos de Estudiantes que forman parte de la misma, promovemos y trabajamos por la igualdad entre las personas, independientemente de su sexo, origen, creencia y condici&oacute;n sexual, dentro y fuera de la Comunidad Universitaria. Dada la gravedad del asunto, realizamos un llamamiento a todas las universidades, y a trav&eacute;s de ellas a la sociedad, para que traten estos temas con la importancia que merecen. Si queremos que la sociedad progrese no podemos consentir que situaciones como las ocurridas en Sevilla se repitan.</p> </body></html>',
        },
      ],
    },
    {
      type: 'statement',
      image: null,
      hasPdf: true,
      externalUrl: null,
      mediaOutletId: null,
      publishedAt: '6/07/2016',
      tagSlugs: ['scholarships-funding', 'student-economy', 'international-mobility'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes celebran la unificación del programa Erasmus, pero lo consideran insuficiente',
          description:
            'La Coordinadora de Representantes de Universidades Públicas (CREUP) celebra la retirada del programa «Erasmus.es» para transferir su presupuesto a un único programa de becas de movilidad europea y con ello eliminar el requisito del nivel B2 en idiomas para obtener una ayuda extraordinaria, y el aumento del período de financiación de 5 meses a 7. […]',
          contentHtml:
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"> <html><body data-rsssl=1><p>La Coordinadora de Representantes de Universidades P&uacute;blicas (CREUP) celebra la retirada del programa &laquo;Erasmus.es&raquo; para transferir su presupuesto a un &uacute;nico programa de becas de movilidad europea y con ello eliminar el requisito del nivel B2 en idiomas para obtener una ayuda extraordinaria, y el aumento del per&iacute;odo de financiaci&oacute;n de 5 meses a 7.</p> <p>&laquo;Nos alegramos que el ministerio haga caso a las peticiones que llevamos a&ntilde;os reclamando. El programa Erasmus.es era un programa elitista, que castigaba a aquellos estudiantes que por sus circunstancias socioecon&oacute;micas no han podido formarse en un nivel superior en un idioma&rdquo;, afirma Gorka Mart&iacute;n, Presidente de CREUP.</p> <p>Sin embargo, la medida no se considera suficiente, ya que Espa&ntilde;a sigue siendo uno de los pa&iacute;ses con la menor cuant&iacute;a de beca de los pa&iacute;ses participantes en el Programa. La actual situaci&oacute;n excluye de manera inmediata a los estudiantes con menores recursos econ&oacute;micos contribuyendo a la elitizaci&oacute;n y exclusividad de estos programas. Es por ello que la financiaci&oacute;n en los programas de movilidad por parte del Estado debe incrementarse, para conseguir la financiaci&oacute;n de la estancia completa del estudiante tanto en los programas de duraci&oacute;n corta como larga.</p> <p>&ldquo;La financiaci&oacute;n sigue siendo una de las principales barreras a la movilidad, y por consiguiente a la internacionalizaci&oacute;n de la Educaci&oacute;n Superior. Procurar la financiaci&oacute;n a estos estudiantes va en beneficio de la sociedad, convirti&eacute;ndola en una sociedad multicultural, m&aacute;s competitiva e internacionalizada&rdquo;, dice Mart&iacute;n.</p> <p>M&aacute;s informaci&oacute;n en el Posicionamiento de CREUP en Internacionalizaci&oacute;n y Movilidad [enlace: <a href="/prensa/documentos/los-estudiantes-celebran-la-unificacion-del-programa-erasmus.pdf">Internacionalizaci&oacute;n</a>].</p> </body></html>',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldebate.com/educacion/20260303/universitarios-rechazan-tajantemente-estatuto-becario-yolanda-diaz-ignorado-afectados_391754.html',
      mediaOutletId: mediaOutlets['el-debate'],
      publishedAt: '4/03/2026',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios rechazan «tajantemente» el Estatuto del Becario de Yolanda Díaz: «Ha ignorado a los afectados»',
          description:
            'CREUP ha criticado en este tiempo que el texto «se ha elaborado sin contar con la participación real de la comunidad educativa»',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-rechazan-tajantemente-estatuto-becario-yolanda-diaz-ignorado-actores-afectados-20260303182233.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '4/03/2026',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios rechazan «tajantemente» el Estatuto del Becario de Yolanda Díaz: «Ha ignorado a los actores afectados»',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) ha rechazado «tajantemente» el proyecto de ley del Estatuto de las personas en formación práctica no laboral que se remite al Congreso de los Diputados.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/andalucia/noticia-estudiantes-vaticinan-ley-universitaria-andalucia-afectara-presente-futuro-piden-modificarla-20260211121343.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '11/02/2026',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes vaticinan que la Ley Universitaria Para Andalucía afectará a su «presente y futuro» y piden «modificarla»',
          description:
            'La Coordinadora de Representantes de Estudiantes de las Universidades Públicas (Creup), en línea con lo manifestado por la Asociación de Universidades Públicas de Andalucía (AUPA), ha pedido a la Junta de Andalucía que «rectifique el rumbo, abra un proceso real de diálogo y modifique» la Ley Universitaria Para Andalucía (LUPA) ya que ésta «afecta directamente al presente y futuro del estudiantado universitario».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/economia/2025-11-03/los-rectores-ven-riesgo-para-las-practicas-formativas-si-las-empresas-no-se-implican-en-el-estatuto-del-becario.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '3/11/2025',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los rectores ven «riesgo» para las prácticas formativas si las empresas no se implican en el estatuto del becario',
          description:
            'La Conferencia de Rectores valora positivamente la compensación de gastos de los estudiantes, pero reclama «corresponsabilidad» a las instituciones públicas y privadas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.larazon.es/sociedad/estudiantes-limite-exigen-plan-urgente-subida-alquiler-falta-residencias-publicas_2025090868be9b82eba4e96e2ec6423f.html',
      mediaOutletId: mediaOutlets['la-razon'],
      publishedAt: '9/09/2025',
      tagSlugs: ['student-economy', 'university-life-wellbeing', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes, al límite: exigen un «plan urgente» ante la subida del alquiler y la falta de residencias públicas',
          description:
            'La CREUP denuncia que esta situación obliga a muchos estudiantes a renunciar a sus primeras opciones universitarias',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/comunitat-valenciana/estudiantes-universitarios-denuncian-amenaza-formacion-medica-presencia-alumnos-privada-hospitales-publicos_1_12436467.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '8/07/2025',
      tagSlugs: ['university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios denuncian la «amenaza» de la formación médica con la presencia de alumnos de la privada en hospitales públicos',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) y el Consejo Estatal de Estudiantes de Medicina (CEEM) denuncian una «situación crítica» que «pone en riesgo» el futuro de la educación médica pública en la Comunitat Valenciana.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20250512/10674600/estudiantes-universidades-publicas-ven-gran-avance-reforma-gobierno-agenciaslv20250512.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '13/05/2025',
      tagSlugs: ['university-quality', 'university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes de las universidades públicas ven un «gran avance» la reforma del Gobierno',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) ha mostrado su apoyo al proyecto del Gobierno que reformará la normativa para la creación y reconocimiento de universidades y que busca frenar la aparición de centros privados que no cumplen con la calidad suficiente.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-destacan-rol-fundamental-prevencion-visibilizacion-violencia-machista-20241125105612.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '26/11/2024',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios destacan su «rol fundamental» en la prevención y visibilización de la violencia machista',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) considera que el estudiantado «tiene un rol fundamental en la prevención y visibilización de la violencia machista».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/sociedad/20241125/10137197/creup-revindica-universidad-sea-espacio-seguro-agenciaslv20241125.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '26/11/2024',
      tagSlugs: ['rights-coexistence-equality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP reivindica que la universidad sea espacio seguro',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (Creup) revindicó este lunes el reto de erradicar la violencia machista y que la universidad sea un espacio seguro.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://valenciaplaza.com/valenciaplaza/universitarios-critican-que-para-algunos-centros-la-prioridad-sea-retomar-las-clases-cuanto-antes',
      mediaOutletId: mediaOutlets['valencia-plaza'],
      publishedAt: '31/10/2024',
      tagSlugs: ['university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios critican que para algunos centros la prioridad sea «retomar las clases cuanto antes»',
          description:
            'CREUP remarca que «los estudiantes están más preocupados por recuperar sus hogares y familiares que por ir a clase».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-avisan-no-pueden-seguir-clases-dana-quieren-retomar-clases-cuanto-antes-20241031104238.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '31/10/2024',
      tagSlugs: ['university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios avisan de que no pueden seguir las clases ante la DANA: «Quieren retomar clases cuanto antes»',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) ha lamentado las consecuencias producidas por el temporal que asola esta semana al país y ha pedido a las universidades que «no jueguen con la vida de las personas».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/sociedad/20241031/10066980/creup-afea-universidades-valencianas-urgencia-retomar-clases-dana-agenciaslv20241031.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '31/10/2024',
      tagSlugs: ['university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP afea a las universidades valencianas la urgencia por retomar las clases tras la DANA',
          description:
            'La DANA ha dejado terribles imágenes en los últimos días, hay desaparecidos, fallecimientos y las personas se encuentran incomunicadas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldebate.com/educacion/20241003/estudiantes-universitarios-piden-participar-redaccion-estatuto-becario_232826.html',
      mediaOutletId: mediaOutlets['el-debate'],
      publishedAt: '4/10/2024',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes universitarios piden participar en la redacción del Estatuto del Becario',
          description:
            'Desde CREUP indican que «las prácticas no son iguales en las administraciones públicas que las que se realizan en una empresa».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2024-09-21/descartar-una-carrera-o-pasar-cuatro-horas-diarias-en-el-bus-el-alojamiento-nos-quita-muchas-oportunidades-a-los-universitarios.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '21/09/2024',
      tagSlugs: ['student-economy', 'university-life-wellbeing', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title: 'Descartar una carrera o pasar cuatro horas diarias en el bus',
          description:
            'En muchos campus públicos de ciudades con alquileres prohibitivos, los inscritos se desplazan cada día desde muy lejos o pierden solicitudes de alumnos de otras partes de España.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-rechazan-ebau-comun-pp-avisan-puede-generar-agravio-comparativo-ccaa-20240705103443.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '5/07/2024',
      tagSlugs: ['access-to-university', 'university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios rechazan la EBAU común del PP y avisan de que puede generar un «agravio comparativo» entre CCAA',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) han rechazado el modelo de Evaluación del Bachillerato para el Acceso a la Universidad (EBAU) común firmado por las comunidades autónomas del Partido Popular.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.moncloa.com/2024/07/04/creup-fundacion-once-inclusion-2703183/',
      mediaOutletId: mediaOutlets['moncloa-com'],
      publishedAt: '4/07/2024',
      tagSlugs: [
        'rights-coexistence-equality',
        'access-to-university',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP y Fundación ONCE firman acuerdo para fomentar la inclusión de estudiantes con discapacidad en los campus',
          description:
            'La Fundación ONCE y la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) han firmado un convenio de colaboración con el objetivo de impulsar iniciativas que faciliten el acceso y la participación de este colectivo en la vida universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.rtve.es/noticias/20240528/acampadas-universitarios-continuan-reconocimiento-palestina-no-suficiente/16123711.shtml',
      mediaOutletId: mediaOutlets['rtve'],
      publishedAt: '28/05/2024',
      tagSlugs: [
        'rights-coexistence-equality',
        'student-representation',
        'international-mobility',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Las acampadas de los universitarios continúan al considerar que el reconocimiento de Palestina «no es suficiente»',
          description:
            'Varias universidades han decidido «cortar lazos» con Israel gracias a las demandas estudiantiles. La organización estudiantil CREUP destaca las «incongruencias» en el discurso de las universidades israelíes.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-universidades-publicas-instan-ministerio-poner-fin-cualquier-tipo-colaboracion-israel-20240510115931.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '10/05/2024',
      tagSlugs: [
        'rights-coexistence-equality',
        'student-representation',
        'international-mobility',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes de universidades públicas instan al Ministerio a «poner fin a cualquier tipo de colaboración con Israel»',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) insta a la ministra de Ciencia, Innovación y Universidades, Diana Morant, «a tomar acciones por la mejora de la situación de los estudiantes universitarios palestinos y a poner fin a cualquier tipo de colaboración con Israel, en particular en el Sistema Universitario Español».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/castilla-y-leon/noticia-estudiantes-universidades-publicas-analizan-salamanca-proceso-implantacion-losu-20240301155100.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '5/03/2024',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes de universidades públicas analizan en Salamanca el proceso de implantación de la LOSU',
          description:
            'Estudiantes de universidades públicas y representantes de las instituciones académicas han analizado en Salamanca temas de actualidad en el ámbito académico como el proceso de implantación de la Ley Orgánica del Sistema Universitario (LOSU), las propuestas para las pruebas de acceso a la universidad o el sistema de becas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://salamancartvaldia.es/noticia/2024-02-23-v-congreso-creup-crue-y-xiii-341309',
      mediaOutletId: mediaOutlets['salamanca-rtv-al-dia'],
      publishedAt: '5/03/2024',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Rectores, vicerrectores y representantes de estudiantes universitarios se dan cita en Salamanca',
          description:
            'En el encuentro se buscará abordar los temas de interés que afectan directamente a los estudiantes como parte crucial de la comunidad universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.tribunasalamanca.com/noticias/360290/la-usal-acoge-el-encuentro-entre-la-coordinadora-de-representantes-de-estudiantes-y-la-conferencia-de-rectores',
      mediaOutletId: mediaOutlets['tribuna-salamanca'],
      publishedAt: '5/03/2024',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'La USAL acoge el encuentro entre la Coordinadora de Representantes de Estudiantes y la Conferencia de Rectores',
          description:
            'Ricardo Rivero ha inaugurado este foro, que reúne a estudiantes y rectores de toda España.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2024-02-14/al-estatuto-del-estudiante-universitario-no-le-han-sentado-bien-los-anos.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '14/02/2024',
      tagSlugs: [
        'rights-coexistence-equality',
        'student-representation',
        'university-policy',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Al Estatuto del Estudiante Universitario no le han sentado bien los años',
          description:
            'Tenemos una nueva Ley Orgánica del Sistema Universitario (2023) y una nueva Ley de Convivencia Universitaria (2022), pero no tenemos una nueva «carta magna» para el estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://cadenaser.com/nacional/2024/02/05/las-universidades-privadas-a-punto-de-superar-a-las-publicas-en-25-anos-se-han-creado-27-campus-privados-y-ninguno-publico-cadena-ser/',
      mediaOutletId: mediaOutlets['cadena-ser'],
      publishedAt: '5/02/2024',
      tagSlugs: ['university-policy', 'university-quality', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'Las universidades privadas, a punto de superar a las públicas: en 25 años se han creado 27 campus privados y ninguno público',
          description:
            'En los últimos 25 años se han creado en España 27 universidades privadas y ninguna pública, una tendencia que refleja el cambio en el mapa universitario y preocupa a distintos actores del sistema educativo.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.espaciosdeeducacionsuperior.es/11/01/2024/entrevista-con-la-presidenta-de-la-creup-maria-navarro/',
      mediaOutletId: mediaOutlets['espacios-de-educacion-superior'],
      publishedAt: '11/01/2024',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La LOSU se aprobó sin tener en cuenta las necesidades y consideraciones actuales del estudiantado',
          description:
            'Los programas académicos no contemplan una conciliación real ni entre la vida académica y laboral ni entre la académica y la personal. Desde la CREUP presentamos, a través de nuestro borrador del nuevo Estatuto del Estudiante Universitario, medidas encaminadas a facilitar una vida académica que no suponga tener que renunciar a todo lo demás.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.espaciosdeeducacionsuperior.es/09/01/2024/por-un-estatuto-del-estudiante-universitario-adecuado-a-la-realidad-actual/',
      mediaOutletId: mediaOutlets['espacios-de-educacion-superior'],
      publishedAt: '9/01/2024',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Por un Estatuto del Estudiante Universitario adecuado a la realidad actual',
          description:
            'Desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) realizamos un Informe Ejecutivo para la elaboración de un nuevo Estatuto del Estudiante Universitario que se aprobó por unanimidad en la 72ª Asamblea General Ordinaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-universitarios-exigen-renovar-estatuto-estudiante-incluir-nuevos-derechos-13-anos-aprobacion-20231230122153.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '30/12/2023',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios exigen renovar el Estatuto del Estudiante e incluir nuevos derechos tras 13 años desde su aprobación',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) exige que se renueve el Estatuto del Estudiante Universitario ya que, tras 13 años desde su aprobación, «ha quedado totalmente desactualizado, especialmente después de la entrada en vigor de la LOSU».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/puede-que-el-dinero-no-de-la-felicidad-pero-es-lo-que-la-educacion-universitaria-necesita/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '18/12/2023',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'university-quality',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Puede que el dinero no dé la felicidad, pero es lo que la educación universitaria necesita',
          description:
            'La financiación de las universidades públicas sigue estando muy por debajo de lo deseado para avanzar hacia una educación superior de calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-piden-morant-nueva-responsable-universidades-mas-compromiso-dialogo-pasada-legislatura-20231123124739.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '23/11/2023',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden a Morant, nueva responsable de Universidades, «más compromiso y diálogo» que en la pasada legislatura',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) espera que «no se vuelvan a repetir los mismos errores» de la pasada legislatura y que se apueste por el diálogo y la negociación, también con el estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/sociedad/20231116/9382844/estudiantes-universitarios-denuncian-situacion-insostenible-solicitantes-mas-desfavorecidos-becas-gobierno-agenciaslv20231116.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '16/11/2023',
      tagSlugs: ['scholarships-funding', 'student-economy', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios denuncian la situación «insostenible» de los solicitantes más desfavorecidos de las becas del Gobierno',
          description:
            'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) denunció la situación «insostenible» que viven los estudiantes más desfavorecidos, solicitantes de becas del Ministerio de Educación y Formación Profesional, y el aumento de penalizaciones e intereses económicos que se aplican por el reintegro de las mismas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.unizar.es/noticias/zaragoza-acoge-la-european-student-convention-un-encuentro-de-universitarios-de-mas-de-27',
      mediaOutletId: mediaOutlets['universidad-de-zaragoza'],
      publishedAt: '15/09/2023',
      tagSlugs: ['international-mobility', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'España acogerá en Zaragoza la 46ª edición de la European Student Convention',
          description:
            'La CREUP celebrará este mes en la capital aragonesa un evento que congregará a los universitarios de más de 27 países que forman parte de la European Students’ Union, el principal órgano de representación estudiantil a nivel europeo.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/sociedad/20230909/9216253/estudiantes-creup-condenan-mensajes-machistas-chat-novatadas.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '9/09/2023',
      tagSlugs: ['rights-coexistence-equality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes de CREUP condenan los mensajes machistas en un chat de novatadas',
          description:
            'Los estudiantes universitarios agrupados en la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) rechazaron los mensajes «intolerables» de un grupo de WhatsApp de Magisterio de la Universidad de La Rioja.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elplural.com/politica/precariedad-joven-los-becarios-trabajamos-como-persona-mas_306415102',
      mediaOutletId: mediaOutlets['el-plural'],
      publishedAt: '19/02/2023',
      tagSlugs: ['internships-employability', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title: 'La precariedad es joven: «Los becarios trabajamos como una persona más»',
          description:
            'La ministra de Trabajo, Yolanda Díaz, avanzó «buenas noticias» sobre el Estatuto del Becario en un contexto marcado por las quejas del estudiantado por la precariedad de las prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.rtve.es/noticias/20230218/discriminacion-alquiler-viviendas-espana/2424447.shtml',
      mediaOutletId: mediaOutlets['rtve'],
      publishedAt: '18/02/2023',
      tagSlugs: ['student-economy', 'university-life-wellbeing', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Discriminación por racismo, homofobia o edadismo: el reto de alquilar una vivienda digna',
          description:
            'Grupos vulnerables como las madres solteras y las minorías étnicas denuncian dificultades a la hora de conseguir un hogar, en un contexto en el que jóvenes y mayores también sufren discriminación por edad al alquilar.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/creup-alerta-de-la-bajada-continua-de-las-matriculas-universitarias/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '17/02/2023',
      tagSlugs: ['university-policy', 'access-to-university', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP alerta de la bajada continua de las matrículas universitarias',
          description:
            '«Bajan las matrículas universitarias y los problemas continúan», señalan desde la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP).',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.servimedia.es/noticias/universitarios-denuncian-estatuto-becario-es-fraude/3567448',
      mediaOutletId: mediaOutlets['servimedia'],
      publishedAt: '16/02/2023',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Los universitarios denuncian que el Estatuto del Becario «es un fraude»',
          description:
            'CREUP denuncia que el Estatuto del Becario no ha contado con los colectivos estudiantiles y reclama una propuesta que combata las prácticas fraudulentas y garantice una formación de calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-s/mostrar/490607/universitarios-denuncian-estatuto-becario-fraude',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '16/02/2023',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Los universitarios denuncian que el Estatuto del Becario «es un fraude»',
          description:
            'CREUP sostiene que el Estatuto del Becario ha defraudado las expectativas del estudiantado y reclama que la reforma ponga en el centro a quienes realizan prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.rtve.es/play/audios/las-tardes-de-rne/primera-hora-15-02-2023/6811674/',
      mediaOutletId: mediaOutlets['rtve'],
      publishedAt: '15/02/2023',
      tagSlugs: ['student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'Las tardes de RNE: primera hora - 15/02/23',
          description:
            'Programa de Las tardes de RNE emitido el 15 de febrero de 2023, con repaso de actualidad y secciones de análisis y divulgación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20230214/8756958/rectores-catalanes-quieren-equiparen-precio-todos-grados.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '14/02/2023',
      tagSlugs: ['student-economy', 'access-to-university', 'scholarships-funding'],
      translations: [
        {
          locale: 'es',
          title:
            'Los rectores catalanes quieren que pague igual un estudiante de ingeniería que uno de historia',
          description:
            'La ACUP defiende eliminar barreras en el acceso a los grados y apoya un precio único en las matrículas universitarias, independientemente de la especialidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.cope.es/actualidad/sociedad/noticias/los-universitarios-denuncian-castigo-economico-por-suspender-20230214_2550806',
      mediaOutletId: mediaOutlets['cope'],
      publishedAt: '14/02/2023',
      tagSlugs: ['student-economy', 'scholarships-funding', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title: 'Los universitarios denuncian el «castigo económico» por suspender',
          description:
            'CREUP denuncia el incremento de costes por segundas y sucesivas matrículas y advierte de que estas penalizaciones pueden expulsar de la universidad a estudiantes sin recursos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-alumnos-universidades-publicas-critican-politica-precios-matricula-desequilibrados-costes-elevados-20230214111949.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '14/02/2023',
      tagSlugs: [
        'student-economy',
        'scholarships-funding',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Alumnos de universidades públicas critican la «política de precios de matrícula desequilibrados» con costes «elevados»',
          description:
            'CREUP critica que los precios públicos de matrícula sigan siendo elevados y desiguales entre territorios, lo que mantiene barreras económicas de acceso a la universidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-ep/mostrar/20230214111949/alumnos-universidades-publicas-critican-politica-precios-matricula-desequilibrados-costes-elevados',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '14/02/2023',
      tagSlugs: [
        'student-economy',
        'scholarships-funding',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Alumnos de universidades públicas critican la «política de precios de matrícula desequilibrados» con costes «elevados»',
          description:
            'CREUP denuncia que el coste de las matrículas universitarias continúa siendo un obstáculo para el estudiantado y que persisten diferencias relevantes entre comunidades autónomas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.rtve.es/play/videos/telediario/15-horas-02-01-23/6768203/',
      mediaOutletId: mediaOutlets['rtve'],
      publishedAt: '10/01/2023',
      tagSlugs: ['internships-employability'],
      translations: [
        {
          locale: 'es',
          title: 'Estatuto del Estudiante en Prácticas – Telediario – 15 horas – 02/01/23',
          description:
            'Edición del Telediario de las 15 horas del 2 de enero de 2023, espacio informativo nacional e internacional de RTVE.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/exigen-cambios-urgentes-en-la-ley-organica-del-sistema-universitario-losu/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '13/12/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Exigen «cambios urgentes» en la Ley Orgánica del Sistema Universitario (LOSU)',
          description:
            'CREUP denuncia que la LOSU ignora los problemas del estudiantado y reclama más participación en los órganos de gobierno y mejoras en la calidad de las titulaciones.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://exitoeducativo.net/los-universitarios-se-sienten-los-grandes-perjudicados-en-la-losu/',
      mediaOutletId: mediaOutlets['exito-educativo'],
      publishedAt: '13/12/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'Los universitarios se sienten los «grandes perjudicados» en la LOSU',
          description:
            'CREUP advierte de que la LOSU no responde a las necesidades del estudiantado y reclama cambios antes de la votación de las enmiendas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://revistanuve.com/creup-cambios-urgentes-en-la-ley-organica-del-sistema-universitario/',
      mediaOutletId: mediaOutlets['revista-nuve'],
      publishedAt: '11/12/2022',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'university-quality',
        'access-to-university',
      ],
      translations: [
        {
          locale: 'es',
          title: 'CREUP reclama cambios urgentes en la Ley Orgánica del Sistema Universitario',
          description:
            'CREUP reclama a los grupos parlamentarios que afronten la realidad del estudiantado y hagan de la universidad un espacio más accesible, democrático y centrado en la calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20221210/8639794/creup-exige-cambios-urgentes-ley-organica-sistema-universitario.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '10/12/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP exige cambios urgentes en la Ley Orgánica del Sistema Universitario',
          description:
            'CREUP denuncia que la nueva Ley Orgánica del Sistema Universitario ignora los problemas del estudiantado y no responde a sus necesidades durante la tramitación parlamentaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-s/mostrar/482055/creup-exige-cambios-urgentes-ley-organica-sistema-universitario',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '10/12/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP exige cambios urgentes en la Ley Orgánica del Sistema Universitario',
          description:
            'CREUP pide introducir cambios sustanciales en la LOSU antes de la votación de enmiendas para evitar que el estudiantado vuelva a ser el gran perjudicado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.servimedia.es/noticias/creup-exige-cambios-urgentes-ley-organica-sistema-universitario/3510663',
      mediaOutletId: mediaOutlets['servimedia'],
      publishedAt: '10/12/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP exige cambios urgentes en la Ley Orgánica del Sistema Universitario',
          description:
            'CREUP denuncia que la LOSU no responde a las necesidades del estudiantado y reclama más participación en el gobierno universitario y mejora de las titulaciones.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-universitarios-exigen-mas-participacion-estudiantil-organos-gobierno-universidades-publicas-20221209194425.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '9/12/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios exigen más participación estudiantil en los órganos de gobierno de las universidades públicas',
          description:
            'CREUP demanda un aumento de la participación estudiantil en los órganos de gobierno universitarios y denuncia que la LOSU ignora los problemas del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://valenciaplaza.com/universitarios-piden-participacion-organos-gobierno-universidades-publicas',
      mediaOutletId: mediaOutlets['valencia-plaza'],
      publishedAt: '9/12/2022',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios piden más participación en los órganos de gobierno de las universidades públicas',
          description:
            'CREUP reclama más participación estudiantil en la gobernanza universitaria y pide que la LOSU incorpore cambios sustanciales antes de su votación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-ep/mostrar/20221116111738/estudiantes-critican-estatuto-becario-no-garantiza-calidad-practicas-no-asegura-remuneracion',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '16/11/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes critican que el Estatuto del Becario «no garantiza la calidad de las prácticas y no asegura su remuneración»',
          description:
            'CREUP advierte de que el Estatuto del Estudiante en Prácticas no garantiza la calidad ni la remuneración de las prácticas y excluye la posibilidad de realizarlas en instituciones públicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.infolibre.es/politica/estudiantes-critican-estatuto-becario-no-asegura-remuneracion_1_1364589.html',
      mediaOutletId: mediaOutlets['infolibre'],
      publishedAt: '16/11/2022',
      tagSlugs: ['internships-employability', 'student-representation', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes critican que el Estatuto del Becario «no garantiza la calidad de las prácticas» ni su retribución',
          description:
            'CREUP denuncia que la negociación del Estatuto del Becario ha omitido la voz del estudiantado y que el texto no recoge sus reivindicaciones principales.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-critican-estatuto-becario-no-garantiza-calidad-practicas-no-asegura-remuneracion-20221116111738.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '16/11/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes critican que el Estatuto del Becario «no garantiza la calidad de las prácticas y no asegura su remuneración»',
          description:
            'CREUP critica que el Estatuto del Estudiante en Prácticas no asegure remuneración, calidad formativa ni continuidad de las prácticas en instituciones públicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/economia/20221116/8608779/universitarios-critican-abandono-ministerio-trabajo-estudiantado-estatuto-estudiante-formacion-practica.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '16/11/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios critican el «abandono» del Ministerio de Trabajo al estudiantado en el Estatuto del Estudiante en Formación Práctica',
          description:
            'CREUP critica que el Ministerio de Trabajo elabore un Estatuto del Estudiante en Prácticas que no garantiza la calidad, la remuneración ni las prácticas en instituciones públicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.servimedia.es/noticias/universitarios-critican-abandono-ministerio-trabajo-estudiantado-estatuto-estudiante-formacion-practica/3490612',
      mediaOutletId: mediaOutlets['servimedia'],
      publishedAt: '16/11/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios critican el «abandono» del Ministerio de Trabajo al estudiantado en el Estatuto del Estudiante en Formación Práctica',
          description:
            'CREUP recuerda que el estudiantado pidió un modelo de prácticas remunerado y formativo, pero critica que la reforma no recoja esas demandas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elsaltodiario.com/juventud/ministerio-trabajo-ultima-estatuto-becario-para-laboralizar-practicas?utm_source=Semana%204/11/2022%20-%20Socias&utm_medium=email&utm_campaign=bol653',
      mediaOutletId: mediaOutlets['el-salto'],
      publishedAt: '3/11/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Ministerio de Trabajo ultima su Estatuto del Becario para laboralizar las prácticas',
          description:
            'El Estatuto del Becario pretende reconocer derechos para quienes realizan prácticas, en un debate marcado por la compensación de gastos, los descansos y la laboralización de estas actividades.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elnacional.cat/es/economia/estatuto-becario-no-convence-estudiantes-suprimiran-practicas-extracurriculares_903957_102.html',
      mediaOutletId: mediaOutlets['el-nacional'],
      publishedAt: '29/10/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El estatuto del becario que no convence a los estudiantes: «Suprimirán las prácticas extracurriculares»',
          description:
            'El preacuerdo del Estatuto del Becario genera reticencias entre estudiantes, empresas y rectorados por su impacto en las prácticas extracurriculares.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.telemadrid.es/programas/120-minutos/Los-estudiantes-piden-frenar-el-Estatuto-del-Becario-para-incluir-sus-propias-peticiones-2-2499670033--20221025034129.html',
      mediaOutletId: mediaOutlets['telemadrid'],
      publishedAt: '25/10/2022',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes piden frenar el Estatuto del Becario para incluir sus propias peticiones',
          description:
            'CEUNE pide paralizar la aprobación del Estatuto del Becario para incorporar sus reivindicaciones y dar respuesta al fraude en los periodos de prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.infolibre.es/economia/fraude-no-marginal-inspeccion-descubre-5-000-falsos-becarios-recauda-13-millones-cuotas-impagadas_1_1344910.html',
      mediaOutletId: mediaOutlets['infolibre'],
      publishedAt: '23/10/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Un fraude no tan marginal: la Inspección descubre 5.000 falsos becarios y recauda 13 millones en cuotas debidas',
          description:
            'La Inspección detecta miles de falsos becarios mientras universidades y entidades formativas cuestionan el Estatuto del Becario por asimilar una actividad académica a una laboral.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.publico.es/politica/yolanda-diaz-impulsa-estatuto-becario-pone-gratis.html',
      mediaOutletId: mediaOutlets['publico'],
      publishedAt: '22/10/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Yolanda Díaz impulsa el Estatuto del Becario para poner fin al trabajo gratis',
          description:
            'El Estatuto del Becario busca reconocer derechos a quienes realizan prácticas y evitar que esta figura se utilice como trabajo gratuito encubierto.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/estatuto-del-becario-trabajo-deja-fuera-de-las-negociaciones-a-la-comunidad-universitaria/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '21/10/2022',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Estatuto del Becario: Trabajo deja fuera de las negociaciones a la comunidad universitaria',
          description:
            'Aula Magna recoge el malestar de CRUE y CREUP por la negociación del Estatuto del Becario sin participación suficiente de la comunidad universitaria, así como las críticas al tratamiento de las prácticas extracurriculares.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.cuadernosdepedagogia.com/Content/Documento.aspx?params=H4sIAAAAAAAEAMtMSbH1czUwMDAytLC0NLFQK0stKs7Mz7M1MjAyMjQwtAQJZKZVuuQnh1QWpNqmJeYUpwIAPUtgUDUAAAA=WKE',
      mediaOutletId: mediaOutlets['cuadernos-de-pedagogia'],
      publishedAt: '19/10/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden volver a redactar el Estatuto del Becario por no garantizar la remuneración y la calidad de las prácticas',
          description:
            'CREUP pide una nueva redacción del Estatuto del Becario al considerar que no garantiza la remuneración ni la calidad formativa de las prácticas académicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://valenciaplaza.com/valenciaplaza/los-estudiantes-piden-volver-a-redactar-el-estatuto-del-becario-por-no-garantizar-la-remuneracion',
      mediaOutletId: mediaOutlets['valencia-plaza'],
      publishedAt: '19/10/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes piden volver a redactar el Estatuto del Becario por no garantizar la remuneración',
          description:
            'CREUP reclama una nueva redacción del Estatuto del Estudiante en Formación Práctica porque el texto no garantiza la remuneración ni la calidad de las prácticas académicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://maldita.es/malditateexplica/20221019/estatuto-becario-plazos-datos-contexto/',
      mediaOutletId: mediaOutlets['maldita-es'],
      publishedAt: '19/10/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Qué es el estatuto del becario: plazos, datos y contexto de la propuesta que busca regular las condiciones de los estudiantes',
          description:
            'Maldita.es contextualiza la propuesta del Estatuto del Becario y recoge la posición de CREUP, que pide un nuevo texto porque el borrador ignora reivindicaciones del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.infolibre.es/economia/estudiantes-piden-volver-redactar-estatuto-becario-no-garantizar-remuneracion-calidad-practicas_1_1343421.html',
      mediaOutletId: mediaOutlets['infolibre'],
      publishedAt: '19/10/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes, contra el Estatuto del Becario por no garantizar la remuneración y la calidad de las prácticas',
          description:
            'infoLibre recoge el rechazo de CREUP al Estatuto del Becario por ignorar sus reivindicaciones, no asegurar una remuneración suficiente y no abordar adecuadamente la calidad de las prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.huffingtonpost.es/entry/estudiantes-cambiar-estatuto-becario-garantizar-remuneracion-practicas_es_634fcd6ee4b04cf8f37e3636.html',
      mediaOutletId: mediaOutlets['el-huffpost'],
      publishedAt: '19/10/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden cambiar el Estatuto del Becario para garantizar la remuneración y la calidad de prácticas',
          description:
            'El HuffPost recoge que CREUP solicita una reforma integral de las prácticas académicas para garantizar su carácter formativo, su remuneración, la cotización y la calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-piden-volver-redactar-estatuto-becario-no-garantizar-remuneracion-calidad-practicas-20221019113707.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '19/10/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden volver a redactar el Estatuto del Becario por no garantizar la remuneración y la calidad de prácticas',
          description:
            'Europa Press informa de que CREUP pide una nueva redacción del Estatuto del Becario porque, a su juicio, el texto pactado no garantiza la remuneración ni la calidad de las prácticas académicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elliberal.com/criticas-al-nuevo-estatuto-del-becario-de-yolanda-diaz-no-mejora-la-calidad-formativa/',
      mediaOutletId: mediaOutlets['el-liberal'],
      publishedAt: '19/10/2022',
      tagSlugs: ['internships-employability', 'university-quality', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title:
            'Críticas al nuevo Estatuto del Becario de Yolanda Díaz: «No mejora la calidad formativa»',
          description:
            'El Liberal recoge las críticas al Estatuto del Becario por no mejorar la calidad formativa de las prácticas y por no ofrecer soluciones suficientes a los problemas del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://theobjective.com/espana/2022-10-19/universitarios-yolanda-diaz-becarios/',
      mediaOutletId: mediaOutlets['the-objective'],
      publishedAt: '19/10/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios acusan a Yolanda Díaz de ignorarles en el Estatuto del Becario',
          description:
            'The Objective recoge que CREUP acusa al Ministerio de Trabajo de no tener en cuenta sus reclamaciones para lograr unas prácticas remuneradas y de calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.andaluciainformacion.es/antequera/1094742/universitarios-acusan-a-yolanda-diaz-de-ignorarles-en-el-estatuto-del-becario/',
      mediaOutletId: mediaOutlets['andalucia-informacion'],
      publishedAt: '19/10/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Universitarios acusan a Yolanda Díaz de ignorarles en el Estatuto del Becario',
          description:
            'Andalucía Información recoge que CREUP acusa al Ministerio de Trabajo de ignorar al estudiantado en la redacción del Estatuto del Becario y reclama una nueva propuesta.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/epsocial/igualdad/noticia-estudiantes-condenan-gritos-machistas-colegio-mayor-madrid-te-ponen-pelos-punta-verlo-20221006141125.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '6/10/2022',
      tagSlugs: ['rights-coexistence-equality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes condenan los gritos machistas en un colegio mayor de Madrid: «Se te ponen los pelos de punta al verlo»',
          description:
            'Europa Press recoge la condena de CREUP a los gritos machistas del Colegio Mayor Elías Ahúja y su apoyo a las estudiantes afectadas del Colegio Mayor Santa Mónica.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.huffingtonpost.es/entry/diego-losada-no-se-corta-ante-lo-que-le-dice-el-subdirector-del-colegio-mayor-disculpeme_es_633ecfc8e4b08e0e6075f754.html',
      mediaOutletId: mediaOutlets['el-huffpost'],
      publishedAt: '6/10/2022',
      tagSlugs: ['rights-coexistence-equality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'Diego Losada no se corta ante lo que le dice el subdirector del colegio mayor: «Discúlpeme…»',
          description:
            'El HuffPost recoge las declaraciones de CREUP contra los gritos machistas del Colegio Mayor Elías Ahúja y su exigencia de protocolos reales de prevención y atención a las víctimas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/creup-reivindica-en-el-congreso-una-transformacion-profunda-de-la-losu/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '22/09/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP reivindica en el Congreso una «transformación profunda» de la LOSU',
          description:
            'Aula Magna recoge la comparecencia de CREUP en el Congreso para reclamar una transformación profunda de la LOSU, con más protagonismo del estudiantado en la gobernanza universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20220919/8533918/estudiantes-reivindican-losu-garantice-presencia-35-organos-gobierno-universidades.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '19/09/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes reivindican que la LOSU garantice una presencia del 35% en los órganos de gobierno de las universidades',
          description:
            'La Vanguardia recoge la petición de CREUP para que la futura LOSU garantice una presencia del 35% del estudiantado en los órganos de gobierno universitarios.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.servimedia.es/noticias/estudiantes-reivindican-losu-garantice-una-presencia-35-organos-gobierno-universidades/3461121',
      mediaOutletId: mediaOutlets['servimedia'],
      publishedAt: '19/09/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes reivindican que la LOSU garantice una presencia del 35% en los órganos de gobierno de las universidades',
          description:
            'Servimedia informa de que CREUP pedirá en el Congreso que la LOSU garantice una presencia del 35% del alumnado en los órganos de gobierno universitarios.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-trabajaran-proceso-tramitacion-parlamentaria-losu-aspectos-afectan-estudiantes-20220914110553.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '14/09/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios «trabajarán» en el proceso de tramitación parlamentaria de la LOSU en aspectos que afectan a estudiantes',
          description:
            'Europa Press recoge que CREUP participará en el proceso de tramitación parlamentaria de la LOSU, especialmente en los aspectos que afectan a la participación estudiantil.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/los-universitarios-piden-que-no-se-eliminen-las-practicas-en-entidades-publicas/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '12/09/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Los universitarios piden que no se eliminen las prácticas en entidades públicas',
          description:
            'Aula Magna recoge la petición de CREUP para que el Estatuto del Becario no elimine las prácticas en entidades públicas, especialmente relevantes para muchas titulaciones.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://revistanuve.com/no-eliminar-las-practicas-en-entidades-publicas/',
      mediaOutletId: mediaOutlets['revista-nuve'],
      publishedAt: '6/09/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'No eliminar las prácticas en entidades públicas',
          description:
            'Revista NUVE recoge la posición de CREUP contra la eliminación de las prácticas extracurriculares en entidades públicas y a favor de controles efectivos, calidad formativa y remuneración justa.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.magisnet.com/2022/08/estudiantes-denuncian-la-exclusion-de-las-practicas-en-el-sector-publico/',
      mediaOutletId: mediaOutlets['magisnet'],
      publishedAt: '30/08/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes denuncian la exclusión de las prácticas en el sector público',
          description:
            'Magisnet recoge la alerta de CREUP ante un borrador del Estatuto del Becario que podría impedir al estudiantado realizar prácticas extracurriculares en entidades públicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.bolsamania.com/noticias/economia/economia--universitarios-piden-al-ministerio-de-trabajo-que-no-elimine-las-practicas-en-entidades-publicas--10566474.html',
      mediaOutletId: mediaOutlets['bolsamania'],
      publishedAt: '30/08/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden al Ministerio de Trabajo que no elimine las prácticas en entidades públicas',
          description:
            'CREUP pide al Ministerio de Trabajo que el futuro Estatuto del Estudiante en Prácticas no elimine las prácticas extracurriculares en entidades públicas y reclama prácticas remuneradas, cotizadas y de calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20220830/8491559/estudiantes-denuncian-exclusion-practicas-sector-publico.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '30/08/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes denuncian la exclusión de las prácticas en el sector público',
          description:
            'CREUP reclama que las prácticas extracurriculares en instituciones públicas no queden fuera del Estatuto del Estudiante en Prácticas y advierte de que su exclusión perjudicaría a titulaciones sin prácticas curriculares.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.moncloa.com/2022/08/30/universitarios-ministerio-trabajo-elimine-practicas-entidades-publicas-1585087/',
      mediaOutletId: mediaOutlets['moncloa-com'],
      publishedAt: '30/08/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios solicitan al Ministerio de Trabajo que no elimine las prácticas en entidades públicas',
          description:
            'CREUP solicita al Ministerio de Trabajo que no elimine las prácticas extracurriculares en entidades públicas y defiende que la precariedad se combate con control eficaz, formatividad y remuneración justa.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.cope.es/actualidad/sociedad/noticias/estudiantes-denuncian-exclusion-las-practicas-sector-publico-20220830_2264032',
      mediaOutletId: mediaOutlets['cope'],
      publishedAt: '30/08/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes denuncian la exclusión de las prácticas en el sector público',
          description:
            'CREUP denuncia que el borrador del Estatuto del Estudiante en Prácticas puede dejar fuera las prácticas extracurriculares en instituciones públicas y reclama que se garantice su calidad formativa.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-piden-ministerio-trabajo-no-elimine-practicas-entidades-publicas-20220830115601.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '30/08/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden al Ministerio de Trabajo que no elimine las prácticas en entidades públicas',
          description:
            'CREUP pide al Ministerio de Trabajo que no elimine las prácticas extracurriculares en entidades públicas y reclama a las universidades mayor responsabilidad sobre el control y la calidad de las prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.granadahoy.com/granada/estudiantes-Granada-Pedro-beca-100-euros-Sanchez_0_1701430207.html',
      mediaOutletId: mediaOutlets['granada-hoy'],
      publishedAt: '14/07/2022',
      tagSlugs: ['scholarships-funding', 'student-economy', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'Unos 30.000 estudiantes de Granada pueden beneficiarse de la beca de 100 euros mensuales anunciada por Pedro Sánchez',
          description:
            'Unos 30.000 estudiantes de Granada podrían beneficiarse de la ayuda adicional de 100 euros mensuales anunciada por el Gobierno para alumnado mayor de 16 años que ya recibe beca.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-comunidad-educativa-pide-medidas-adicionales-beca-extra-100-euros-anunciada-sanchez-20220712162508.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '12/07/2022',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La comunidad educativa pide medidas adicionales a la beca extra de 100 euros anunciada por Sánchez',
          description:
            'La comunidad educativa reclama que la beca extra de 100 euros mensuales vaya acompañada de medidas adicionales de apoyo al alumnado y a las familias ante la crisis económica.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.mundodeportivo.com/actualidad/20220708/1001834027/trabajo-quiere-eliminar-practicas-extracurriculares-2026-act-pau.html',
      mediaOutletId: mediaOutlets['mundo-deportivo'],
      publishedAt: '8/07/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Trabajo quiere eliminar las prácticas extracurriculares en 2026',
          description:
            'El artículo aborda la propuesta de eliminar las prácticas extracurriculares en 2026 dentro de la negociación del Estatuto del Becario y recoge la participación de CREUP en el proceso de diálogo.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/creup-denuncia-que-subirats-ignore-sus-demandas-en-el-anteproyecto-de-la-losu/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '27/06/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP denuncia que Subirats ignore sus demandas en el anteproyecto de la LOSU',
          description:
            'CREUP denuncia que el anteproyecto de la LOSU deja fuera demandas clave del estudiantado, especialmente en materia de cogobernanza, participación y garantías reales de derechos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-creup-critica-losu-deja-lado-estudiantado-no-introducir-mecanismos-garanticen-derechos-20220622112530.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '22/06/2022',
      tagSlugs: ['university-policy', 'student-representation', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP critica que la LOSU «deja de lado» al estudiantado al no introducir mecanismos «que garanticen sus derechos»',
          description:
            'CREUP critica que la LOSU deja de lado al estudiantado al no introducir mecanismos suficientes para garantizar sus derechos y reclama mayor presencia en órganos de gobierno y elecciones.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-ep/mostrar/20220622112530/creup-critica-losu-deja-lado-estudiantado-no-introducir-mecanismos-garanticen-derechos',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '22/06/2022',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP critica que la LOSU «deja de lado» al estudiantado al no introducir mecanismos «que garanticen sus derechos»',
          description:
            'CREUP sostiene que el anteproyecto de la LOSU relega la participación estudiantil a un segundo plano y reclama mecanismos que hagan vinculante la voz del estudiantado en decisiones que le afecten.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.newtral.es/ley-universidades-subirats/20220622/',
      mediaOutletId: mediaOutlets['newtral'],
      publishedAt: '22/06/2022',
      tagSlugs: [
        'university-policy',
        'scholarships-funding',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La ley de Universidades de Subirats: invertir el 1% del PIB, reducir la temporalidad y reconocer el derecho al paro académico',
          description:
            'Newtral analiza las claves de la ley de universidades de Subirats, incluyendo financiación, reducción de la temporalidad, derecho al paro académico y cambios en la elección del rector.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20220622/8357846/asociaciones-estudiantes-denuncian-subirats-deja-lado-reforma-ley-universidades.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '22/06/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Asociaciones de estudiantes denuncian que Subirats los deja «de lado» en la reforma de la ley de Universidades',
          description:
            'CREUP denuncia que Subirats deja de lado las demandas del estudiantado en la reforma universitaria y reclama una universidad más democrática, participativa y de calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aprendemas.com/es/blog/mundo-educativo/luz-verde-al-anteproyecto-de-la-ley-organica-de-universidades-en-el-consejo-de-ministros-164536',
      mediaOutletId: mediaOutlets['aprendemas'],
      publishedAt: '21/06/2022',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Luz verde al anteproyecto de la Ley Orgánica de Universidades hoy en el Consejo de Ministros',
          description:
            'Aprendemas resume el anteproyecto de la LOSU, con medidas sobre temporalidad del profesorado, paro académico, oferta de estudios y representación estudiantil.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.crue.org/2022/06/xx-jornadas-crue-sostenibilidad-los-ods-en-la-formacion-universitaria/',
      mediaOutletId: mediaOutlets['crue'],
      publishedAt: '3/06/2022',
      tagSlugs: ['university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'XXX Jornadas Crue-Sostenibilidad: Los ODS en la formación universitaria',
          description:
            'CRUE recoge la celebración de las XXX Jornadas Crue-Sostenibilidad, centradas en la integración de los ODS en la formación universitaria y con participación del presidente de CREUP.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/los-estudiantes-reclaman-al-ministerio-cambios-en-el-nuevo-borrador-de-la-losu/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '3/06/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Los estudiantes reclaman al Ministerio cambios en el nuevo borrador de la LOSU',
          description:
            'El estudiantado reclama cambios en el nuevo borrador de la LOSU, con especial atención a la gobernanza universitaria, los mandatos rectorales, los planes de estudio y los recursos para la representación estudiantil.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-piden-participar-planes-estudios-universitarios-pueda-estudiar-catalan-euskera-20220602120723.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '2/06/2022',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden participar en los planes de estudios universitarios y que se pueda estudiar en catalán o euskera',
          description:
            'CREUP y CEUNE rechazan el borrador de la LOSU y reclaman participación vinculante del estudiantado en los planes de estudio, las guías docentes y los órganos de gobierno.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.abc.es/formacion/abci-gobierno-presenta-ley-universidades-abierta-para-esquivar-criticas-202205171949_noticia.html',
      mediaOutletId: mediaOutlets['abc'],
      publishedAt: '17/05/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno presenta una ley de universidades «abierta» para esquivar las críticas',
          description:
            'El nuevo borrador de la LOSU amplía la autonomía de las universidades, reduce requisitos para ser rector y mantiene abierto el debate sobre el peso del estudiantado en la gobernanza.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.apuntmedia.es/noticies/societat/l-estatut-becari-una-nova-oportunitat-frenar-l-arbitrarietat-practiques_1_1514459.html',
      mediaOutletId: mediaOutlets['a-punt'],
      publishedAt: '13/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'L’estatut del becari, una nova oportunitat per a frenar l’arbitrarietat en les pràctiques',
          description:
            'À Punt analiza el futuro Estatuto del Becario y recoge la valoración de representantes estudiantiles sobre la oportunidad de situar al alumnado en el centro de la reforma de las prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.20minutos.es/noticia/4998640/0/sindicatos-estudiantes-aplauden-novedades-ley-universidades-afean-puntos-generalistas/',
      mediaOutletId: mediaOutlets['20-minutos'],
      publishedAt: '11/05/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Sindicatos y estudiantes aplauden las novedades en la ley de universidades, pero afean que mantenga puntos «generalistas»',
          description:
            'CREUP y CEUNE valoran algunos avances del nuevo borrador de la LOSU, pero advierten de que no garantiza una participación real del estudiantado ni una mayor gobernanza.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/creup-y-ceune-denuncian-que-la-losu-no-avanza-lo-suficiente/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '11/05/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP y CEUNE denuncian que «la LOSU no avanza lo suficiente»',
          description:
            'CREUP y CEUNE consideran que el nuevo borrador de la LOSU ignora la realidad del estudiantado y mantiene una representación insuficiente en los órganos de gobierno.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.portalparados.es/actualidad/los-becarios-podrian-tener-derecho-a-paro-si-prospera-la-propuesta-de-trabajo/',
      mediaOutletId: mediaOutlets['portal-parados'],
      publishedAt: '11/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-policy',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Los becarios podrían tener derecho a paro si prospera la propuesta de Trabajo',
          description:
            'Trabajo estudia que las prácticas generen derecho a prestación por desempleo y anuncia que incorporará a los jóvenes al debate del Estatuto del Becario tras reunirse con CREUP y el Consejo de la Juventud.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/reunion-creup-yolanda-diaz-por-el-estatuto-del-becario/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '10/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Reunión CREUP-Yolanda Díaz por el Estatuto del Becario',
          description:
            'CREUP se reúne con Yolanda Díaz para trasladar sus reivindicaciones sobre prácticas formativas, compensación económica, control del fraude laboral y participación del estudiantado en el diseño de las prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.abc.es/sociedad/abci-nueva-ley-universidades-elimina-requisitos-para-rector-y-deja-manos-alumnos-temario-y-examenes-202205091109_noticia.html',
      mediaOutletId: mediaOutlets['abc'],
      publishedAt: '9/05/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'La nueva ley de Universidades elimina los requisitos para ser rector y deja en manos de los alumnos temario y exámenes',
          description:
            'El anteproyecto reduce los requisitos estatales para ser rector y reconoce la participación vinculante del estudiantado en planes de estudio y guías docentes, aunque no aumenta su peso en los órganos de gobierno.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.teleprensa.com/articulo/sociedad/estudiantes-valoran-avances-ley-universidades-piden-que-dote-mayor-gobernanza/202205091826201203087.html',
      mediaOutletId: mediaOutlets['teleprensa'],
      publishedAt: '9/05/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes valoran los «avances» de la Ley de Universidades pero piden que se les dote de «mayor gobernanza»',
          description:
            'CREUP y CEUNE reconocen avances en el anteproyecto de la LOSU, pero consideran insuficiente el texto y reclaman mayor gobernanza para el estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-valoran-avances-ley-universidades-piden-les-dote-mayor-gobernanza-20220509172937.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '9/05/2022',
      tagSlugs: ['university-policy', 'student-representation', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes valoran los «avances» de la Ley de Universidades pero piden que se les dote de «mayor gobernanza»',
          description:
            'CREUP y CEUNE valoran los nuevos derechos recogidos en el anteproyecto de la LOSU, pero reclaman una representación estudiantil suficiente en órganos y votaciones.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.economiadigital.es/economia/yolanda-diaz-impone-compensacion-gastos-becarios-reticencias-rectores.html',
      mediaOutletId: mediaOutlets['economia-digital'],
      publishedAt: '9/05/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Yolanda Díaz impone la compensación de gastos a becarios frente a reticencias de los rectores',
          description:
            'Yolanda Díaz defiende que las personas en prácticas no tengan que asumir gastos para formarse y se compromete a escuchar a CREUP y al Consejo de la Juventud en el Estatuto del Becario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.elmundo.es/espana/2022/05/09/6272d3ad21efa0d31a8b45eb.html',
      mediaOutletId: mediaOutlets['el-mundo'],
      publishedAt: '9/05/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Subirats permitirá en su nueva Ley de Universidades que los alumnos «controlen» los exámenes y los planes de estudios',
          description:
            'El anteproyecto de la LOSU reconoce la participación vinculante del estudiantado en planes de estudio y guías docentes, una medida valorada positivamente por CREUP.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/economia/20220509/8253810/diaz-avisa-rectores-universitarios-isla-alejada-lucha-precariedad.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '9/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Díaz avisa a los rectores universitarios de que «no pueden ser una isla alejada» de la lucha contra la precariedad',
          description:
            'Yolanda Díaz pide a los rectores compromiso frente a la precariedad y defiende que el Estatuto del Becario incluya compensación de gastos para el estudiantado en prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-yolanda-diaz-compromete-escuchar-reivindicaciones-jovenes-elaborar-futuro-estatuto-becario-20220509142531.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '9/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Yolanda Díaz se compromete a escuchar las reivindicaciones de los jóvenes para elaborar el futuro Estatuto del Becario',
          description:
            'Yolanda Díaz se compromete a escuchar a CREUP y al Consejo de la Juventud en la elaboración del Estatuto del Becario, con medidas sobre compensación de gastos, cotización y tutorización.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lainformacion.com/economia-negocios-y-finanzas/claves-estatuto-becario-sueldo-vacaciones/2866205/',
      mediaOutletId: mediaOutlets['la-informacion'],
      publishedAt: '9/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'rights-coexistence-equality',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Claves del «Estatuto del Becario» que ya planea el Gobierno: sueldo, vacaciones…',
          description:
            'La propuesta del Estatuto del Becario plantea proteger los derechos de quienes realizan prácticas no laborales, mientras CREUP reclama formatividad, control del fraude y una remuneración justa.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-ep/mostrar/20220509140818/yolanda-diaz-compromete-escuchar-reivindicaciones-jovenes-elaborar-futuro-estatuto-becario',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '9/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Yolanda Díaz se compromete a escuchar las reivindicaciones de los jóvenes para elaborar el futuro Estatuto del Becario',
          description:
            'Díaz anuncia que escuchará a CREUP y al Consejo de la Juventud para elaborar el Estatuto del Becario y afirma que quiere acabar con el uso fraudulento de las prácticas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.tv/politica/665893/1/diaz-reune-representantes-creup-elaboracion-estatuto-becario',
      mediaOutletId: mediaOutlets['europa-press-tv'],
      publishedAt: '9/05/2022',
      tagSlugs: ['internships-employability', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Díaz se reúne con representantes de la CREUP para la elaboración del Estatuto del Becario',
          description:
            'Europa Press TV recoge imágenes de la reunión entre Yolanda Díaz y representantes de CREUP en el Ministerio de Trabajo para abordar la elaboración del Estatuto del Becario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.rtve.es/noticias/20220508/becarios-hablan-condiciones-practicas-estatuto/2346803.shtml',
      mediaOutletId: mediaOutlets['rtve'],
      publishedAt: '8/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los becarios celebran su futuro estatuto y piden prácticas dignas: «No te forman, no te pagan y ganan dinero contigo»',
          description:
            'RTVE recoge testimonios de estudiantes en prácticas que denuncian falta de remuneración, ausencia de formación real y situaciones de abuso que el futuro Estatuto del Becario debería corregir.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/los-universitarios-piden-practicas-formativas-y-remuneradas-en-el-estatuto-del-becario/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '6/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios piden prácticas formativas y remuneradas en el Estatuto del Becario',
          description:
            'CREUP reclama que el Estatuto del Becario garantice prácticas académicas formativas, remuneradas, con mecanismos de control, tutorización efectiva y límites compatibles con la conciliación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.moncloa.com/2022/05/06/estudiantes-universitarios-reclaman-practicas-1398038/',
      mediaOutletId: mediaOutlets['moncloa-com'],
      publishedAt: '6/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios reclaman prácticas formativas y remuneradas en el futuro Estatuto del Becario',
          description:
            'CREUP pide que el futuro Estatuto del Becario incorpore las reivindicaciones del estudiantado universitario, garantice la calidad de las prácticas y evite el fraude laboral.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-universitarios-reclaman-practicas-formativas-remuneradas-futuro-estatuto-becario-20220506110937.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '6/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios reclaman prácticas formativas y remuneradas en el futuro Estatuto del Becario',
          description:
            'CREUP reclama que el Estatuto del Becario garantice la formatividad de las prácticas académicas, evite el fraude laboral y establezca una remuneración justa.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://exitoeducativo.net/los-sindicatos-de-estudiantes-consiguen-que-el-derecho-a-la-huelga-entre-en-la-ley-de-universidades/',
      mediaOutletId: mediaOutlets['exito-educativo'],
      publishedAt: '6/05/2022',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los representantes de los estudiantes consiguen que el derecho a la huelga entre en la Ley de Universidades',
          description:
            'La representación estudiantil celebra que la LOSU reconozca el derecho al paro académico, una reivindicación histórica para blindar la protesta sin consecuencias académicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.heraldo.es/noticias/economia/2022/05/06/yolanda-diaz-compensara-gastos-becario-nuestro-pais-nopuede-pagar-por-ser-becario-1572472.html',
      mediaOutletId: mediaOutlets['heraldo'],
      publishedAt: '6/05/2022',
      tagSlugs: ['internships-employability', 'student-economy', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Díaz afirma que se compensarán los gastos del becario: «En nuestro país no se puede pagar por ser becario y esto pasa»',
          description:
            'Yolanda Díaz afirma que el Estatuto del Becario contemplará una compensación de gastos y defiende que las personas en prácticas no tengan que pagar por formarse.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.telecinco.es/noticias/sociedad/estudiantes-universitarios-reclaman-practicas-formativas-remuneradas-estatuto-becario_18_3325620917.html',
      mediaOutletId: mediaOutlets['telecinco'],
      publishedAt: '6/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios reclaman prácticas formativas y remuneradas en el futuro Estatuto del Becario',
          description:
            'CREUP reclama que el futuro Estatuto del Becario incorpore las reivindicaciones del estudiantado, garantice prácticas formativas y remuneradas y refuerce los mecanismos de control.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.cope.es/actualidad/sociedad/noticias/estudiantes-universitarios-piden-unas-practicas-formativas-remuneradas-20220506_2067272',
      mediaOutletId: mediaOutlets['cope'],
      publishedAt: '6/05/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes universitarios piden unas prácticas «formativas y remuneradas»',
          description:
            'El estudiantado reclama que el Estatuto del Becario garantice prácticas formativas, calidad en la tutorización, control efectivo y una remuneración justa para evitar el fraude laboral.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/la-losu-reconocera-el-paro-academico-como-un-derecho-de-los-estudiantes/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '5/05/2022',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La LOSU reconocerá el paro académico como un derecho de los estudiantes',
          description:
            'CREUP y CEUNE celebran que la futura LOSU reconozca el paro académico como derecho del estudiantado y blinde el derecho a la protesta sin consecuencias académicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.larazon.es/educacion/20220504/asuqc3mjvrglrhd5a5tkjgxwxe.html',
      mediaOutletId: mediaOutlets['la-razon'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'El paro académico será un derecho recogido por ley',
          description:
            'La LOSU incorporará el derecho al paro académico, de forma que el alumnado no pueda sufrir consecuencias académicas por secundarlo conforme a los mecanismos previstos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://madridpress.com/archive/304307/la-nueva-ley-de-universidades-recogera-el-derecho-a-huelga-de-los-estudiantes',
      mediaOutletId: mediaOutlets['madridpress'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La nueva Ley de Universidades recogerá el derecho a huelga de los estudiantes',
          description:
            'El anteproyecto de la LOSU recogerá el derecho a paro académico del estudiantado y obligará a las universidades a habilitar mecanismos para ejercerlo.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lanzadigital.com/provincia/la-nueva-ley-de-universidades-recogera-el-derecho-a-huelga-de-los-estudiantes/',
      mediaOutletId: mediaOutlets['lanza-digital'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La nueva Ley de Universidades recogerá el derecho a huelga de los estudiantes',
          description:
            'La LOSU reconocerá el paro académico como reivindicación histórica del estudiantado, con condiciones de convocatoria y garantías para quienes lo secunden o no.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.20minutos.es/noticia/4994983/0/estudiantes-no-podran-suspender-por-hacer-paro-academico-la-nueva-ley-universidades-amparara-derecho-a-huelga/',
      mediaOutletId: mediaOutlets['20-minutos'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes no podrán suspender por hacer un paro académico: la nueva ley de Universidades amparará su derecho a huelga',
          description:
            'El Ministerio y los colectivos estudiantiles acuerdan incorporar el derecho al paro académico en la LOSU, evitando consecuencias académicas por ejercerlo.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.redaccionmedica.com/secciones/sanidad-hoy/espana-desbloquea-el-derecho-a-huelga-para-los-estudiantes-de-medicina-8267',
      mediaOutletId: mediaOutlets['redaccion-medica'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'España desbloquea el derecho a huelga para los estudiantes de Medicina',
          description:
            'La nueva Ley de Universidades incluirá el paro académico como derecho del estudiantado, también para los grados de Ciencias de la Salud, sin perjuicio académico.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-nueva-ley-universidades-recogera-derecho-huelga-estudiantes-20220504175728.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La nueva Ley de Universidades recogerá el derecho a huelga de los estudiantes',
          description:
            'El anteproyecto de la LOSU reconocerá el derecho a paro académico, vinculado al ejercicio de la libertad de expresión, reunión y asociación en la universidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.heraldo.es/noticias/nacional/2022/05/04/nueva-ley-universitaria-reconocera-derecho-paro-academico-estudiantes-1571885.html',
      mediaOutletId: mediaOutlets['heraldo'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La nueva ley universitaria reconocerá el derecho al paro académico',
          description:
            'La LOSU introducirá el derecho al paro académico y obligará a las universidades a articular mecanismos que preserven la docencia y la evaluación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.publico.es/politica/gobierno-reconocera-derecho-huelga-estudiantes-nueva-ley-universidades.html',
      mediaOutletId: mediaOutlets['publico'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno reconocerá el derecho a la huelga de los estudiantes en la nueva ley de universidades',
          description:
            'La nueva ley universitaria reconocerá el paro académico y exigirá mecanismos para que los Consejos de Estudiantes puedan convocarlo sin afectar al derecho a la docencia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://theobjective.com/espana/2022-05-04/ley-paro-academico/',
      mediaOutletId: mediaOutlets['the-objective'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La nueva ley universitaria reconocerá el derecho al paro académico',
          description:
            'El reconocimiento del paro académico en la LOSU se presenta como una reivindicación histórica de la representación estudiantil y del derecho a manifestación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://cadenaser.com/2022/05/04/la-nueva-ley-de-universidades-reconocera-el-derecho-a-la-huelga-de-los-estudiantes/',
      mediaOutletId: mediaOutlets['cadena-ser'],
      publishedAt: '4/05/2022',
      tagSlugs: ['university-policy', 'rights-coexistence-equality', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'La nueva ley de universidades reconocerá el derecho a la huelga de los estudiantes',
          description:
            'La nueva ley de universidades reconocerá el derecho del estudiantado a la huelga, con condiciones de convocatoria y preaviso ante las autoridades académicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/ley-universidades-reconocera-primera-vez-derecho-huelga-estudiantes_1_8962241.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '4/05/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La Ley de Universidades reconocerá por primera vez el derecho a la huelga de los estudiantes',
          description:
            'La LOSU incluirá por primera vez el paro académico como derecho subjetivo del estudiantado, dando respuesta a una reivindicación histórica de CREUP.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/universidades-sufren-subida-precio-luz-limitan-horarios-aperturas-edificios_1_8950696.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '2/05/2022',
      tagSlugs: [
        'student-economy',
        'university-life-wellbeing',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Las universidades sufren la subida del precio de la luz y limitan horarios y aperturas de edificios',
          description:
            'CREUP critica los recortes de horarios y servicios universitarios por el encarecimiento energético, al considerar que limitan la vida académica y el acceso a recursos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/con-el-estatuto-del-becario-los-universitarios-reivindican-unas-practicas-academicas-dignas/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '25/04/2022',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-quality',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Con el Estatuto del Becario, los universitarios reivindican unas prácticas académicas dignas',
          description:
            'CREUP reclama participar en la negociación del Estatuto del Becario para garantizar prácticas académicas formativas, tutorizadas, remuneradas y libres de fraude.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-ep/mostrar/20220422140957/crue-sostenibilidad-aconseja-seguir-usando-curso-mascarilla-aulas-laboratorios-talleres-salas-reuniones',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '22/04/2022',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Crue-Sostenibilidad aconseja seguir usando este curso mascarilla en aulas, laboratorios, talleres o salas de reuniones',
          description:
            'CREUP llama a mantener la prudencia y a continuar de forma progresiva con las medidas de seguridad, siguiendo las indicaciones de las autoridades sanitarias.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.moncloa.com/2022/04/22/crue-sostenibilidad-usando-mascarilla-aulas-1376369/',
      mediaOutletId: mediaOutlets['moncloa-com'],
      publishedAt: '22/04/2022',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Crue-Sostenibilidad aconseja seguir usando este curso mascarilla en aulas, laboratorios, talleres o salas de reuniones',
          description:
            'Crue-Sostenibilidad recomienda mantener la mascarilla en espacios universitarios compartidos y CREUP defiende una retirada prudente y progresiva de las medidas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20220421/8212489/creup-denuncia-cerrar-instalaciones-universitarias-precio-energia-limita-derecho-estudio.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '21/04/2022',
      tagSlugs: [
        'student-economy',
        'university-life-wellbeing',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP denuncia que cerrar instalaciones universitarias por el precio de la energía limita el derecho al estudio',
          description:
            'CREUP rechaza el cierre anticipado de instalaciones y los reajustes horarios por el encarecimiento energético, al considerar que limitan el derecho al estudio.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-denuncian-cierre-edificios-universitarios-encarecimiento-energia-20220421125955.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '21/04/2022',
      tagSlugs: [
        'student-economy',
        'university-life-wellbeing',
        'university-quality',
        'rights-coexistence-equality',
        'scholarships-funding',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios denuncian el cierre de los edificios universitarios ante el encarecimiento de la energía',
          description:
            'CREUP exige la reapertura de instalaciones universitarias y una dotación específica de ayudas para afrontar el encarecimiento de la energía sin deteriorar derechos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/el-cierre-de-edificios-por-el-encarecimiento-de-la-energia-indigna-a-los-universitarios/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '21/04/2022',
      tagSlugs: [
        'student-economy',
        'university-life-wellbeing',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El cierre de edificios por el encarecimiento de la energía indigna a los universitarios',
          description:
            'El estudiantado rechaza el cierre de edificios universitarios y los reajustes horarios derivados del encarecimiento energético por limitar el derecho al estudio.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://portalcomunicacion.uah.es/diario-digital/actualidad/la-uah-acoge-la-asamblea-general-de-ordinaria-de-la-coordinadora-de-representantes-de-estudiantes-de-universidades-publicas.html',
      mediaOutletId: mediaOutlets['universidad-de-alcala'],
      publishedAt: '8/04/2022',
      tagSlugs: ['student-representation', 'university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'La UAH acoge la Asamblea General Ordinaria de la Coordinadora de Representantes de Estudiantes de Universidades Públicas',
          description:
            'La Universidad de Alcalá acoge la Asamblea General Ordinaria de CREUP, reuniendo a representantes estudiantiles de universidades públicas para abordar cuestiones del sistema universitario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.dream-alcala.com/la-coordinadora-de-estudiantes-de-universidades-se-da-cita-en-alcala/',
      mediaOutletId: mediaOutlets['dream-alcala'],
      publishedAt: '7/04/2022',
      tagSlugs: ['student-representation', 'university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'La Coordinadora de Estudiantes de Universidades se da cita en Alcalá',
          description:
            'Representantes de estudiantes de universidades públicas se reúnen en Alcalá en el marco de una cita de CREUP centrada en la participación estudiantil y la mejora universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.20minutos.es/noticia/4975381/0/estudiantes-convocan-huelga-contra-reforma-educativa-gobierno-continuista-pp/',
      mediaOutletId: mediaOutlets['20-minutos'],
      publishedAt: '24/03/2022',
      tagSlugs: ['university-policy', 'student-representation', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes convocan una huelga contra la reforma educativa del Gobierno: «Es continuista con la del PP»',
          description:
            'El estudiantado convoca una huelga contra la reforma educativa del Gobierno, a la que acusa de mantener elementos continuistas respecto a la normativa anterior.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://acpua.aragon.es/es/noticias/acpua-estudiantes-reunion-con-la-creup-0',
      mediaOutletId: mediaOutlets['acpua'],
      publishedAt: '23/03/2022',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'ACPUA + estudiantes: reunión con CREUP',
          description:
            'ACPUA mantiene una reunión con CREUP para abordar la participación del estudiantado en los procesos de calidad y evaluación del sistema universitario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.uv.es/uvweb/uv-noticies/es/noticias/universitat-acoge-iii-congreso-creup-crue-abordar-losu-1285973304159/Novetat.html?id=1286248970309&plantilla=UV_Noticies/Page/TPGDetaillNews',
      mediaOutletId: mediaOutlets['universitat-de-valencia'],
      publishedAt: '8/03/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'La Universitat acoge el III Congreso CREUP-CRUE para abordar la LOSU',
          description:
            'La Universitat de València acoge el III Congreso CREUP-CRUE, centrado en el debate sobre la LOSU y la mejora del sistema universitario español.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-s/mostrar/446696/cermi-expresa-temor-nueva-ley-universidades-sea-regresiva-inclusion-personas-discapacidad',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '4/03/2022',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-policy',
        'university-quality',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El Cermi expresa su temor a que la nueva Ley de Universidades sea regresiva para la inclusión de las personas con discapacidad',
          description:
            'El Cermi advierte en el III Congreso CREUP-CRUE de que la nueva Ley de Universidades puede suponer un retroceso en inclusión si no incorpora apoyos efectivos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/universidad/2022-03-02/los-profesores-ayudantes-doctor-ante-la-idea-de-formarse-para-ensenar-es-un-requisito-a-destiempo.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '2/03/2022',
      tagSlugs: ['university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los doctores que ejercen como profesores ayudantes, ante la idea de formarse para enseñar: «Es un requisito a destiempo»',
          description:
            'El debate sobre la formación docente del profesorado ayudante doctor sitúa a CREUP entre las organizaciones que defienden reforzar la preparación pedagógica universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-piden-gobierno-difunda-masivamente-cambios-plazos-solicitud-becas-20220224114715.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '24/02/2022',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'student-representation',
        'access-to-university',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden al Gobierno que difunda masivamente los cambios en los plazos de solicitud de las becas',
          description:
            'CREUP reclama al Gobierno una difusión masiva de los nuevos plazos de solicitud de becas para evitar que el estudiantado pierda el acceso a estas ayudas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/la-creup-consigue-mejoras-en-las-becas-del-ministerio-para-el-curso-2022-2023/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '23/02/2022',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La CREUP consigue mejoras en las becas del Ministerio para el curso 2022/2023',
          description:
            'CREUP valora avances en las becas del Ministerio para el curso 2022/2023, aunque mantiene la necesidad de seguir mejorando el sistema de ayudas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-s/mostrar/444481/estudiantes-creen-ley-convivencia-universitaria-no-respeta-acuerdo-sobre-papel-mediacion',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '17/02/2022',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-policy',
        'student-representation',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes creen que la Ley de Convivencia Universitaria «no respeta» el «acuerdo» sobre el papel de la mediación',
          description:
            'CREUP denuncia que la Ley de Convivencia Universitaria no respeta el acuerdo alcanzado sobre la mediación como mecanismo principal de resolución de conflictos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-ep/mostrar/20220217174619/estudiantes-piden-rectores-respetar-acuerdo-implantar-ley-convivencia-universitaria',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '17/02/2022',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden a los rectores respetar el acuerdo con ellos al implantar la Ley de Convivencia Universitaria',
          description:
            'El estudiantado reclama a las instituciones universitarias que respeten los acuerdos alcanzados con su representación durante la implantación de la Ley de Convivencia Universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.20minutos.es/noticia/4957719/0/universitrios-exigen-yolanda-diaz-participacion-elaboracion-futuro-estatuto-becario/',
      mediaOutletId: mediaOutlets['20-minutos'],
      publishedAt: '16/02/2022',
      tagSlugs: [
        'internships-employability',
        'student-representation',
        'student-economy',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios exigen a Yolanda Díaz que se les tenga en cuenta en la elaboración del Estatuto del Becario',
          description:
            'El estudiantado universitario reclama participar en la elaboración del Estatuto del Becario para que la reforma de las prácticas tenga en cuenta sus demandas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-piden-yolanda-diaz-comience-negociacion-estatuto-estudiante-practicas-20220215115600.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '15/02/2022',
      tagSlugs: [
        'internships-employability',
        'student-representation',
        'student-economy',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden a Yolanda Díaz que comience la negociación del Estatuto del Estudiante en Prácticas',
          description:
            'CREUP pide al Ministerio de Trabajo iniciar la negociación del Estatuto del Estudiante en Prácticas y acordar una posición común con el estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiarioalerta.com/articulo/agencias/estudiantes-piden-subirats-que-situe-centro-nueva-ley-universidades/20220121185416381876.html',
      mediaOutletId: mediaOutlets['el-diario-alerta'],
      publishedAt: '21/01/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden a Subirats que les sitúe «en el centro de la nueva Ley de Universidades»',
          description:
            'La representación estudiantil pide al ministro Joan Subirats que coloque al estudiantado en el centro de la nueva Ley de Universidades.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-subirats-traslada-estudiantes-voluntad-seguir-adelante-losu-repensar-algunos-temas-20220120134450.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '20/01/2022',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Subirats traslada a los estudiantes su «voluntad» de seguir adelante con la LOSU y de «repensar» algunos temas',
          description:
            'El ministro Joan Subirats comunica al estudiantado su voluntad de continuar con la LOSU y revisar algunos aspectos del proyecto universitario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/universidad/2022-01-05/el-ministerio-de-subirats-busca-su-propio-espacio.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '5/01/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'El ministerio de Subirats busca su propio espacio',
          description:
            'Joan Subirats inicia su etapa como ministro de Universidades con la intención de dar mayor visibilidad al departamento y abrir una nueva fase de interlocución con la comunidad universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-subirats-no-secunda-castells-defiende-existencia-ministerio-universidades-20220104144121.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '4/01/2022',
      tagSlugs: ['university-policy', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Subirats no secunda a Castells y defiende la existencia de un Ministerio de Universidades',
          description:
            'Joan Subirats defiende la existencia de un Ministerio de Universidades propio y anuncia que comenzará contactos con rectores, consejeros y estudiantes.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariojaen.es/espana/la-comunidad-educativa-universitaria-aboga-por-no-retrasar-las-clases-y-defiende-la-presencialidad-EM8196655',
      mediaOutletId: mediaOutlets['diario-jaen'],
      publishedAt: '3/01/2022',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'La comunidad educativa universitaria aboga por no retrasar las clases y defiende la presencialidad',
          description:
            'La comunidad educativa universitaria se muestra partidaria de no retrasar la vuelta tras las vacaciones de Navidad y de mantener la presencialidad con medidas de prevención.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.ondacero.es/noticias/espana/ministerios-educacion-sanidad-universidades-analizan-este-martes-regreso-aulas-vacaciones-navidad_2022010361d2fb4220b19a00012fc0c2.html',
      mediaOutletId: mediaOutlets['onda-cero'],
      publishedAt: '3/01/2022',
      tagSlugs: ['university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'El Gobierno mantiene su idea de la vuelta al cole presencial el 10 de enero',
          description:
            'El Gobierno mantiene la previsión de regreso presencial a las aulas el 10 de enero, tras analizar la situación sanitaria con las comunidades autónomas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-educacion-sanidad-universidades-analizan-manana-regreso-aulas-navidad-20220103122745.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '3/01/2022',
      tagSlugs: ['university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Educación, Sanidad y Universidades analizan mañana el regreso a las aulas tras la Navidad',
          description:
            'Sanidad, Educación y Universidades convocan una reunión conjunta con las comunidades autónomas para analizar el regreso a las aulas tras las vacaciones de Navidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-cvirus-universitarios-piden-no-retrasar-vuelta-clases-total-presencialidad-20220103142909.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '3/01/2022',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title: 'Universitarios piden no retrasar la vuelta a las clases y total presencialidad',
          description:
            'CREUP pide no retrasar la vuelta a las aulas tras Navidad y reclama que el regreso sea presencial, seguro y acompañado de protocolos revisados.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-reformas-universitarias-impulsadas-castells-retos-2022-subirats-ministro-20220102130248.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '2/01/2022',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Las reformas universitarias impulsadas por Castells, retos de 2022 con Subirats como ministro',
          description:
            'La LOSU y la Ley de Convivencia Universitaria quedan como principales retos universitarios para 2022 con Joan Subirats al frente del Ministerio.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-universitarios-piden-nuevo-ministro-subirats-reiniciar-ley-castells-20211220110006.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '20/12/2021',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes universitarios piden al nuevo ministro Subirats «reiniciar» la «Ley Castells»',
          description:
            'CREUP solicita a Joan Subirats reiniciar el proyecto de LOSU y volver a convocar las mesas de negociación para alcanzar acuerdos con la comunidad universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariosigloxxi.com/texto-ep/mostrar/20211220110006/estudiantes-universitarios-piden-nuevo-ministro-subirats-reiniciar-ley-castells',
      mediaOutletId: mediaOutlets['diario-siglo-xxi'],
      publishedAt: '20/12/2021',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes universitarios piden al nuevo ministro Subirats «reiniciar» la «Ley Castells»',
          description:
            'CREUP pide al nuevo ministro de Universidades reabrir la negociación de la LOSU al considerar que el proyecto no aporta avances suficientes para el estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elespanol.com/espana/20211220/joan-subirats-apela-consenso-asumir-ministro-universidades/636186697_0.html',
      mediaOutletId: mediaOutlets['el-espanol'],
      publishedAt: '20/12/2021',
      tagSlugs: ['university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Joan Subirats apela al «consenso» al asumir el cargo de nuevo ministro de Universidades',
          description:
            'Joan Subirats asume el Ministerio de Universidades apelando al consenso y a la continuidad del proyecto normativo iniciado por Manuel Castells.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-piden-nuevo-ministro-universidades-escuche-demandas-paso-desastroso-castells-20211216195751.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '16/12/2021',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes piden al nuevo ministro de Universidades que escuche sus demandas tras el paso «desastroso» de Castells',
          description:
            'Organizaciones estudiantiles piden a Joan Subirats que escuche sus reivindicaciones en la nueva LOSU y critican la gestión de Manuel Castells.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.que.es/2021/12/16/estudiantes-ministro-universidades-demandas/',
      mediaOutletId: mediaOutlets['que'],
      publishedAt: '16/12/2021',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes piden al nuevo ministro de Universidades que escuche sus demandas',
          description:
            'Representantes estudiantiles reclaman al nuevo ministro Joan Subirats que tenga en cuenta sus demandas en la redacción de la LOSU.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.abc.es/sociedad/abci-estudiantes-y-rectores-sublevan-contra-castells-y-dejan-reforma-universitaria-aire-202111181812_noticia.html',
      mediaOutletId: mediaOutlets['abc'],
      publishedAt: '18/11/2021',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes y rectores se sublevan contra Castells y dejan su reforma universitaria en el aire',
          description:
            'Estudiantes y rectores rechazan aspectos centrales de la reforma universitaria de Castells, con protestas estudiantiles y críticas de la CRUE al anteproyecto de LOSU.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-piden-ley-castells-inicie-camino-gratuidad-tasas-universitarias-20211019121958.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '19/10/2021',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'scholarships-funding',
        'student-economy',
        'access-to-university',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden que la «Ley Castells» inicie el camino hacia la gratuidad de las tasas universitarias',
          description:
            'CREUP y CEUNE piden que la LOSU incluya un sistema de financiación que permita avanzar hacia la gratuidad de los precios públicos universitarios.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/castells-rectifica-ley-universitaria-retira-propuestas-cuestionadas_1_8397036.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '16/10/2021',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Castells rectifica con la ley universitaria y retira algunas de sus propuestas más cuestionadas',
          description:
            'El Ministerio de Universidades retira varias propuestas de la LOSU que habían generado rechazo entre rectores, sindicatos y estudiantes para buscar mayor consenso.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2021-10-01/las-lineas-rojas-de-los-rectores-a-la-ley-castells-ni-plazas-fijas-para-asociados-ni-profesores-titulares-gobernando.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '1/10/2021',
      tagSlugs: ['university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Las líneas rojas de los rectores a la «Ley Castells»: ni plazas fijas para asociados ni profesores titulares gobernando',
          description:
            'La Conferencia de Rectores rechaza varios aspectos del anteproyecto de LOSU por considerar que invaden la autonomía universitaria y plantean medidas difíciles de aplicar.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-organizaciones-estudiantiles-denuncian-ley-castells-solo-sido-negociada-rectores-20210929170830.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '29/09/2021',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Organizaciones estudiantiles denuncian que la «Ley Castells» solo ha sido negociada con los rectores',
          description:
            'CREUP y CEUNE denuncian que el anteproyecto de LOSU ha sido negociado principalmente con la CRUE y reclaman un debate real con el estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.publico.es/sociedad/universidades-espanolas-avanzan-positivamente-sigue-existiendo-falta-financiacion-sobrecualificacion.html',
      mediaOutletId: mediaOutlets['publico'],
      publishedAt: '29/09/2021',
      tagSlugs: [
        'university-quality',
        'scholarships-funding',
        'internships-employability',
        'student-economy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Las universidades españolas avanzan positivamente, pero sigue existiendo falta de financiación y sobrecualificación',
          description:
            'El informe de la Fundación CYD apunta avances en la universidad española, pero mantiene como problemas la baja financiación, la limitada autonomía y la sobrecualificación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2021-09-25/los-refugios-impenitentes-de-las-novatadas-universitarias-engrudos-de-harina-vinagre-y-aceite-por-la-cabeza-para-hacer-amigos.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '25/09/2021',
      tagSlugs: ['rights-coexistence-equality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'Los refugios impenitentes de las novatadas universitarias: engrudos de harina, vinagre y aceite por la cabeza para hacer amigos',
          description:
            'El País analiza la persistencia de las novatadas universitarias y recoge la posición de CREUP sobre las relaciones de poder y las prácticas que pueden rozar el acoso.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.abc.es/sociedad/abci-estudiantes-rechazan-ley-castells-porque-supone-perdida-derechos-y-garantias-202109171029_noticia.html',
      mediaOutletId: mediaOutlets['abc'],
      publishedAt: '18/09/2021',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes rechazan de forma unánime la «ley Castells»: «Tiene partes antidemocráticas»',
          description:
            'ABC recoge el rechazo del CEUNE al anteproyecto de la LOSU por considerar que reduce derechos y garantías del estudiantado y merma su participación en la comunidad universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elsaltodiario.com/universidad/estudiantado-suspende-ley-universitaria-castells-losu-quieran-quitar-poder-decision-penoso',
      mediaOutletId: mediaOutlets['el-salto'],
      publishedAt: '16/09/2021',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Suspenso a la nueva ley universitaria por la pérdida de poder del estudiantado',
          description:
            'El Salto aborda las críticas estudiantiles al anteproyecto de la LOSU por la pérdida de peso del estudiantado en la gobernanza universitaria y la concentración de poder en otros órganos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.catalunyapress.es/texto-diario/mostrar/3156673/sindicatos-docentes-estudiantes-insatisfechos-losu-ministro-castells',
      mediaOutletId: mediaOutlets['catalunya-press'],
      publishedAt: '14/09/2021',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'university-quality',
        'scholarships-funding',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Sindicatos, docentes y estudiantes, insatisfechos con la LOSU del ministro Castells',
          description:
            'Catalunya Press recoge el malestar de sindicatos, docentes y estudiantes ante el anteproyecto de la LOSU y sus efectos sobre gobernanza, financiación y participación universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.esdiario.com/nacional/210914/75113/rebelion-estudiantil-castells-plantados-cataluna.html',
      mediaOutletId: mediaOutlets['esdiario'],
      publishedAt: '14/09/2021',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Rebelión estudiantil contra Castells por dejarles plantados para ir a Cataluña',
          description:
            'EsDiario informa del malestar estudiantil con el Ministerio de Universidades por la gestión del diálogo sobre la reforma universitaria y la reunión prevista con el estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2021-09-10/objetivo-de-la-universidad-para-el-nuevo-curso-retomar-la-plena-presencialidad.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '10/09/2021',
      tagSlugs: ['university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Objetivo de la universidad para el nuevo curso: retomar la plena presencialidad',
          description:
            'El País analiza el objetivo compartido por CRUE y CREUP de recuperar la presencialidad universitaria, condicionado por la situación sanitaria, las infraestructuras y los recursos disponibles.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.cope.es/actualidad/sociedad/noticias/estudiantes-valoran-que-ley-convivencia-universitaria-castigue-acoso-20210907_1486459',
      mediaOutletId: mediaOutlets['cope'],
      publishedAt: '7/09/2021',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes valoran que la Ley de Convivencia Universitaria castigue el acoso',
          description:
            'COPE recoge la valoración positiva del estudiantado ante una Ley de Convivencia Universitaria que incorpora sanciones contra el acoso y medidas de mediación en los campus.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-estudiantes-celebran-ley-convivencia-universitaria-porque-recoge-varias-propuestas-20210907193317.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '7/09/2021',
      tagSlugs: [
        'university-policy',
        'rights-coexistence-equality',
        'student-representation',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes celebran la Ley de Convivencia Universitaria porque recoge varias de sus propuestas',
          description:
            'Europa Press informa de que el estudiantado celebra que la Ley de Convivencia Universitaria recoja varias de sus propuestas, especialmente en mediación, acoso y derechos universitarios.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.rtve.es/play/audios/24-horas/creup-universidad-debe-seguir-avanzando-convivencia/6088584/',
      mediaOutletId: mediaOutlets['rtve'],
      publishedAt: '7/09/2021',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'CREUP: «La universidad debe seguir avanzando en convivencia»',
          description:
            'RTVE recoge la posición de CREUP sobre la necesidad de que la universidad siga avanzando en convivencia, mediación y protección de derechos dentro de la comunidad universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.abc.es/sociedad/abci-perder-beca-podria-suponer-doble-castigo-y-expulsion-universidad-motivos-economicos-y-no-academicos-202109041930_noticia.html',
      mediaOutletId: mediaOutlets['abc'],
      publishedAt: '5/09/2021',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'rights-coexistence-equality',
        'access-to-university',
      ],
      translations: [
        {
          locale: 'es',
          title:
            '«Perder la beca podría suponer un doble castigo y la expulsión de la universidad por motivos económicos y no académicos»',
          description:
            'ABC recoge las críticas estudiantiles a que determinadas sanciones puedan implicar la pérdida de becas, lo que podría expulsar de la universidad al alumnado por motivos económicos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.larazon.es/educacion/20210902/7yhzic542jajznz4bdquzfkbre.html',
      mediaOutletId: mediaOutlets['la-razon'],
      publishedAt: '2/09/2021',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Lluvia de críticas a la «Ley Castells» por «regresiva»',
          description:
            'La Razón recoge críticas al anteproyecto de la LOSU por considerarlo regresivo para la participación estudiantil, la gobernanza universitaria y determinados derechos del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://cadenaser.com/ser/2021/09/01/sociedad/1630484290_659207.html',
      mediaOutletId: mediaOutlets['cadena-ser'],
      publishedAt: '1/09/2021',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes y docentes rechazan el borrador de la nueva Ley de Universidades',
          description:
            'Cadena SER informa del rechazo de estudiantes y docentes al borrador de la LOSU, especialmente por los cambios en la elección de rector y la participación estudiantil.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-piden-gobierno-programa-becas-ue-nacionales-estudiantes-pdi-riesgo-20210831112237.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '31/08/2021',
      tagSlugs: [
        'scholarships-funding',
        'international-mobility',
        'rights-coexistence-equality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden al Gobierno un programa de becas de la UE y nacionales para estudiantes y PDI en riesgo',
          description:
            'Europa Press recoge la petición de CREUP de crear becas europeas y nacionales para estudiantado, PDI y agentes académicos afganos en situación de riesgo.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2021-08-31/el-gobierno-aprueba-el-anteproyecto-de-la-nueva-ley-de-universidades.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '31/08/2021',
      tagSlugs: ['university-policy', 'university-quality', 'internships-employability'],
      translations: [
        {
          locale: 'es',
          title:
            'Los profesores de Universidad con contrato temporal no podrán superar el 20% de la plantilla, según el anteproyecto de ley',
          description:
            'El País analiza el anteproyecto de la nueva Ley de Universidades, que limita la temporalidad del profesorado e introduce cambios en gobernanza, financiación y carrera académica.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-universitarios-oponen-nueva-ley-universidades-supondra-retroceso-derechos-estudiantiles-20210831181114.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '31/08/2021',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios se oponen a la nueva Ley de Universidades: «Supondrá un retroceso en los derechos estudiantiles»',
          description:
            'Europa Press recoge la oposición de CREUP al anteproyecto de la LOSU por considerar que supone un retroceso en derechos estudiantiles y en participación universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.vozpopuli.com/espana/universidades-covid-rectores.html',
      mediaOutletId: mediaOutlets['vozpopuli'],
      publishedAt: '27/08/2021',
      tagSlugs: ['university-life-wellbeing', 'rights-coexistence-equality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Los rectores avisan: pedir el «pasaporte covid» no es competencia de las universidades',
          description:
            'Vozpópuli aborda el debate sobre la posible exigencia del pasaporte covid en la universidad y recoge las limitaciones competenciales de los campus ante esta medida.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eleconomista.es/ecoaula/noticias/11348238/08/21/Las-becas-del-Ministerio-incluiran-reivindicaciones-del-estudiantado-para-el-curso-2021-22.html',
      mediaOutletId: mediaOutlets['el-economista'],
      publishedAt: '3/08/2021',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'rights-coexistence-equality',
        'access-to-university',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Las becas del Ministerio incluirán reivindicaciones del estudiantado para el curso 2021/22',
          description:
            'El Economista recoge que las becas del Ministerio incorporarán reivindicaciones del estudiantado, especialmente en materia de discapacidad, inclusión y justicia en el sistema de ayudas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://web.unican.es/noticias/Paginas/2021/julio_2021/presidenta-de-la-CREUP.aspx',
      mediaOutletId: mediaOutlets['universidad-de-cantabria'],
      publishedAt: '30/07/2021',
      tagSlugs: ['student-representation', 'university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'El rector Ángel Pazos se reúne con la presidenta de CREUP',
          description:
            'La Universidad de Cantabria informa de la reunión entre su rector, Ángel Pazos, y la presidenta de CREUP, Andrea Paricio, para abordar retos de la universidad pública española.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiarioalerta.com/articulo/agencias/universidad-salamanca-acoge-69-asamblea-creup/20210722114152201423.html',
      mediaOutletId: mediaOutlets['el-diario-alerta'],
      publishedAt: '22/07/2021',
      tagSlugs: [
        'student-representation',
        'university-policy',
        'internships-employability',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La Universidad de Salamanca acoge la 69.ª Asamblea de CREUP',
          description:
            'La Universidad de Salamanca acoge la 69.ª Asamblea de CREUP, un encuentro centrado en debatir posicionamientos sobre la actualidad universitaria, las prácticas académicas y la Ley de Convivencia Universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.salamanca24horas.com/universidad/universidad-salamanca-acoge-69-asamblea-representantes-estudiantiles-universidades-publicas_15005450_102.html',
      mediaOutletId: mediaOutlets['salamanca-24-horas'],
      publishedAt: '21/07/2021',
      tagSlugs: ['student-representation', 'university-life-wellbeing', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'La Universidad de Salamanca acoge la 69.ª asamblea de representantes estudiantiles de universidades públicas',
          description:
            'La Universidad de Salamanca reúne a 88 estudiantes de 25 universidades en la 69.ª Asamblea de CREUP, con medidas sanitarias reforzadas y participación institucional.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.magisnet.com/2021/07/campus-rural-para-universitarios-una-inmersion-emocional-academica-y-pagada/',
      mediaOutletId: mediaOutlets['magisterio'],
      publishedAt: '2/07/2021',
      tagSlugs: ['internships-employability', 'student-economy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Campus Rural para universitarios: una inmersión emocional, académica y pagada',
          description:
            'Magisterio explica el programa Campus Rural, una iniciativa de prácticas formativas remuneradas para acercar a estudiantes universitarios a municipios pequeños.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eleconomista.es/ecoaula/noticias/11303138/07/21/Crue-impulsa-junto-con-los-ministerios-de-Transicion-Ecologica-y-Reto-Demografico-y-de-Universidades-el-nuevo-Programa-Campus-Rural.html',
      mediaOutletId: mediaOutlets['el-economista'],
      publishedAt: '1/07/2021',
      tagSlugs: [
        'internships-employability',
        'student-economy',
        'university-life-wellbeing',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'CRUE impulsa junto con los ministerios de Transición Ecológica y Reto Demográfico y de Universidades el nuevo Programa Campus Rural',
          description:
            'El Economista recoge el impulso del programa Campus Rural, orientado a ofrecer al estudiantado universitario una experiencia formativa remunerada de inmersión en municipios rurales.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://exitoeducativo.net/david-lopez-maturen-creup-la-reforma-universitaria-podria-perjudicar-la-calidad-de-la-ensenanza/',
      mediaOutletId: mediaOutlets['exito-educativo'],
      publishedAt: '30/06/2021',
      tagSlugs: ['university-policy', 'university-quality', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'La reforma universitaria podría perjudicar la calidad de la enseñanza',
          description:
            'Éxito Educativo entrevista a David López Maturén, portavoz de CREUP, sobre el balance del curso universitario y los riesgos de la reforma universitaria para la calidad de la enseñanza.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-rectores-universitarios-continuaran-trabajando-juntos-calidad-sistema-universitario-20210622114034.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '22/06/2021',
      tagSlugs: [
        'university-quality',
        'student-representation',
        'university-policy',
        'scholarships-funding',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Rectores y universitarios continuarán trabajando juntos por la calidad del sistema universitario',
          description:
            'CRUE y CREUP renuevan su convenio marco de colaboración para trabajar conjuntamente por un sistema universitario social, de calidad y con financiación suficiente.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://cincodias.elpais.com/cincodias/2021/06/22/album/1624385376_838301.html#foto_gal_1',
      mediaOutletId: mediaOutlets['cinco-dias'],
      publishedAt: '22/06/2021',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CRUE y CREUP renuevan su marco de colaboración',
          description:
            'Cinco Días recoge la renovación del convenio de colaboración entre CRUE y CREUP para trabajar por un sistema universitario social y de calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.servimedia.es/noticias/1867479',
      mediaOutletId: mediaOutlets['servimedia'],
      publishedAt: '22/06/2021',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CRUE y CREUP renuevan su compromiso para trabajar por la calidad del sistema universitario',
          description:
            'Servimedia informa de la renovación del convenio entre CRUE y CREUP, centrado en educación, formación, cooperación solidaria y colaboración con organismos públicos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/acuerdo-entre-la-coordinadora-de-representantes-de-estudiantes-y-crue/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '22/06/2021',
      tagSlugs: ['university-quality', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP y CRUE renuevan su compromiso de colaboración para la mejora del sistema universitario',
          description:
            'Aula Magna recoge la renovación del convenio marco entre CREUP y CRUE para impulsar actuaciones conjuntas en favor de un sistema universitario social y de calidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/educacion/Paginas/2021/180621-foro_nuevo_curriculo.aspx',
      mediaOutletId: mediaOutlets['la-moncloa'],
      publishedAt: '18/06/2021',
      tagSlugs: ['student-representation', 'university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes y familiares protagonizan el cuarto foro de debate en torno al nuevo currículo organizado por el Ministerio de Educación y Formación Profesional',
          description:
            'La Moncloa informa del foro de estudiantes y familias, cuarto encuentro del ciclo «Nuevo currículo para nuevos desafíos», orientado a reflexionar sobre la reforma curricular.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.murcia.com/nacional/noticias/2021/06/18-estudiantes-y-familiares-protagonizan-el-cuarto-foro-de-debate-en-torno-al-nuevo-curriculo-organizad.asp',
      mediaOutletId: mediaOutlets['murcia-com'],
      publishedAt: '18/06/2021',
      tagSlugs: ['student-representation', 'university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes y familiares protagonizan el cuarto foro de debate en torno al nuevo currículo organizado por el Ministerio de Educación y Formación Profesional',
          description:
            'Murcia.com reproduce la información del Gobierno sobre el foro de estudiantes y familias dedicado a debatir la reforma curricular dentro del ciclo «Nuevo currículo para nuevos desafíos».',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20210614/7528436/argimon-insta-gobierno-permitir-mascarillas-dejen-obligatorias-exterior.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '14/06/2021',
      tagSlugs: [
        'international-mobility',
        'university-life-wellbeing',
        'student-economy',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Argimon insta al Gobierno a permitir que las mascarillas dejen de ser obligatorias en el exterior',
          description:
            'La Vanguardia recoge las peticiones de CREUP y ESN para flexibilizar la vacunación de estudiantes Erasmus y sufragar pruebas PCR o antígenos obligatorias.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.publico.es/sociedad/polemica-ebau-ebau-prueba-desigual-pasar-factura-ano-pandemia.html',
      mediaOutletId: mediaOutlets['publico'],
      publishedAt: '10/06/2021',
      tagSlugs: [
        'access-to-university',
        'rights-coexistence-equality',
        'university-quality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La EBAU, una prueba desigual que puede pasar factura en el año de la pandemia',
          description:
            'Público analiza las desigualdades de la EBAU y recoge la posición de CREUP a favor de un marco común de contenidos mínimos sin imponer una prueba única estatal.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.castelloninformacion.com/castello-uji-pago-pcr-consell-estudiantat-elisa-bisbal-vacunas-erasmus/',
      mediaOutletId: mediaOutlets['castellon-informacion'],
      publishedAt: '4/06/2021',
      tagSlugs: [
        'international-mobility',
        'student-economy',
        'university-life-wellbeing',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La Universitat Jaume I pagará las pruebas PCR a los estudiantes Erasmus el próximo curso 2021-22',
          description:
            'Castellón Información informa de la decisión de la UJI de sufragar pruebas PCR a estudiantes Erasmus y relaciona la medida con las reivindicaciones de CREUP y ESN España.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eleconomista.es/ecoaula/noticias/11249478/06/21/La-Ley-de-Convivencia-deja-fuera-a-las-universidades-privadas.html',
      mediaOutletId: mediaOutlets['el-economista'],
      publishedAt: '3/06/2021',
      tagSlugs: ['university-policy', 'rights-coexistence-equality', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'La Ley de Convivencia deja fuera a las universidades privadas',
          description:
            'El Economista analiza el anteproyecto de Ley de Convivencia Universitaria, una norma que actualiza el régimen sancionador universitario y deja fuera a las universidades privadas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://murciaeconomia.com/art/79639/fin-a-las-novatadas-las-universidades-expulsaran-a-los-que-participen',
      mediaOutletId: mediaOutlets['murcia-economia'],
      publishedAt: '25/05/2021',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Fin a las novatadas; las universidades expulsarán a quienes participen',
          description:
            'Murcia Economía explica que la futura Ley de Convivencia Universitaria contempla sanciones por novatadas, plagio, fraude académico y otras conductas graves dentro del ámbito universitario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://cadenaser.com/ser/2021/05/25/sociedad/1621929398_371359.html',
      mediaOutletId: mediaOutlets['cadena-ser'],
      publishedAt: '25/05/2021',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La Ley de Convivencia Universitaria sancionará el plagio y las novatadas',
          description:
            'Cadena SER informa de que el proyecto de Ley de Convivencia Universitaria prevé sanciones por plagio, novatadas, falsificación de actas y otras faltas muy graves.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.heraldo.es/noticias/aragon/2021/05/08/aragon-pone-en-marcha-en-septiembre-una-plataforma-para-valorar-la-ensenanza-hibrida-en-la-universidad-1490624.html',
      mediaOutletId: mediaOutlets['heraldo'],
      publishedAt: '8/05/2021',
      tagSlugs: ['university-quality', 'university-life-wellbeing', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Aragón pone en marcha en septiembre una plataforma para valorar la «enseñanza híbrida» en la universidad',
          description:
            'Heraldo informa de una plataforma online para evaluar la enseñanza híbrida en las universidades aragonesas y recoger la opinión del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.gndiario.com/becas-discapacidad-creup-estudiantes',
      mediaOutletId: mediaOutlets['gn-diario'],
      publishedAt: '17/04/2021',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'rights-coexistence-equality',
        'access-to-university',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La CREUP pide al Gobierno que se mejoren las becas para estudiantes con discapacidad',
          description:
            'GN Diario recoge las propuestas de CREUP para que las becas sean más justas e inclusivas, especialmente para estudiantes con discapacidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/cambio-condiciones-obtener-beca-duplica-beneficiarios-ayudas-maximas_1_7804592.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '14/04/2021',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'rights-coexistence-equality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La reforma de las becas dobla en un año el número de estudiantes que han conseguido las ayudas máximas',
          description:
            'elDiario.es analiza el impacto de la reforma de becas y recoge las demandas de CREUP sobre umbrales de renta, residencia, discapacidad y requisitos académicos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2021-04-14/el-numero-de-universitarios-con-becas-completas-se-dispara-en-tres-anos-de-90000-a-215000.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '14/04/2021',
      tagSlugs: ['scholarships-funding', 'student-economy', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'El número de universitarios con becas completas se dispara en tres años: de 90.000 a 215.000',
          description:
            'El País analiza el aumento de estudiantes universitarios con becas completas y recoge la preocupación del estudiantado por la suficiencia de la partida de ayudas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-gobierno-plantea-bajar-nota-becar-estudiantes-master-habilitantes-20210413132204.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '13/04/2021',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno plantea bajar a un 5 la nota para becar a estudiantes de másteres habilitantes',
          description:
            'Europa Press recoge que el Gobierno planteaba reducir a 5 la nota exigida para acceder a becas en másteres habilitantes, mientras CREUP defendía eliminar los requisitos académicos de las ayudas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.20minutos.es/noticia/4605733/0/las-claves-sobre-el-modelo-universitario-3-2-quien-lo-aprobo-en-que-consiste-y-por-que-genera-polemica/',
      mediaOutletId: mediaOutlets['20-minutos'],
      publishedAt: '3/03/2021',
      tagSlugs: ['university-policy', 'university-quality', 'student-economy'],
      translations: [
        {
          locale: 'es',
          title:
            'Las claves sobre el modelo universitario «3+2»: quién lo aprobó, en qué consiste y por qué genera polémica',
          description:
            '20 Minutos explica el modelo universitario «3+2», su origen normativo, su impacto en la estructura de grados y másteres y los motivos de la controversia generada.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.larazon.es/educacion/20210128/zfs6bnhkprhqdbnpwmt6py2qga.html',
      mediaOutletId: mediaOutlets['la-razon'],
      publishedAt: '28/01/2021',
      tagSlugs: [
        'university-quality',
        'university-life-wellbeing',
        'rights-coexistence-equality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes acusan a la universidad de «exigencias desmedidas» e «incapacidad de adaptarse a la era digital»',
          description:
            'La Razón recoge las críticas del estudiantado ante las condiciones de presencialidad y evaluación en la universidad durante la pandemia, señalando falta de adaptación digital.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/manuel-castells-enfrenta-a-la-crue-y-los-estudiantes-por-la-presencialidad-en-las-aulas/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '28/01/2021',
      tagSlugs: [
        'university-life-wellbeing',
        'university-quality',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La presencialidad en las universidades enfrenta a los universitarios',
          description:
            'Aula Magna aborda el desacuerdo entre representantes estudiantiles, CRUE y Ministerio de Universidades sobre la presencialidad en exámenes y actividad académica.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2021-01-27/examenes-presenciales-en-las-universidades-aulas-seguras-corrillos-de-estudiantes-en-las-puertas.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '27/01/2021',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Exámenes presenciales en las universidades: aulas seguras, peligro en las puertas',
          description:
            'El País analiza el debate sobre los exámenes presenciales en la universidad, distinguiendo entre la seguridad de las aulas y los riesgos de aglomeraciones en accesos y espacios comunes.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/ciencia/2021-01-19/son-las-universidades-focos-de-supercontagio.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '20/01/2021',
      tagSlugs: [
        'university-life-wellbeing',
        'university-quality',
        'rights-coexistence-equality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: '¿Son las universidades focos de supercontagio?',
          description:
            'El País revisa estudios sobre el potencial de las universidades como espacios de contagio y recoge la posición estudiantil favorable a reducir la presencialidad para evitar aglomeraciones.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eleconomista.es/ecoaula/noticias/10880570/11/20/El-62-de-los-estudiantes-abandonan-los-grados-online-.html',
      mediaOutletId: mediaOutlets['el-economista'],
      publishedAt: '12/11/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'El 62% de los estudiantes abandonan los grados «online»',
          description:
            'El Economista informa del elevado abandono en los grados «online», con una tasa notablemente superior a la registrada en universidades presenciales.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eleconomista.es/ecoaula/noticias/10882900/11/20/Como-afecta-la-modalidad-online-a-los-estudiantes-universitarios.html',
      mediaOutletId: mediaOutlets['el-economista'],
      publishedAt: '12/11/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: '¿Cómo afecta la modalidad «online» a los estudiantes universitarios?',
          description:
            'El Economista aborda el impacto de la modalidad «online» en el estudiantado universitario, con especial atención a la motivación y la experiencia académica.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2020-11-01/la-universidad-se-juega-el-desencanto-y-abandono-de-sus-nuevos-alumnos.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '2/11/2020',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title: 'La universidad se juega el desencanto y abandono de sus nuevos alumnos',
          description:
            'El País analiza el riesgo de desencanto y abandono entre el alumnado de nuevo ingreso en un contexto marcado por la docencia adaptada a la pandemia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'http://portal.uned.es/portal/page?_pageid=93,70855563&_dad=portal&_schema=PORTAL',
      mediaOutletId: mediaOutlets['uned'],
      publishedAt: '29/10/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'student-representation',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            '«No es cuestión de edad, sino de responsabilidad», Fernando Simón en la jornada de investigación sobre jóvenes y crisis sanitaria',
          description:
            'La UNED informa de una jornada sobre jóvenes y crisis sanitaria en la que se abordaron responsabilidad, participación juvenil y efectos sociales de la pandemia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.educaweb.com/noticia/2020/10/21/retos-universidad-coronavirus-19337/',
      mediaOutletId: mediaOutlets['educaweb'],
      publishedAt: '21/10/2020',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Los retos de la universidad ante la segunda ola de la pandemia',
          description:
            'Educaweb examina los retos universitarios ante la segunda ola de la pandemia, incluyendo presencialidad, docencia híbrida, seguridad y adaptación académica.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://acpua.aragon.es/es/noticias/acpua-estudiantes-la-acpua-se-reune-con-representantes-de-estudiantes-de-la-uz-y-de-todo-el',
      mediaOutletId: mediaOutlets['acpua'],
      publishedAt: '14/10/2020',
      tagSlugs: ['university-quality', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'La ACPUA se reúne con representantes de estudiantes de la UZ y de todo el Estado para hablar de calidad',
          description:
            'ACPUA informa de sus reuniones con representantes estudiantiles de la Universidad de Zaragoza y CREUP para tratar formación, evaluación y participación estudiantil en calidad universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2020-10-13/la-segunda-ola-interrumpe-las-clases-presenciales-de-300000-universitarios.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '14/10/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'university-quality',
        'student-economy',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La segunda ola interrumpe las clases presenciales de 300.000 universitarios',
          description:
            'El País informa del cierre temporal de campus en Cataluña, Valencia y Granada, y recoge la preocupación de CREUP por la calidad de la docencia y la brecha digital.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.murcia.com/noticias/2020/10/05-unas-jornadas-analizaran-la-situacion-actual-de-los-jovenes-murcianos-tras-la-pandemia.asp',
      mediaOutletId: mediaOutlets['murcia-com'],
      publishedAt: '5/10/2020',
      tagSlugs: ['university-life-wellbeing', 'student-economy', 'rights-coexistence-equality'],
      translations: [
        {
          locale: 'es',
          title:
            'Unas jornadas analizarán la situación actual de los jóvenes murcianos tras la pandemia',
          description:
            'Murcia.com informa de unas jornadas dedicadas a analizar la situación de la juventud murciana tras la pandemia y sus efectos sociales, educativos y económicos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://elpais.com/elpais/2020/09/18/eps/1600439946_949830.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '27/09/2020',
      tagSlugs: ['university-quality', 'university-policy', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'La universidad dice adiós al siglo XX',
          description:
            'El País Semanal aborda la transformación de la universidad tras la pandemia y el debate sobre digitalización, docencia y adaptación del sistema universitario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.redaccionmedica.com/secciones/estudiantes/el-ceem-se-integra-en-el-maximo-organo-de-representacion-universitaria-6727',
      mediaOutletId: mediaOutlets['redaccion-medica'],
      publishedAt: '21/09/2020',
      tagSlugs: ['student-representation', 'university-policy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'El CEEM se integra en el máximo órgano de representación universitaria',
          description:
            'Redacción Médica informa del convenio por el que el Consejo Estatal de Estudiantes de Medicina se integra en CREUP para coordinar reivindicaciones del estudiantado de Medicina.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-universidades-publicas-piden-nuevo-modelo-becas-participar-estatuto-personal-docente-20200917153446.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '17/09/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'university-policy',
        'student-representation',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes de universidades públicas piden un nuevo modelo de becas y participar en el Estatuto del Personal Docente',
          description:
            'Europa Press recoge las demandas de CREUP para avanzar hacia un nuevo modelo de becas y participar en el futuro Estatuto del Personal Docente e Investigador.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/creup-se-reune-con-los-grupos-parlamentarios-durante-el-inicio-de-curso/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '17/09/2020',
      tagSlugs: ['student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP se reúne con los grupos parlamentarios durante el inicio de curso',
          description:
            'Aula Magna informa de las reuniones de CREUP con grupos parlamentarios para trasladar sus prioridades al comienzo del curso universitario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/donaciones-privadas-universidad-publica-polemica-explotada-via-apunta-ministro-castells_1_6220008.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '14/09/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Las donaciones privadas a la universidad pública: la polémica y poco explotada vía a la que apunta el ministro Castells',
          description:
            'elDiario.es analiza la financiación privada de la universidad pública y recoge las cautelas del estudiantado para que no sustituya a una financiación pública suficiente.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/catalunya/manuel-castells-ministro-imprevisible-curso-universitario-dificil_1_6206022.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '8/09/2020',
      tagSlugs: ['university-policy', 'university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Manuel Castells, el ministro más imprevisible ante el curso universitario más difícil',
          description:
            'elDiario.es perfila la gestión de Manuel Castells ante un curso universitario marcado por la incertidumbre sanitaria, la presencialidad y la adaptación docente.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.uv.es/uvweb/uv-noticies/es/noticias/universitat-acoge-encuentro-creup-1285973304159/Novetat.html?id=1286142424353&plantilla=UV_Noticies%2FPage%2FTPGDetaillNews',
      mediaOutletId: mediaOutlets['universitat-de-valencia'],
      publishedAt: '3/09/2020',
      tagSlugs: [
        'student-representation',
        'university-policy',
        'university-life-wellbeing',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La Universitat de València acoge el encuentro de CREUP',
          description:
            'La Universitat de València informa de la reunión de la comisión ejecutiva ampliada de CREUP para preparar propuestas ante el inicio del curso universitario durante la pandemia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.vozpopuli.com/espana/universidad-protocolo-residencia-colegio_0_1387961457.html',
      mediaOutletId: mediaOutlets['vozpopuli'],
      publishedAt: '2/09/2020',
      tagSlugs: ['university-life-wellbeing', 'rights-coexistence-equality', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Los protocolos universitarios se «olvidan» de las residencias y colegios mayores',
          description:
            'Vozpópuli informa de la ausencia de protocolos específicos para residencias y colegios mayores en el inicio del curso universitario durante la pandemia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20200901/483255153286/universitarios-universidad-covid-medidas-seguridad.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '1/09/2020',
      tagSlugs: ['university-life-wellbeing', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Los universitarios llevarán mascarilla obligatoria dentro y fuera del aula',
          description:
            'La Vanguardia recoge las medidas acordadas para el curso universitario, incluida la mascarilla obligatoria dentro y fuera del aula.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2020-08-31/el-ministro-al-que-le-gusta-salir-en-la-foto-solo-a-veces.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '1/09/2020',
      tagSlugs: ['university-policy', 'university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Manuel Castells, el ministro fuera de combate',
          description:
            'El País analiza el papel de Manuel Castells ante el inicio del curso universitario y las críticas por su gestión en un contexto de elevada incertidumbre.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/creup-lanza-sus-demandas-para-el-nuevo-curso-academico/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '31/08/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'university-quality',
        'rights-coexistence-equality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'CREUP lanza sus demandas para el nuevo curso académico',
          description:
            'Aula Magna recoge las demandas de CREUP para el curso 2020/2021, centradas en protocolos de seguridad, evaluación continua, accesibilidad universal y garantías de calidad docente.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.que.es/2020/08/31/universitarios-piden-priorizar-evaluacion-continua/',
      mediaOutletId: mediaOutlets['que'],
      publishedAt: '31/08/2020',
      tagSlugs: ['university-quality', 'rights-coexistence-equality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden priorizar la evaluación continua y garantizar el acceso a los materiales',
          description:
            'Qué! informa de las propuestas de CREUP para el inicio del curso, entre ellas priorizar la evaluación continua y garantizar el acceso del estudiantado a los materiales de cada asignatura.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lanzadigital.com/castilla-la-mancha/estudiantes-universitarios-piden-que-se-priorice-la-evaluacion-continua-y-se-garantice-el-acceso-a-los-materiales/',
      mediaOutletId: mediaOutlets['lanza-digital'],
      publishedAt: '31/08/2020',
      tagSlugs: [
        'university-quality',
        'student-economy',
        'internships-employability',
        'rights-coexistence-equality',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios piden que se priorice la evaluación continua y se garantice el acceso a los materiales',
          description:
            'Lanza Digital recoge que CREUP pide evaluación continua, acceso permanente a materiales, alternativas para prácticas y trabajos finales y medidas para reducir brechas socioeconómicas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/local/asturias/20200831/483232848823/estudiantes-universitarios-piden-priorizar-la-evaluacion-continua-y-garantizar-el-acceso-a-los-materiales.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '31/08/2020',
      tagSlugs: [
        'student-representation',
        'university-quality',
        'university-life-wellbeing',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios piden priorizar la evaluación continua y garantizar el acceso a los materiales',
          description:
            'La Vanguardia recoge la petición de CREUP de participar en las decisiones sobre protocolos universitarios y de priorizar la evaluación continua ante la incertidumbre del inicio de curso.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-estudiantes-universitarios-piden-priorizar-evaluacion-continua-garantizar-acceso-materiales-20200831143307.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '31/08/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes universitarios piden priorizar la evaluación continua y garantizar el acceso a los materiales',
          description:
            'Europa Press informa de que CREUP reclamó evaluación continua, acceso flexible a materiales, planes de contingencia y participación estudiantil en las directrices del nuevo curso.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elespanol.com/espana/20200826/pellas-castells-ministro-dudas-millones-universitarios/515699671_0.html',
      mediaOutletId: mediaOutlets['el-espanol'],
      publishedAt: '26/08/2020',
      tagSlugs: ['university-policy', 'university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Las «pellas» de Castells: dónde está el ministro ante las dudas de 1,5 millones de universitarios',
          description:
            'El Español aborda la ausencia pública de Manuel Castells ante la incertidumbre del regreso universitario y las dudas de alrededor de 1,5 millones de estudiantes.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/local/madrid/20200810/482771483432/colectivo-estudiantil-cree-que-contratar-a-una-empresa-para-el-rastreo-desmonta-la-peticion-de-voluntarios-de-la-ucm.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '10/08/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Colectivo estudiantil cree que contratar a una empresa para el rastreo desmonta la petición de voluntarios de la UCM',
          description:
            'La Vanguardia recoge la crítica de CREUP a la petición de rastreadores voluntarios de la UCM tras la contratación de una empresa privada para esas labores en Madrid.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://cadenaser.com/ser/2020/08/04/sociedad/1596537956_978021.html',
      mediaOutletId: mediaOutlets['cadena-ser'],
      publishedAt: '4/08/2020',
      tagSlugs: [
        'university-quality',
        'university-life-wellbeing',
        'student-economy',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudiantes de universidades públicas critican la gestión online: «Nos hemos convertido casi en autodidactas»',
          description:
            'Cadena SER analiza las críticas estudiantiles a la gestión de la docencia online durante la pandemia, marcada por brecha digital, comunicación inestable y falta de adaptación docente.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/madrid/noticia-colectivo-estudiantil-cree-contratar-empresa-rastreo-desmonta-peticion-voluntarios-ucm-20200810183450.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '10/08/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'university-policy',
        'student-representation',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Colectivo estudiantil cree que contratar a una empresa para el rastreo desmonta la petición de voluntarios de la UCM',
          description:
            'Europa Press recoge que CREUP considera incoherente solicitar rastreadores voluntarios universitarios mientras la Comunidad de Madrid adjudicaba el servicio a una empresa privada.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/sociedad/2020-08-02/dos-carreras-en-asturias-o-galicia-por-el-precio-de-una-en-cataluna-o-madrid.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '3/08/2020',
      tagSlugs: [
        'student-economy',
        'scholarships-funding',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Dos carreras en Asturias o Galicia por el precio de una en Cataluña o Madrid',
          description:
            'El País analiza las fuertes diferencias de precios públicos universitarios entre comunidades autónomas y el impacto de la reducción progresiva de tasas impulsada por Universidades.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.heraldo.es/noticias/nacional/2020/07/11/toman-impulso-las-carreras-online-por-el-coronavirus-1385464.html',
      mediaOutletId: mediaOutlets['heraldo'],
      publishedAt: '11/07/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: '¿Toman impulso las carreras «online» por el coronavirus?',
          description:
            'Heraldo analiza si la experiencia de docencia y evaluación online durante la pandemia puede aumentar el interés por estudiar grados y másteres a distancia o en modalidad híbrida.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20200711/482232091066/toman-impulso-las-carreras-online-por-el-coronavirus.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '11/07/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: '¿Toman impulso las carreras «online» por el coronavirus?',
          description:
            'La Vanguardia recoge un análisis de EFE sobre el posible impulso de la formación universitaria online tras el confinamiento y la adaptación forzada de clases y exámenes.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lanzadigital.com/general/los-estudiantes-universitarios-piden-mecanismos-y-garantias-para-que-la-docencia-online-sea-de-calidad/',
      mediaOutletId: mediaOutlets['lanza-digital'],
      publishedAt: '11/06/2020',
      tagSlugs: [
        'university-quality',
        'university-life-wellbeing',
        'access-to-university',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los estudiantes universitarios piden «mecanismos» y «garantías» para que la docencia online sea de «calidad»',
          description:
            'Lanza Digital recoge que CREUP y CANAE pidieron garantías para una docencia online de calidad, atención a necesidades particulares y medidas específicas para el estudiantado de primer curso.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/educacion/2020-06-11/el-gobierno-plantea-que-los-alumnos-roten-para-ir-a-la-universidad-el-curso-proximo.html?ssm=TW_CM',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '11/06/2020',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno plantea que los alumnos roten para ir a la universidad el curso próximo',
          description:
            'El País explica las recomendaciones de Universidades para una presencialidad adaptada, con rotación de alumnado, mascarillas, distancia interpersonal y docencia híbrida.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://cincodias.elpais.com/cincodias/2020/06/01/extras/1591028412_399190.html',
      mediaOutletId: mediaOutlets['cinco-dias'],
      publishedAt: '1/06/2020',
      tagSlugs: ['university-quality', 'internships-employability', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'La creatividad y la tecnología auxilian a las titulaciones más prácticas',
          description:
            'Cinco Días analiza cómo simulaciones, realidad virtual y recursos docentes ayudaron a adaptar titulaciones con alto componente práctico durante el cierre de aulas y laboratorios.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.ilfattoquotidiano.it/2020/05/24/coronavirus-spagna-via-il-requisito-di-merito-e-alzata-la-soglia-del-reddito-per-accedere-alle-borse-di-studio-i-beneficiari-raddoppieranno/5809653/',
      mediaOutletId: mediaOutlets['il-fatto-quotidiano'],
      publishedAt: '24/05/2020',
      tagSlugs: ['scholarships-funding', 'student-economy', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title:
            'Coronavirus, España: se elimina el requisito de mérito y sube el umbral de renta para acceder a becas. Los beneficiarios se duplicarán',
          description:
            'Il Fatto Quotidiano informa sobre la reforma española de becas durante la pandemia, con eliminación de requisitos académicos y aumento de umbrales de renta para ampliar beneficiarios.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://elpais.com/elpais/2020/05/28/actualidad/1590657337_591514.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '31/05/2020',
      tagSlugs: ['university-quality', 'internships-employability', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Cómo crear e innovar sin laboratorios ni aulas',
          description:
            'El País aborda la adaptación de carreras sanitarias y técnicas durante la pandemia, especialmente aquellas con prácticas que dependen de laboratorios, talleres o equipamiento específico.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/sociedad/2020-05-29/los-rectores-no-contemplan-ensenar-100-presencial-ni-en-el-mejor-escenario.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '30/05/2020',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Los rectores no contemplan enseñar 100% presencial ni en el mejor escenario',
          description:
            'El País recoge que CRUE trabajaba con escenarios híbridos para septiembre, con parte de la docencia teórica en remoto y prácticas o seminarios presenciales en grupos reducidos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'http://www.canalsur.es/radio/es-legal-la-monitorizacion-de-los-estudiantes-universitarios-durante-sus-examenes-en-casa/1583517.html',
      mediaOutletId: mediaOutlets['canal-sur'],
      publishedAt: '15/05/2020',
      tagSlugs: ['rights-coexistence-equality', 'university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: '¿Es legal la monitorización de los estudiantes durante sus exámenes en casa?',
          description:
            'Canal Sur aborda la monitorización de exámenes online, con intervención de Carol García, de CREUP, y un análisis jurídico sobre grabación, vigilancia y protección de datos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.moncloa.com/2020/05/19/cje-insuficiente-reforma-becas-168900/',
      mediaOutletId: mediaOutlets['moncloa-com'],
      publishedAt: '19/05/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'El CJE considera «insuficiente» la reforma de becas anunciada',
          description:
            'Moncloa.com recoge la valoración del CJE sobre la reforma de becas, considerada positiva pero insuficiente, y la demanda de agilizar el pago de las ayudas al estudio.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/sociedad/2020-05-19/el-vertigo-de-un-abandono-masivo-de-las-aulas.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '20/05/2020',
      tagSlugs: [
        'student-economy',
        'scholarships-funding',
        'access-to-university',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'El vértigo de un abandono masivo de las aulas',
          description:
            'El País analiza el riesgo de abandono educativo por motivos económicos tras la pandemia y las reformas de becas destinadas a contener la deserción del alumnado vulnerable.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.diariodeleon.es/nacional/200520/407422/estudiantes-valoran-subida-piden-adelantar-pago.html',
      mediaOutletId: mediaOutlets['diario-de-leon'],
      publishedAt: '20/05/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Los estudiantes valoran la subida pero piden adelantar el pago',
          description:
            'Diario de León recoge que asociaciones de estudiantes y ONG valoraron la reforma de becas, aunque pidieron adelantar los pagos y mejorar la gestión de las ayudas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/estudiantes-ong-valoran-subida-adelantar_1_5988036.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '21/05/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes y ONG valoran la subida en becas pero piden adelantar el pago',
          description:
            'Asociaciones estudiantiles y ONG valoran positivamente la reforma de las becas, pero reclaman adelantar los pagos para que las ayudas lleguen antes de que las familias asuman el gasto.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/quieromisapuntes-una-campana-para-hacer-frente-a-los-examenes/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '4/05/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'student-economy',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            '#QuieroMisApuntes: los estudiantes solicitan poder desplazarse a sus pisos y residencias',
          description:
            'CREUP impulsa la campaña #QuieroMisApuntes para reclamar que el estudiantado pueda desplazarse a recoger materiales, apuntes y equipos necesarios para afrontar la evaluación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://theobjective.com/further/sociedad/2020-04-30/asi-van-ser-las-evaluaciones-online-en-la-universidad-por-el-coronavirus/',
      mediaOutletId: mediaOutlets['the-objective'],
      publishedAt: '4/05/2020',
      tagSlugs: [
        'university-quality',
        'rights-coexistence-equality',
        'student-economy',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Así van a ser las evaluaciones online en la universidad por el coronavirus',
          description:
            'El artículo analiza el debate sobre cómo realizar las evaluaciones universitarias online, con especial atención a la vigilancia, la desigualdad de medios y las alternativas a los exámenes finales.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/sociedad/2020-04-30/los-universitarios-se-rebelan-no-se-dan-las-condiciones-para-examinarse.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '4/05/2020',
      tagSlugs: [
        'university-quality',
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'student-economy',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Los universitarios se rebelan: «No se dan las condiciones para examinarse»',
          description:
            'El estudiantado universitario cuestiona las condiciones de evaluación durante la pandemia y denuncia que no existen garantías suficientes para examinarse en igualdad de condiciones.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.bolsamania.com/noticias/educacion/el-consejo-de-universitarios-denuncia-la-imposicion-de-examenes-desproporcionados-grabados-con-camaras--7450370.html',
      mediaOutletId: mediaOutlets['bolsamania'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-quality',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El Consejo de Universitarios denuncia la imposición de exámenes «desproporcionados» grabados con cámaras',
          description:
            'El CEUNE denuncia la imposición de exámenes telemáticos con medidas de vigilancia y grabación que considera desproporcionadas y contrarias a la intimidad del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.educaweb.com/noticia/2020/04/20/claves-como-acabara-curso-escolar-19155/',
      mediaOutletId: mediaOutlets['educaweb'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'university-quality',
        'university-life-wellbeing',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Las claves sobre cómo acabará el curso',
          description:
            'Educaweb resume las medidas para cerrar el curso 2019-2020, incluyendo la adaptación de la evaluación universitaria a medios no presenciales y la consulta al estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lanzadigital.com/castilla-la-mancha/el-ministro-castells-urge-a-las-universidades-a-consultar-con-los-alumnos-los-criterios-para-hacer-los-examenes-online/',
      mediaOutletId: mediaOutlets['lanza-digital'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'student-representation',
        'university-quality',
        'university-life-wellbeing',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El ministro Castells urge a las universidades a consultar con los alumnos los criterios para hacer los exámenes online',
          description:
            'El Ministerio de Universidades insta a las universidades a consultar con el estudiantado los criterios para realizar exámenes online y adaptar la evaluación a la situación sanitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://revistanuve.com/ministro-de-universidades-se-reune-con-estudiantes/',
      mediaOutletId: mediaOutlets['revista-nuve'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'student-representation',
        'university-policy',
        'university-life-wellbeing',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Ministro de Universidades se reúne con estudiantes',
          description:
            'El ministro de Universidades se reúne con representantes del CEUNE y de CREUP para abordar la finalización telemática del curso y la situación del estudiantado durante la crisis sanitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/el-ceune-se-muestra-contario-a-la-grabacion-de-los-examenes-online/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-quality',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Los estudiantes se posicionan contra la grabación online durante los exámenes',
          description:
            'CEUNE y CREUP se muestran contrarios a sistemas de grabación y vigilancia durante los exámenes online por considerar que invaden la intimidad del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/local/asturias/20200428/48787423369/universitarios-exigen-la-eliminacion-de-los-criterios-academicos-como-requisito-para-obtener-una-beca.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios exigen la eliminación de los criterios académicos como requisito para obtener una beca',
          description:
            'CREUP reclama eliminar los criterios académicos para acceder a becas y pide medidas urgentes para evitar que miles de estudiantes abandonen la universidad por motivos económicos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-exigen-eliminacion-criterios-academicos-requisito-obtener-beca-20200428145905.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios exigen la eliminación de los criterios académicos como requisito para obtener una beca',
          description:
            'CREUP exige eliminar los criterios académicos para obtener becas y advierte de que las consecuencias económicas de la pandemia pueden expulsar a estudiantes de la universidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/la-creup-senala-que-miles-de-estudiantes-tendran-que-dejar-la-universidad-si-no-se-modifican-las-becas-y-tasas/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La CREUP señala que miles de estudiantes tendrán que dejar la Universidad si no se modifican las becas y tasas',
          description:
            'CREUP advierte de que la crisis económica derivada de la COVID-19 agravará el coste de estudiar y reclama modificar becas, tasas y ayudas para evitar abandonos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elboletin.com/los-estudiantes-advierten-de-un-aluvion-de-abandonos-en-la-universidad-publica/',
      mediaOutletId: mediaOutlets['el-boletin'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Los estudiantes advierten de un aluvión de abandonos en la Universidad pública',
          description:
            'CREUP alerta de que muchas familias no podrán asumir el coste de los estudios universitarios y pide al Gobierno actuar para evitar abandonos masivos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.infolibre.es/politica/universitarios-exigen-eliminacion-criterios-academicos-requisito-obtener-beca_1_1182558.html',
      mediaOutletId: mediaOutlets['infolibre'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios exigen la eliminación de los criterios académicos como requisito para obtener una beca',
          description:
            'CREUP defiende que los criterios académicos en las becas excluyen a estudiantes con menos recursos y reclama priorizar la situación económica en el acceso a las ayudas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.larazon.es/salud/20200428/q6bm3kqrubha5knqeb2rvgatfa.html',
      mediaOutletId: mediaOutlets['la-razon'],
      publishedAt: '29/04/2020',
      tagSlugs: ['university-life-wellbeing', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title: 'Así son los científicos que convivirán con el Covid-19',
          description:
            'La Razón recoge la experiencia de estudiantes de Ingeniería Biomédica durante la crisis sanitaria y cómo la pandemia transformó su vida universitaria y su relación con la ciencia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-consejo-estudiantes-universitarios-denuncia-imposicion-examenes-desproporcionados-grabados-camaras-20200428130031.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'rights-coexistence-equality',
        'university-quality',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El Consejo de Estudiantes Universitarios denuncia la imposición de exámenes «desproporcionados» grabados con cámaras',
          description:
            'El CEUNE denuncia que algunos centros universitarios imponen exámenes online con grabación y vigilancia, y reclama alternativas de evaluación proporcionadas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/estudiantes-universidad-coronavirus_1_5875465.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'university-quality',
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'student-economy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            '20 preguntas en 30 minutos: cómo evaluar y evitar fraudes sigue en el centro del debate universitario',
          description:
            'La evaluación universitaria online centra el debate por la combinación de pruebas aceleradas, vigilancia digital, riesgo de fraude y desigualdad de condiciones entre estudiantes.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/canariasahora/sociedad/alumnado-ulpgc-cuenta-decisiones-invisibles_1_1215752.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'student-representation',
        'university-policy',
        'university-quality',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'El alumnado de la ULPGC exige en las redes que se le tenga en cuenta para tomar decisiones: «Somos invisibles»',
          description:
            'El alumnado de la ULPGC denuncia en redes sociales que no se le está teniendo suficientemente en cuenta en la toma de decisiones académicas durante la pandemia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lasexta.com/noticias/nacional/estudiantes-universitarios-pie-guerra-sistema-evaluacion-injusto-coronavirus_202004205e9dd918cea68900015ea487.html',
      mediaOutletId: mediaOutlets['lasexta'],
      publishedAt: '29/04/2020',
      tagSlugs: [
        'university-quality',
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'student-economy',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios, en pie de guerra ante un sistema de evaluación que consideran «injusto»',
          description:
            'El estudiantado universitario denuncia problemas de docencia y evaluación online durante el confinamiento, y CREUP reclama modelos justos, inclusivos y respetuosos con la intimidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elconfidencial.com/espana/2020-04-21/castells-curso-universitario-incidencias_2557711/',
      mediaOutletId: mediaOutlets['el-confidencial'],
      publishedAt: '25/04/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'university-quality',
        'university-policy',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Castells sigue sin despejar la incógnita del curso universitario y las incidencias crecen',
          description:
            'El artículo aborda la incertidumbre sobre el cierre del curso universitario, las incidencias en la docencia online y las recomendaciones del Ministerio de Universidades.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elimparcial.es/noticia/212387/sociedad/el-curso-universitario-acabara-segun-los-plazos-previstos-y-con-prioridad-online.html',
      mediaOutletId: mediaOutlets['el-imparcial'],
      publishedAt: '25/04/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'El curso universitario acabará según los plazos previstos y con prioridad online',
          description:
            'El ministro de Universidades defiende que el curso finalizará en los plazos previstos y que la docencia y la evaluación deberán adaptarse prioritariamente al formato online.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-piden-gobierno-les-permita-volver-residencias-recoger-apuntes-ordenadores-20200422103142.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '25/04/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'student-economy',
        'university-quality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden al Gobierno que se les permita volver a sus residencias para recoger apuntes y ordenadores',
          description:
            'Organizaciones estudiantiles piden un mecanismo común para que el alumnado pueda recoger apuntes, ordenadores y materiales necesarios para completar el curso a distancia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-piden-gobierno-les-permita-volver-residencias-recoger-apuntes-ordenadores-20200422103142.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '22/04/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'student-economy',
        'university-quality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden al Gobierno que se les permita volver a sus residencias para recoger apuntes y ordenadores',
          description:
            'CREUP y CEUNE reclaman al Gobierno una solución común para permitir desplazamientos seguros del estudiantado que necesita recuperar materiales académicos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/formacion/20200420/48628610521/universidades-deberan-consultar-alumnos-metodos-evaluacion-online.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '21/04/2020',
      tagSlugs: ['student-representation', 'university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Las universidades deberán consultar con los alumnos los métodos de evaluación online',
          description:
            'El Ministerio de Universidades insta a las universidades a consultar al estudiantado antes de fijar los criterios generales de evaluación no presencial.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elconfidencial.com/espana/2020-04-21/castells-curso-universitario-incidencias_2557711/',
      mediaOutletId: mediaOutlets['el-confidencial'],
      publishedAt: '21/04/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'university-quality',
        'university-policy',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Castells sigue sin despejar la incógnita del curso universitario y las incidencias crecen',
          description:
            'El artículo analiza las dudas abiertas sobre el final del curso universitario, los problemas técnicos de la enseñanza online y el papel de la evaluación continua.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/sociedad/2020-04-15/gobierno-y-comunidades-discuten-como-becar-a-los-universitarios-empobrecidos-por-el-coronavirus.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '21/04/2020',
      tagSlugs: [
        'scholarships-funding',
        'student-economy',
        'access-to-university',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Las Administraciones se conjuran para rescatar a los estudiantes empobrecidos',
          description:
            'El Gobierno y las comunidades autónomas estudian fórmulas para becar a estudiantes afectados económicamente por la pandemia, aunque sus rentas de 2019 no reflejen su situación actual.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-castells-urge-universidades-consultar-alumnos-criterios-hacer-examenes-online-20200419183750.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '21/04/2020',
      tagSlugs: [
        'student-representation',
        'university-quality',
        'university-policy',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Castells urge a las universidades a consultar con los alumnos los criterios para hacer los exámenes online',
          description:
            'El Ministerio de Universidades pide a los centros que consulten con el estudiantado las condiciones de los exámenes online antes de cerrar los criterios de evaluación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/carolina-garcia-creup-expone-el-papel-de-los-estudiantes-en-la-crisis/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '21/04/2020',
      tagSlugs: [
        'student-representation',
        'university-policy',
        'university-quality',
        'university-life-wellbeing',
        'scholarships-funding',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Carolina García: «Muchas veces solo se nos tiene en cuenta para hacernos una consulta no vinculante o para informarnos»',
          description:
            'Carolina García, presidenta en funciones de CREUP, reclama participación efectiva del estudiantado en las decisiones sobre docencia, evaluación y medidas de apoyo durante la crisis sanitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://amp.lasexta.com/noticias/nacional/estudiantes-universitarios-pie-guerra-sistema-evaluacion-injusto-coronavirus_202004205e9dd918cea68900015ea487.html?__twitter_impression=true',
      mediaOutletId: mediaOutlets['lasexta'],
      publishedAt: '21/04/2020',
      tagSlugs: [
        'university-quality',
        'rights-coexistence-equality',
        'university-life-wellbeing',
        'student-economy',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Los universitarios, en pie de guerra ante un sistema de evaluación que consideran «injusto»',
          description:
            'El estudiantado denuncia incertidumbre, brecha digital y criterios de evaluación desiguales; CREUP rechaza sistemas de vigilancia invasivos durante los exámenes online.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20200419/48616540173/estudiantes-quieren-opinar-sobre-modelos-de-evaluacion-en-las-universidades.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '20/04/2020',
      tagSlugs: ['student-representation', 'university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Estudiantes quieren opinar sobre modelos de evaluación en las universidades',
          description:
            'El estudiantado reclama participar en la definición de los modelos de evaluación universitaria durante la pandemia, ante la adaptación urgente a formatos no presenciales.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lanzadigital.com/castilla-la-mancha/3-000-estudiantes-de-la-uclm-ya-disponen-de-un-salvoconducto-para-viajar-a-recoger-sus-pertenencias-y-acabar-el-curso/',
      mediaOutletId: mediaOutlets['lanza-digital'],
      publishedAt: '19/04/2020',
      tagSlugs: [
        'university-life-wellbeing',
        'student-economy',
        'university-quality',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La UCLM pide a Interior que reconsidere su decisión y resuelva la situación de miles de estudiantes que necesitan recoger sus pertenencias',
          description:
            'La UCLM, CRUE y CREUP piden al Ministerio del Interior que permita desplazamientos ordenados para que el estudiantado pueda recoger materiales necesarios para terminar el curso.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://cadenaser.com/emisora/2020/04/18/ser_ciudad_real/1587200955_157737.html',
      mediaOutletId: mediaOutlets['cadena-ser'],
      publishedAt: '19/04/2020',
      tagSlugs: ['university-life-wellbeing', 'student-economy', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Suspendido el salvoconducto de la UCLM para que el alumnado pueda recoger los apuntes',
          description:
            'La UCLM comunica la suspensión de los salvoconductos para recoger apuntes y materiales tras el cambio de criterio sobre los desplazamientos durante el estado de alarma.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/sociedad/2020-04-09/las-universidades-publicas-calificaran-con-trabajos-preguntas-cortas-o-reflexivas-y-videoconferencias.html?outputType=amp',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '10/04/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title:
            'Las universidades públicas calificarán con trabajos, preguntas cortas o reflexivas y videoconferencias',
          description:
            'Las universidades públicas preparan fórmulas de evaluación no presencial mediante trabajos, preguntas reflexivas, videoconferencias y mecanismos adaptados a la situación de confinamiento.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-universitarios-piden-fomentar-evaluacion-continua-dificultad-realizar-examenes-presenciales-20200406123716.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '7/04/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden fomentar la evaluación continua ante la dificultad de realizar exámenes presenciales',
          description:
            'CREUP propone flexibilizar la evaluación del curso y priorizar la evaluación continua ante la dificultad de celebrar exámenes presenciales durante la pandemia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/local/asturias/20200406/48346834126/universitarios-piden-fomentar-la-evaluacion-continua-ante-la-dificultad-de-realizar-examenes-presenciales.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '7/04/2020',
      tagSlugs: ['university-quality', 'university-life-wellbeing', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden fomentar la evaluación continua ante la dificultad de realizar exámenes presenciales',
          description:
            'CREUP plantea flexibilizar la evaluación universitaria y facilitar la superación de asignaturas mediante evaluación continua ante las limitaciones provocadas por la COVID-19.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://elpais.com/sociedad/2020-04-02/el-ministro-de-universidades-da-por-concluidas-las-clases-presenciales-en-las-facultades.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '2/04/2020',
      tagSlugs: ['university-life-wellbeing', 'university-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Una treintena de universidades no volverán a las clases presenciales este curso',
          description:
            'Las universidades españolas empiezan a confirmar que no retomarán las clases presenciales por la pandemia y preparan la finalización del curso con docencia y evaluación en línea.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/esn-y-creup-piden-facilidades-para-aplicar-la-clausula-de-fuerza-mayor/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '26/03/2020',
      tagSlugs: [
        'international-mobility',
        'student-economy',
        'university-life-wellbeing',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'ESN y CREUP piden facilidades para aplicar la cláusula de fuerza mayor',
          description:
            'CREUP y ESN España solicitan flexibilidad para el estudiantado Erasmus afectado por la suspensión de clases y la crisis sanitaria internacional.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-organizaciones-estudiantes-pide-ayudas-erasmus-afectados-suspension-clases-coronavirus-20200326173541.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '26/03/2020',
      tagSlugs: [
        'international-mobility',
        'scholarships-funding',
        'student-economy',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Organizaciones de estudiantes piden ayudas para los «Erasmus» afectados por la suspensión de clases por el coronavirus',
          description:
            'Organizaciones estudiantiles reclaman medidas de apoyo y ayudas para quienes realizan movilidad Erasmus y se han visto afectados por la suspensión de la actividad académica.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eldiario.es/sociedad/Organizaciones-estudiantiles-cancelar-estancias-Erasmus_0_999850742.html',
      mediaOutletId: mediaOutlets['eldiario-es'],
      publishedAt: '1/03/2020',
      tagSlugs: ['international-mobility', 'university-life-wellbeing', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title: 'Organizaciones estudiantiles animan a no cancelar las estancias Erasmus',
          description:
            'Las organizaciones estudiantiles recomiendan no cancelar de forma precipitada las estancias Erasmus y piden coordinación institucional ante la evolución de la pandemia.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20200212/473492856020/asociaciones-de-estudiantes-piden-poder-participar-en-el-proyecto-de-universidades-europeas.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '21/02/2020',
      tagSlugs: [
        'international-mobility',
        'student-representation',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Asociaciones de estudiantes piden poder participar en el proyecto de Universidades Europeas',
          description:
            'CREUP y ESN reclaman que la participación estudiantil sea incorporada a las iniciativas de Universidades Europeas y a la construcción del Espacio Europeo de Educación.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.aulamagna.com.es/creup-y-esn-creen-que-la-participacion-estudiantil-debe-ser-la-base-de-las-iniciativas-europeas/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '21/02/2020',
      tagSlugs: [
        'international-mobility',
        'student-representation',
        'scholarships-funding',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP y ESN creen que la participación estudiantil debe ser la base de las iniciativas europeas',
          description:
            'CREUP y ESN España defienden que el estudiantado participe en la toma de decisiones de las iniciativas europeas y reclaman más financiación pública para Erasmus+.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://elpais.com/sociedad/2020/02/10/actualidad/1581336852_880580.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '13/02/2020',
      tagSlugs: [
        'access-to-university',
        'university-policy',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'La reforma de selectividad se aplaza y cada autonomía corregirá a su manera',
          description:
            'La comisión técnica sobre la selectividad queda aplazada por el parón electoral, manteniendo las diferencias autonómicas en contenidos y criterios de corrección.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/formacion/20200210/473431408101/becas-erasmus-reino-unido-union-europea-estudiantes-universidad-brexit.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '13/02/2020',
      tagSlugs: [
        'international-mobility',
        'scholarships-funding',
        'student-economy',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title: 'El futuro incierto de las becas Erasmus tras el Brexit',
          description:
            'La salida del Reino Unido de la Unión Europea genera incertidumbre sobre el futuro de las becas Erasmus, aunque las movilidades concedidas hasta diciembre quedan garantizadas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'http://www.diarioveterinario.com/texto-diario/mostrar/1650959/universidades-espanolas-comprometen-luchar-contra-cambio-climatico',
      mediaOutletId: mediaOutlets['diario-veterinario'],
      publishedAt: '13/12/2019',
      tagSlugs: ['university-policy', 'university-quality', 'university-life-wellbeing'],
      translations: [
        {
          locale: 'es',
          title: 'Las universidades españolas se comprometen a luchar contra el cambio climático',
          description:
            'Las universidades españolas suscriben un compromiso frente al cambio climático y reivindican su responsabilidad institucional, científica y formativa ante este reto.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20191209/472135267066/universitarios-reclaman-mas-financiacion-del-estado-y-las-ccaa-para-erasmus.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '13/12/2019',
      tagSlugs: [
        'international-mobility',
        'scholarships-funding',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios reclaman más financiación del Estado y las comunidades autónomas para Erasmus+',
          description:
            'Representantes universitarios reclaman una mayor cofinanciación estatal y autonómica del programa Erasmus+ para hacerlo más equitativo e inclusivo.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eleconomista.es/ecoaula/noticias/10244673/12/19/ESN-Espana-y-CREUP-piden-un-aumento-de-la-cofinanciacion-nacional-y-autonomica-para-Erasmus.html',
      mediaOutletId: mediaOutlets['el-economista'],
      publishedAt: '13/12/2019',
      tagSlugs: [
        'international-mobility',
        'scholarships-funding',
        'student-economy',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'ESN España y CREUP piden un aumento de la cofinanciación nacional y autonómica para Erasmus+',
          description:
            'ESN España y CREUP reclaman incrementar la cofinanciación nacional y autonómica de Erasmus+ para reducir desigualdades en el acceso a la movilidad internacional.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20191107/471443766148/universidades-y-estudiantes-piden-al-gobierno-que-ayude-a-triplicar-la-financiacion-del-programa-erasmus.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '9/11/2019',
      tagSlugs: [
        'international-mobility',
        'scholarships-funding',
        'student-representation',
        'university-policy',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Universidades y estudiantes piden al Gobierno que ayude a triplicar la financiación del programa Erasmus',
          description:
            'Universidades y representantes estudiantiles solicitan al Gobierno que apoye en Bruselas la propuesta para triplicar la financiación de Erasmus+ 2021-2027.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.elcorreo.com/sociedad/educacion/gobierno-primer-paso-20191018172843-ntrc.html',
      mediaOutletId: mediaOutlets['el-correo'],
      publishedAt: '19/10/2019',
      tagSlugs: [
        'access-to-university',
        'university-policy',
        'university-quality',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'El Gobierno da el primer paso para lograr una selectividad más homogénea',
          description:
            'El Gobierno impulsa un grupo de trabajo para revisar el modelo de selectividad y avanzar hacia criterios más homogéneos entre comunidades autónomas.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.revistanuve.com/grupo-de-trabajo-revisara-las-nuevas-pruebas-de-acceso-a-la-universidad/',
      mediaOutletId: mediaOutlets['revista-nuve'],
      publishedAt: '18/10/2019',
      tagSlugs: [
        'access-to-university',
        'student-representation',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Grupo de trabajo revisará las nuevas pruebas de acceso a la universidad',
          description:
            'El grupo de trabajo sobre las pruebas de acceso a la universidad abordará la revisión del modelo y la participación del estudiantado en el proceso.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://elpais.com/sociedad/2019/10/17/actualidad/1571335657_313511.html',
      mediaOutletId: mediaOutlets['el-pais'],
      publishedAt: '18/10/2019',
      tagSlugs: [
        'access-to-university',
        'student-representation',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Una comisión revisará el contenido y la forma de corregir la selectividad',
          description:
            'Gobierno, comunidades autónomas, rectores y estudiantes participarán en una comisión técnica para revisar el contenido y los criterios de corrección de la selectividad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.eleconomista.es/ecoaula/noticias/10144812/10/19/El-Gobierno-contara-con-los-estudiantes-para-evaluar-el-actual-modelo-de-la-Selectividad.html',
      mediaOutletId: mediaOutlets['el-economista'],
      publishedAt: '17/10/2019',
      tagSlugs: ['access-to-university', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno contará con los estudiantes para evaluar el actual modelo de la selectividad',
          description:
            'El Gobierno prevé incorporar a representantes del estudiantado en el grupo de trabajo encargado de evaluar y corregir el modelo actual de selectividad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.galiciapress.es/texto-diario/mostrar/1600713/gobierno-central-incluira-alumnado-grupo-trabajo-revisara-actual-modelo-selectividad',
      mediaOutletId: mediaOutlets['galicia-press'],
      publishedAt: '16/10/2019',
      tagSlugs: ['access-to-university', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno central incluirá al alumnado en el grupo de trabajo que revisará el actual modelo de selectividad',
          description:
            'El Gobierno central incluirá al alumnado en el grupo de trabajo que revisará el modelo de selectividad, tras las demandas de participación del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20191016/471026655780/el-gobierno-contara-con-los-estudiantes-para-evaluar-el-actual-modelo-de-la-selectividad.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '16/10/2019',
      tagSlugs: ['access-to-university', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno contará con los estudiantes para evaluar el actual modelo de la selectividad',
          description:
            'El Gobierno contará con representantes estudiantiles para revisar el modelo de selectividad y responder a las demandas de participación trasladadas por CREUP.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/noticia-gobierno-contara-estudiantes-evaluar-actual-modelo-selectividad-20191016162128.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '16/10/2019',
      tagSlugs: ['access-to-university', 'student-representation', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'El Gobierno contará con los estudiantes para evaluar el actual modelo de la Selectividad',
          description:
            'El Gobierno invitará a representantes de estudiantes universitarios y de Bachillerato al grupo de trabajo encargado de evaluar y corregir el modelo de Selectividad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.magisnet.com/2019/10/universitarios-formaran-parte-del-grupo-de-trabajo-para-debatir-sobre-la-ebau/',
      mediaOutletId: mediaOutlets['magisterio'],
      publishedAt: '16/10/2019',
      tagSlugs: [
        'access-to-university',
        'student-representation',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Universitarios formarán parte del grupo de trabajo para debatir sobre la EBAU',
          description:
            'Representantes universitarios y de Bachillerato participarán en el grupo de trabajo que revisará el modelo de la EBAU, tras la petición de CREUP de contar con la voz del estudiantado.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'http://www.aulamagna.com.es/creup-pide-la-inclusion-de-los-estudiantes-en-la-reforma-de-selectividad/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '16/10/2019',
      tagSlugs: [
        'access-to-university',
        'student-representation',
        'university-policy',
        'university-quality',
      ],
      translations: [
        {
          locale: 'es',
          title: 'CREUP pide la inclusión de los estudiantes en la reforma de selectividad',
          description:
            'CREUP reclama que el estudiantado forme parte del grupo de trabajo sobre la reforma de la selectividad para que la revisión del modelo incorpore la perspectiva de quienes realizan la prueba.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'http://www.aulamagna.com.es/creup-denuncia-el-bloqueo-a-la-financiaicon-de-las-asociaciones/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '7/10/2019',
      tagSlugs: ['student-representation', 'scholarships-funding', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'CREUP denuncia el bloqueo a la financiación de las asociaciones',
          description:
            'CREUP denuncia el retraso en la convocatoria de subvenciones para asociaciones estudiantiles y alerta del impacto que tiene sobre la actividad asociativa universitaria.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-denuncian-bloqueo-politico-tiene-paralizadas-subvenciones-organizaciones-estudiantes-20191004171634.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '4/10/2019',
      tagSlugs: ['student-representation', 'scholarships-funding', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios denuncian que el «bloqueo político» tiene paralizadas las subvenciones a organizaciones de estudiantes',
          description:
            'CREUP denuncia que el bloqueo político mantiene paralizada la convocatoria de subvenciones a asociaciones juveniles y federaciones de estudiantes, una financiación que considera imprescindible.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'http://www.aulamagna.com.es/reunion-creup-grupos-parlamentarios/',
      mediaOutletId: mediaOutlets['aula-magna'],
      publishedAt: '12/09/2019',
      tagSlugs: [
        'university-policy',
        'student-representation',
        'scholarships-funding',
        'student-economy',
        'internships-employability',
        'rights-coexistence-equality',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'CREUP incide en la importancia de que el estudiantado participe en la negociación de la nueva Ley de Universidades',
          description:
            'CREUP subraya ante los grupos parlamentarios la necesidad de incluir al estudiantado en la negociación de la nueva Ley Orgánica de Universidades y abordar becas, tasas, prácticas y régimen disciplinario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-universitarios-piden-psoe-pp-cs-modificacion-reglamento-disciplinario-franquista-vigente-1954-20190912191927.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '12/09/2019',
      tagSlugs: ['university-policy', 'rights-coexistence-equality', 'student-representation'],
      translations: [
        {
          locale: 'es',
          title:
            'Universitarios piden a PSOE, PP y Cs la modificación del reglamento disciplinario franquista vigente desde 1954',
          description:
            'CREUP solicita a PSOE, PP, Ciudadanos y partidos nacionalistas la reforma del Reglamento de Disciplina Académica de 1954 y más participación estudiantil en la nueva Ley de Universidades.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-representantes-sector-universitario-piden-sanchez-busque-gran-pacto-nueva-ley-universidades-20190830175701.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '30/08/2019',
      tagSlugs: ['university-policy', 'student-representation', 'university-quality'],
      translations: [
        {
          locale: 'es',
          title:
            'Representantes del sector universitario piden a Sánchez que busque un gran pacto para una nueva ley de universidades',
          description:
            'Representantes del sector universitario reclaman a Pedro Sánchez una nueva ley de universidades basada en un gran pacto entre agentes, instituciones y partidos políticos.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.ondacero.es/emisoras/baleares/mallorca/noticias/observatorio-integracion-inmigrantes-refugiados-podria-instalarse-palma_201908095d4d64430cf26c378b18ffca.html',
      mediaOutletId: mediaOutlets['onda-cero'],
      publishedAt: '9/08/2019',
      tagSlugs: [
        'rights-coexistence-equality',
        'access-to-university',
        'international-mobility',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Un observatorio de integración de inmigrantes y refugiados podría instalarse en Palma',
          description:
            'CREUP y la Red Española de Inmigración estudian instalar en Palma una sede del Observatorio de integración de población migrante y refugiada en el sistema universitario español.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.20minutos.es/noticia/3728696/0/representantes-red-espanola-inmigracion-coordinadora-universidades-publicas-creup-se-reunen-con-cort/',
      mediaOutletId: mediaOutlets['20-minutos'],
      publishedAt: '9/08/2019',
      tagSlugs: [
        'rights-coexistence-equality',
        'access-to-university',
        'international-mobility',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Representantes de Red Española de Inmigración y la Coordinadora de las Universidades Públicas CREUP se reúnen con Cort',
          description:
            'Representantes de la Red Española de Inmigración y de CREUP se reúnen con el Ayuntamiento de Palma para presentar el Observatorio sobre integración de población migrada y refugiada en la universidad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/sociedad/educacion-00468/noticia-red-espanola-inmigracion-creup-constituyen-primer-observatorio-migracion-universidad-20190809173658.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '9/08/2019',
      tagSlugs: [
        'rights-coexistence-equality',
        'access-to-university',
        'international-mobility',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'La Red Española de Inmigración y CREUP constituyen el primer Observatorio de Migración y Universidad',
          description:
            'CREUP y la Red Española de Inmigración constituyen el primer Observatorio de Migración y Universidad para analizar el acceso y permanencia de la población migrante en estudios superiores.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl: 'https://www.servimedia.es/noticias/1162414',
      mediaOutletId: mediaOutlets['servimedia'],
      publishedAt: '9/08/2019',
      tagSlugs: [
        'rights-coexistence-equality',
        'access-to-university',
        'international-mobility',
        'university-life-wellbeing',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title: 'Constituido el primer Observatorio de Migración y Universidad en España',
          description:
            'CREUP y la Red Española de Inmigración pondrán en marcha el primer Observatorio de Migración y Universidad para abordar la falta de datos sobre acceso de personas migrantes a estudios superiores.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/illes-balears/noticia-representantes-red-espanola-inmigracion-coordinadora-universidades-publicas-creup-reunen-cort-20190809144800.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '9/08/2019',
      tagSlugs: [
        'rights-coexistence-equality',
        'access-to-university',
        'international-mobility',
        'student-representation',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Representantes de Red Española de Inmigración y la Coordinadora de las Universidades Públicas CREUP se reúnen con Cort',
          description:
            'CREUP y la Red Española de Inmigración se reúnen con representantes del Ayuntamiento de Palma para presentar el Observatorio de integración de población migrada y refugiada en el sistema universitario.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.europapress.es/illes-balears/noticia-estudian-instalar-sede-observatorio-integracion-poblacion-migrante-refugiada-universidad-20190809125626.html',
      mediaOutletId: mediaOutlets['europa-press'],
      publishedAt: '9/08/2019',
      tagSlugs: [
        'rights-coexistence-equality',
        'access-to-university',
        'international-mobility',
        'university-life-wellbeing',
      ],
      translations: [
        {
          locale: 'es',
          title:
            'Estudian instalar una sede del observatorio de integración de la población migrante y refugiada en la Universidad',
          description:
            'CREUP plantea la posibilidad de instalar en Palma una sede física del observatorio sobre integración de población migrante y refugiada en la universidad por el simbolismo mediterráneo de la ciudad.',
        },
      ],
    },
    {
      type: 'media_appearance',
      image: null,
      pdfUrl: null,
      externalUrl:
        'https://www.lavanguardia.com/vida/20190713/463436378644/universitarios-creen-que-a-la-bonificacion-de-creditos-deben-unirse-mas-becas.html',
      mediaOutletId: mediaOutlets['la-vanguardia'],
      publishedAt: '13/07/2019',
      tagSlugs: ['scholarships-funding', 'student-economy', 'access-to-university'],
      translations: [
        {
          locale: 'es',
          title: 'Universitarios creen que a la bonificación de créditos deben unirse más becas',
          description:
            'Representantes estudiantiles valoran positivamente la bonificación de créditos universitarios, pero reclaman un sistema de becas suficiente para cubrir gastos de material, transporte y vivienda.',
        },
      ],
    },
  ] as const

  const { generatePressSlug } = await import('../server/utils/core/slug')
  const buildPressDocumentPdfPath = createPressDocumentPdfPathBuilder()

  for (let i = 0; i < pressData.length; i++) {
    const item = pressData[i]
    const esTranslation = item.translations.find((t) => t.locale === 'es')!
    const publishedAtDate =
      'publishedAt' in item && item.publishedAt
        ? parseSpanishDate(item.publishedAt)
        : new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const publishedAt = dateValueToDateOnly(publishedAtDate)

    await db.transaction(async (tx) => {
      const slug = await generatePressSlug(esTranslation.title, publishedAtDate, {
        executor: tx,
      })

      const [article] = await tx
        .insert(schema.pressArticles)
        .values({
          type: item.type,
          slug,
          image: item.image,
          pdfUrl:
            'hasPdf' in item && item.hasPdf
              ? buildPressDocumentPdfPath(esTranslation.title, publishedAtDate)
              : null,
          externalUrl: item.externalUrl,
          mediaOutletId: item.mediaOutletId,
          active: true,
          publishedAt,
        })
        .returning()

      await tx.insert(schema.pressArticleTranslations).values(
        item.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          contentHtml: 'contentHtml' in t ? sanitizeRichTextHtml(t.contentHtml) : null,
          pressArticleId: article.id,
        }))
      )

      if (item.tagSlugs && item.tagSlugs.length > 0) {
        for (const tagSlug of item.tagSlugs) {
          if (tags[tagSlug]) {
            await tx.insert(schema.pressArticleTags).values({
              pressArticleId: article.id,
              tagId: tags[tagSlug],
            })
          }
        }
      }
    })
  }

  console.log('🔗 Creating featured links...')
  const featuredLinksData = [
    {
      image: buildHomeImagePath(
        HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        'Manual de Identidad Corporativa'
      ),
      to: '/transparencia/mic/',
      translations: [
        { locale: 'es', title: 'Manual de Identidad Corporativa' },
        { locale: 'en', title: 'Corporate Identity Manual' },
        { locale: 'ca', title: "Manual d'Identitat Corporativa" },
      ],
    },
    {
      image: buildHomeImagePath(
        HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        'Suscríbete a nuestra Newsletter'
      ),
      to: '/prensa/newsletter/',
      translations: [
        { locale: 'es', title: 'Suscríbete a nuestra Newsletter' },
        { locale: 'en', title: 'Subscribe to our Newsletter' },
        { locale: 'ca', title: 'Subscriu-te a la nostra Newsletter' },
      ],
    },
    {
      image: buildHomeImagePath(
        HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        'Igualdad y prevención del acoso'
      ),
      to: '/transparencia/igualdad',
      translations: [
        { locale: 'es', title: 'Igualdad y prevención del acoso' },
        { locale: 'en', title: 'Equality and Harassment Prevention' },
        { locale: 'ca', title: "Igualtat i prevenció de l'assetjament" },
      ],
    },
    {
      image: buildHomeImagePath(
        HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        'Estatuto del Estudiante Universitario'
      ),
      to: 'https://www.boe.es/buscar/doc.php?id=BOE-A-2010-20147',
      translations: [
        { locale: 'es', title: 'Estatuto del Estudiante Universitario' },
        { locale: 'en', title: 'University Student Statute' },
        { locale: 'ca', title: "Estatut de l'Estudiant Universitari" },
      ],
    },
    {
      image: buildHomeImagePath(
        HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        'Becas y ayudas para el estudiantado'
      ),
      to: 'https://www.becaseducacion.gob.es/',
      translations: [
        { locale: 'es', title: 'Becas y ayudas para el estudiantado' },
        { locale: 'en', title: 'Scholarships and Student Aid' },
        { locale: 'ca', title: "Beques i ajudes per a l'estudiantat" },
      ],
    },
    {
      image: buildHomeImagePath(
        HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        "European Students' Union (ESU)"
      ),
      to: 'https://www.esu-online.org/',
      translations: [
        { locale: 'es', title: "European Students' Union (ESU)" },
        { locale: 'en', title: "European Students' Union (ESU)" },
        { locale: 'ca', title: "European Students' Union (ESU)" },
      ],
    },
  ]

  for (let i = 0; i < featuredLinksData.length; i++) {
    const item = featuredLinksData[i]
    const [link] = await db
      .insert(schema.featuredLinks)
      .values({
        image: item.image,
        to: item.to,
        order: i,
      })
      .returning()

    await db.insert(schema.featuredLinkTranslations).values(
      item.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        featuredLinkId: link.id,
      }))
    )
  }

  console.log('⚖️ Creating equality documents...')
  const equalityDocumentsData = [
    {
      pdfUrl: `${EQUALITY_DOCUMENTS_PUBLIC_PATH}/posicionamiento-igualdad-diversidad.pdf`,
      translations: [
        {
          locale: 'es',
          title: 'Posicionamiento político en materia de Igualdad y Diversidad',
          description:
            'Nuestro documento marco sobre igualdad, diversidad, discriminaciones en la universidad y medidas que reclamamos a las instituciones públicas.',
          meta: 'Documento político · Igualdad y diversidad',
        },
        {
          locale: 'en',
          title: 'Policy position on Equality and Diversity',
          description:
            'Our core document on equality, diversity, discrimination in universities, and the measures we call for from public institutions.',
          meta: 'Policy document · Equality and diversity',
        },
        {
          locale: 'ca',
          title: "Posicionament polític en matèria d'Igualtat i Diversitat",
          description:
            'El nostre document marc sobre igualtat, diversitat, discriminacions a la universitat i mesures que reclamem a les institucions públiques.',
          meta: 'Document polític · Igualtat i diversitat',
        },
      ],
    },
    {
      pdfUrl: `${EQUALITY_DOCUMENTS_PUBLIC_PATH}/protocolo-de-prevencion-y-actuacion-frente-a-casos-de-acoso.pdf`,
      translations: [
        {
          locale: 'es',
          title: 'Protocolo de prevención y actuación frente a casos de acoso sexual',
          description:
            'Aprobado en la 77.ª Asamblea General Ordinaria, recoge medidas preventivas, principios de confidencialidad, el funcionamiento del Punto Seguro y el procedimiento de actuación ante conductas contrarias a la libertad sexual.',
          meta: '77.ª Asamblea General Ordinaria · 4 de abril de 2025',
        },
        {
          locale: 'en',
          title: 'Protocol for prevention and response to sexual harassment cases',
          description:
            'Approved at the 77th Ordinary General Assembly, it sets out preventive measures, confidentiality principles, how the Safe Point works, and the response procedure for conduct against sexual freedom.',
          meta: '77th Ordinary General Assembly · April 4, 2025',
        },
        {
          locale: 'ca',
          title: "Protocol de prevenció i actuació davant casos d'assetjament sexual",
          description:
            "Aprovat a la 77a Assemblea General Ordinària, recull mesures preventives, principis de confidencialitat, el funcionament del Punt Segur i el procediment d'actuació davant conductes contràries a la llibertat sexual.",
          meta: "77a Assemblea General Ordinària · 4 d'abril de 2025",
        },
      ],
    },
    {
      pdfUrl: `${EQUALITY_DOCUMENTS_PUBLIC_PATH}/protocolo-discriminacion-creup.pdf`,
      translations: [
        {
          locale: 'es',
          title: 'Protocolo de prevención y actuación frente a casos de discriminación',
          description:
            'Aprobado en la 77.ª Asamblea General Ordinaria, define supuestos de discriminación, garantías, Punto Seguro y niveles de intervención ante violencia o acoso por diversidad.',
          meta: '77.ª Asamblea General Ordinaria · 4 de abril de 2025',
        },
        {
          locale: 'en',
          title: 'Protocol for prevention and response to discrimination cases',
          description:
            'Approved at the 77th Ordinary General Assembly, it defines situations of discrimination, safeguards, the Safe Point, and response levels for violence or harassment linked to diversity.',
          meta: '77th Ordinary General Assembly · April 4, 2025',
        },
        {
          locale: 'ca',
          title: 'Protocol de prevenció i actuació davant casos de discriminació',
          description:
            "Aprovat a la 77a Assemblea General Ordinària, defineix supòsits de discriminació, garanties, Punt Segur i nivells d'intervenció davant violència o assetjament per diversitat.",
          meta: "77a Assemblea General Ordinària · 4 d'abril de 2025",
        },
      ],
    },
    {
      pdfUrl: `${EQUALITY_DOCUMENTS_PUBLIC_PATH}/guia-comunicacion-inclusiva.pdf`,
      translations: [
        {
          locale: 'es',
          title: 'Guía de Comunicación Inclusiva',
          description:
            'Recoge recomendaciones prácticas sobre lenguaje, recursos visuales y criterios de accesibilidad para una comunicación más inclusiva.',
          meta: 'Guía práctica · Lenguaje, visualidad y accesibilidad',
        },
        {
          locale: 'en',
          title: 'Inclusive Communication Guide',
          description:
            'Practical recommendations on language, visual resources, and accessibility for more inclusive communication.',
          meta: 'Practical guide · Language, visuals, and accessibility',
        },
        {
          locale: 'ca',
          title: 'Guia de Comunicació Inclusiva',
          description:
            "Recull recomanacions pràctiques sobre llenguatge, recursos visuals i criteris d'accessibilitat per a una comunicació més inclusiva.",
          meta: 'Guia pràctica · Llenguatge, visualitat i accessibilitat',
        },
      ],
    },
  ]

  for (let i = 0; i < equalityDocumentsData.length; i++) {
    const item = equalityDocumentsData[i]
    const [document] = await db
      .insert(schema.equalityDocuments)
      .values({
        pdfUrl: item.pdfUrl,
        order: i,
        active: true,
      })
      .returning()

    await db.insert(schema.equalityDocumentTranslations).values(
      item.translations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        description: translation.description,
        meta: translation.meta,
        equalityDocumentId: document.id,
      }))
    )
  }

  console.log('📊 Creating financial reports...')
  await db.delete(schema.financialReports)

  const financialReportsData: FinancialReportSeed[] = [
    {
      title: 'Informe Económico del XI Stage Formativo',
      approvedAt: new Date('2025-04-04'),
    },
    {
      title: 'Informe Económico de la 76.ª AGO',
      approvedAt: new Date('2025-04-04'),
    },
    {
      title:
        'Informe Económico del VI Congreso CREUP-CRUE y XIV Encuentro Estatal de Representantes de CREUP',
      pdfUrl: `${FINANCIAL_REPORTS_PUBLIC_PATH}/informe-economico-del-vi-congreso-creup-crue-y-xiv-encuentro.pdf`,
      approvedAt: new Date('2025-04-04'),
    },
    {
      title: "Informe Económico de la 46th European Students' Convention",
      approvedAt: new Date('2024-12-15'),
    },
    {
      title: 'Informe Económico del Ejercicio de 2023',
      approvedAt: new Date('2024-12-15'),
    },
    {
      title: 'Informe Económico del X Stage Formativo',
      approvedAt: new Date('2024-12-15'),
    },
  ]

  const buildFinancialReportPdfPath = createFinancialReportPdfPathBuilder()

  for (let i = 0; i < financialReportsData.length; i++) {
    const item = financialReportsData[i]
    const [report] = await db
      .insert(schema.financialReports)
      .values({
        pdfUrl: item.pdfUrl ?? buildFinancialReportPdfPath(item.title),
        approvedAt: item.approvedAt,
        order: i,
        active: true,
      })
      .returning()

    await db.insert(schema.financialReportTranslations).values({
      locale: 'es',
      title: item.title,
      financialReportId: report.id,
    })
  }

  console.log('📰 Creating newsletters...')
  const newslettersData = [
    { year: 2026, month: 2 },
    { year: 2026, month: 1 },
    { year: 2025, month: 11 },
    { year: 2025, month: 10 },
    { year: 2025, month: 9 },
    { year: 2025, month: 6 },
    { year: 2025, month: 5 },
    { year: 2025, month: 3 },
    { year: 2025, month: 2 },
    { year: 2024, month: 12 },
    { year: 2024, month: 11 },
    { year: 2024, month: 10 },
    { year: 2024, month: 9 },
  ]

  assertUniqueValues(
    newslettersData.map((item) => buildNewsletterMonthKey(item.year, item.month)),
    'newsletters month keys'
  )

  for (let i = 0; i < newslettersData.length; i++) {
    const item = newslettersData[i]
    const monthKey = buildNewsletterMonthKey(item.year, item.month)
    const coverImage = buildNewsletterCoverPath(monthKey)

    await db.insert(schema.newsletters).values({
      month: new Date(Date.UTC(item.year, item.month - 1, 1)),
      monthKey,
      coverImage: publicAssetExists(coverImage) ? coverImage : null,
      pdfUrl: buildNewsletterPdfPath(monthKey),
      publicVisible: true,
    })
  }

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
