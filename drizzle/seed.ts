/**
 * Database seed script for Drizzle ORM
 * Run with: pnpm db:seed -- --confirm
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../server/db/schema'
import { requireConfigString } from '../shared/utils/config'
import { dateValueToDateOnly } from '../shared/utils/date'
import {
  ABOUT_HERO_DEFAULT_IMAGE,
  EQUALITY_DOCUMENTS_PUBLIC_PATH,
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
  HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
} from '../shared/constants/assetPaths'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')
const db = drizzle(connectionString, { schema })

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

const buildHomeImagePath = (publicPath: string, title: string) =>
  `${publicPath}/${slugify(title) || 'imagen'}.webp`

async function main() {
  const cliArgs = new Set(process.argv.slice(2))
  const hasConfirmFlag = cliArgs.has('--confirm')
  const isProduction = process.env.NODE_ENV === 'production'
  const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true'

  if (!hasConfirmFlag) {
    throw new Error('Refusing to run destructive seed without --confirm.')
  }

  if (isProduction && !allowProductionSeed) {
    throw new Error('Refusing to run seed in production unless ALLOW_PRODUCTION_SEED=true.')
  }

  console.log('🌱 Starting database seeding...')

  // Clear existing data (in correct order for foreign keys)
  console.log('🗑️ Clearing existing data...')
  await db.delete(schema.aboutPageContent)
  await db.delete(schema.pressDossier)
  await db.delete(schema.equalityDocumentTranslations)
  await db.delete(schema.equalityDocuments)
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
      ],
    },
    {
      slug: 'university-policy',
      translations: [
        { locale: 'es', name: 'Política Universitaria' },
        { locale: 'en', name: 'University Policy' },
      ],
    },
    {
      slug: 'digital-sovereignty',
      translations: [
        { locale: 'es', name: 'Soberanía Digital' },
        { locale: 'en', name: 'Digital Sovereignty' },
      ],
    },
    {
      slug: 'funding-scholarships',
      translations: [
        { locale: 'es', name: 'Financiación y Becas' },
        { locale: 'en', name: 'Funding & Scholarships' },
      ],
    },
    {
      slug: 'rights-coexistence',
      translations: [
        { locale: 'es', name: 'Derechos y Convivencia' },
        { locale: 'en', name: 'Rights & Coexistence' },
      ],
    },
    {
      slug: 'teaching-quality',
      translations: [
        { locale: 'es', name: 'Calidad Docente' },
        { locale: 'en', name: 'Teaching Quality' },
      ],
    },
    {
      slug: 'university-life-health',
      translations: [
        { locale: 'es', name: 'Vida Universitaria y Salud' },
        { locale: 'en', name: 'University Life & Health' },
      ],
    },
    {
      slug: 'inclusion-equality',
      translations: [
        { locale: 'es', name: 'Inclusión e Igualdad' },
        { locale: 'en', name: 'Inclusion & Equality' },
      ],
    },
    {
      slug: 'international',
      translations: [
        { locale: 'es', name: 'Internacional' },
        { locale: 'en', name: 'International' },
      ],
    },
    {
      slug: 'internships',
      translations: [
        { locale: 'es', name: 'Prácticas' },
        { locale: 'en', name: 'Internships' },
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
      image: buildHomeImagePath(
        HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
        'Conoce a la asociación que representa a más de 1.000.000 de estudiantes.'
      ),
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
    pdfUrl: null,
    active: false,
  })

  console.log('🗞️ Creating media outlets...')
  const mediaOutletsData = [
    {
      key: 'las-provincias',
      name: 'Las Provincias',
      website: 'https://www.lasprovincias.es/',
      logo: '/prensa/imagenes/media-las-provincias.webp',
    },
    {
      key: 'ideal',
      name: 'Ideal',
      website: 'https://www.ideal.es/',
      logo: '/prensa/imagenes/media-ideal.webp',
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
  const buildRichText = (paragraphs: string[], highlights: string[] = []) => {
    const body = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')
    const bulletList = highlights.length
      ? `<ul>${highlights.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : ''

    return `${body}${bulletList}`
  }

  const pressData = [
    {
      type: 'press_release' as const,
      image: '/prensa/imagenes/news-vivienda-estudiantes.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['university-life-health', 'funding-scholarships', 'inclusion-equality'],
      translations: [
        {
          locale: 'es',
          title: 'Emergencia habitacional: los precios expulsan al estudiantado de la universidad',
          description:
            'Nota de prensa sobre la crisis de vivienda que afecta al estudiantado universitario en toda España.',
          contentHtml: buildRichText(
            [
              'CREUP advierte de que el encarecimiento sostenido del alquiler y la falta de plazas públicas de alojamiento están expulsando a miles de estudiantes de sus estudios superiores.',
              'La organización reclama a las administraciones una respuesta coordinada que garantice el acceso a la universidad en condiciones de igualdad, con especial atención a quienes deben desplazarse de su lugar de residencia habitual.',
            ],
            [
              'Plan urgente de residencias públicas y asequibles.',
              'Refuerzo de las becas vinculadas a alojamiento.',
              'Medidas de contención de precios en zonas tensionadas.',
            ]
          ),
        },
        {
          locale: 'en',
          title: 'Housing emergency: prices are driving students out of university',
          description:
            'Press release on the housing crisis affecting university students across Spain.',
        },
      ],
    },
    {
      type: 'press_release' as const,
      image: '/prensa/imagenes/news-huelga-madrid-pancarta.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['funding-scholarships', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Huelga universitaria en Madrid: movilizaciones por la financiación educativa',
          description:
            'Nota de prensa sobre las movilizaciones estudiantiles en Madrid en defensa de la financiación de la educación pública.',
          contentHtml: buildRichText(
            [
              'CREUP respalda las movilizaciones convocadas en Madrid para denunciar la infrafinanciación estructural de las universidades públicas y sus efectos sobre la calidad docente y la equidad.',
              'La coordinadora insiste en que la financiación universitaria debe blindarse con compromisos plurianuales y con una participación real del estudiantado en el diseño de las políticas públicas.',
            ],
            [
              'Más recursos para plantillas e infraestructuras.',
              'Reducción de barreras económicas de acceso y permanencia.',
              'Participación estudiantil en la toma de decisiones.',
            ]
          ),
        },
        {
          locale: 'en',
          title: 'University strike in Madrid: protests over education funding',
          description:
            'Press release on student protests in Madrid defending public education funding.',
        },
      ],
    },
    {
      type: 'statement' as const,
      image: '/prensa/imagenes/news-soberania-digital.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['digital-sovereignty', 'university-policy', 'rights-coexistence'],
      translations: [
        {
          locale: 'es',
          title: 'Resolución por la soberanía digital en las universidades',
          description:
            'Comunicado oficial de CREUP sobre la necesidad de garantizar la soberanía digital en el ámbito universitario.',
          contentHtml: buildRichText(
            [
              'CREUP considera prioritario que las universidades públicas refuercen su autonomía tecnológica y reduzcan la dependencia de plataformas privadas para servicios esenciales.',
              'La resolución apuesta por soluciones interoperables, transparentes y respetuosas con los derechos digitales del estudiantado y del personal universitario.',
            ],
            [
              'Protección reforzada de datos personales.',
              'Uso preferente de herramientas auditables y abiertas.',
              'Gobernanza universitaria sobre infraestructuras críticas digitales.',
            ]
          ),
        },
        {
          locale: 'en',
          title: 'Resolution on digital sovereignty in universities',
          description:
            'Official CREUP statement on the need to ensure digital sovereignty in the university sphere.',
        },
      ],
    },
    {
      type: 'statement' as const,
      image: '/prensa/imagenes/news-estatuto-becario-firma.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['rights-coexistence', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Entrada en vigor del Estatuto del Becario',
          description:
            'Comunicado sobre la entrada en vigor del Estatuto del Becario y su impacto en el estudiantado.',
          contentHtml: buildRichText(
            [
              'CREUP valora la entrada en vigor del Estatuto del Becario como un avance relevante en la regulación de las prácticas, aunque recuerda que su aplicación deberá vigilarse para evitar usos fraudulentos.',
              'La organización seguirá trabajando para que la formación práctica responda a fines pedagógicos reales y no sustituya empleo estructural.',
            ],
            [
              'Seguimiento efectivo del cumplimiento normativo.',
              'Garantías frente a abusos en las prácticas.',
              'Coordinación entre universidades, empresas y estudiantes.',
            ]
          ),
        },
        {
          locale: 'en',
          title: "Intern's Statute comes into force",
          description:
            "Statement on the Intern's Statute coming into force and its impact on students.",
        },
      ],
    },
    {
      type: 'media_appearance' as const,
      image: '/prensa/imagenes/news-medicina-practicas.jpg',
      pdfUrl: null,
      externalUrl: 'https://example.com/practicas-sanitarias',
      mediaOutletId: 'las-provincias',
      tagSlugs: ['teaching-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Acuerdo en Valencia para blindar la prioridad pública en las prácticas sanitarias',
          description:
            'Cobertura mediática del acuerdo alcanzado en Valencia sobre prácticas sanitarias universitarias.',
        },
        {
          locale: 'en',
          title: 'Agreement in Valencia to shield public priority in health internships',
          description:
            'Media coverage of the agreement reached in Valencia on university health internships.',
        },
      ],
    },
    {
      type: 'statement' as const,
      image: '/prensa/imagenes/news-fundacion-once-acuerdo.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['inclusion-equality', 'rights-coexistence'],
      translations: [
        {
          locale: 'es',
          title: 'Nueva alianza con Fundación ONCE para la inclusión plena en los campus',
          description:
            'Comunicado sobre el acuerdo de colaboración con Fundación ONCE para mejorar la inclusión en las universidades.',
          contentHtml: buildRichText(
            [
              'CREUP y Fundación ONCE refuerzan su colaboración para promover entornos universitarios accesibles, inclusivos y centrados en la participación efectiva del estudiantado con discapacidad.',
              'El acuerdo permitirá compartir diagnósticos, buenas prácticas y propuestas dirigidas a mejorar la accesibilidad física, digital y académica en los campus.',
            ],
            [
              'Accesibilidad universal en servicios y espacios.',
              'Adaptaciones académicas eficaces y homogéneas.',
              'Impulso a la participación estudiantil inclusiva.',
            ]
          ),
        },
        {
          locale: 'en',
          title: 'New alliance with ONCE Foundation for full inclusion on campuses',
          description:
            'Statement on the collaboration agreement with ONCE Foundation to improve inclusion in universities.',
        },
      ],
    },
    {
      type: 'press_release' as const,
      image: '/prensa/imagenes/news-calidad-universitaria.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['teaching-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Apoyo al decreto de garantía de calidad universitaria',
          description:
            'Nota de prensa en la que CREUP muestra su apoyo al nuevo decreto de calidad universitaria.',
          contentHtml: buildRichText(
            [
              'CREUP expresa su apoyo a las medidas que refuerzan los estándares de calidad del sistema universitario, siempre que se apliquen con transparencia y con participación de la comunidad universitaria.',
              'La coordinadora subraya que la calidad debe traducirse en mejores condiciones de aprendizaje, recursos suficientes y una evaluación orientada a la mejora continua.',
            ],
            [
              'Garantías académicas y docentes homogéneas.',
              'Evaluación con enfoque de mejora y no solo de control.',
              'Participación del estudiantado en los procesos de calidad.',
            ]
          ),
        },
        {
          locale: 'en',
          title: 'Support for the university quality decree',
          description:
            'Press release in which CREUP shows its support for the new university quality decree.',
        },
      ],
    },
    {
      type: 'media_appearance' as const,
      image: '/prensa/imagenes/news-comedores-ugr.jpg',
      pdfUrl: null,
      externalUrl: 'https://example.com/comedores-granada',
      mediaOutletId: 'ideal',
      tagSlugs: ['university-life-health', 'funding-scholarships'],
      translations: [
        {
          locale: 'es',
          title: 'Protestas por el precio de los comedores: alimentarse no es un lujo',
          description:
            'Aparición en medios sobre las protestas estudiantiles por el precio de los comedores universitarios.',
        },
        {
          locale: 'en',
          title: 'Canteen price protests: eating is not a luxury',
          description: 'Media appearance about student protests over university canteen prices.',
        },
      ],
    },
    {
      type: 'press_release' as const,
      image: '/prensa/imagenes/news-canarias-parlamento.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Recurso de inconstitucionalidad contra normativa en Canarias',
          description:
            'Nota de prensa sobre el recurso de inconstitucionalidad presentado contra una normativa autonómica en Canarias.',
          contentHtml: buildRichText(
            [
              'CREUP ha seguido con preocupación la aprobación de una normativa autonómica en Canarias que puede afectar al marco competencial y a los derechos del estudiantado universitario.',
              'La coordinadora defiende que cualquier reforma universitaria debe respetar las garantías constitucionales, la autonomía universitaria y la participación de la comunidad académica.',
            ],
            [
              'Seguridad jurídica para universidades y estudiantes.',
              'Respeto a la autonomía universitaria.',
              'Participación real en los procesos normativos.',
            ]
          ),
        },
        {
          locale: 'en',
          title: 'Constitutional challenge against regulation in Canarias',
          description:
            'Press release on the constitutional challenge filed against a regional regulation in Canarias.',
        },
      ],
    },
    {
      type: 'statement' as const,
      image: '/prensa/imagenes/news-asamblea-sevilla.jpg',
      pdfUrl: null,
      externalUrl: null,
      mediaOutletId: null,
      tagSlugs: ['university-policy', 'university-life-health'],
      translations: [
        {
          locale: 'es',
          title: 'Conclusiones de la 77ª Asamblea: prioridades y acuerdos',
          description:
            'Comunicado con las conclusiones y acuerdos alcanzados durante la 77ª Asamblea General de CREUP.',
          contentHtml: buildRichText(
            [
              'La 77ª Asamblea General de CREUP ha servido para actualizar la agenda política de la organización y fijar prioridades compartidas para los próximos meses.',
              'Entre los acuerdos adoptados destacan el refuerzo del trabajo sobre vivienda, financiación universitaria, inclusión y derechos del estudiantado en prácticas.',
            ],
            [
              'Defensa de la universidad pública como ascensor social.',
              'Prioridad política a la vivienda estudiantil.',
              'Seguimiento de calidad docente, bienestar e inclusión.',
            ]
          ),
        },
        {
          locale: 'en',
          title: 'Conclusions of the 77th Assembly: priorities and agreements',
          description:
            'Statement with the conclusions and agreements reached during the 77th CREUP General Assembly.',
        },
      ],
    },
  ]

  // Import slug utility
  const { generatePressSlug } = await import('../server/utils/slug')

  for (let i = 0; i < pressData.length; i++) {
    const item = pressData[i]
    const esTranslation = item.translations.find((t) => t.locale === 'es')!
    const publishedAtDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const publishedAt = dateValueToDateOnly(publishedAtDate)
    const slug = await generatePressSlug(esTranslation.title, publishedAtDate)
    const resolvedMediaOutletId = item.mediaOutletId ? mediaOutlets[item.mediaOutletId] : null

    if (item.type === 'media_appearance' && !resolvedMediaOutletId) {
      throw new Error(`Missing media outlet for media appearance: ${esTranslation.title}`)
    }

    const [article] = await db
      .insert(schema.pressArticles)
      .values({
        type: item.type,
        slug,
        image: item.image,
        pdfUrl: item.pdfUrl,
        externalUrl: item.externalUrl,
        mediaOutletId: resolvedMediaOutletId,
        active: true,
        publishedAt,
      })
      .returning()

    await db.insert(schema.pressArticleTranslations).values(
      item.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
        contentHtml: 'contentHtml' in t ? (t.contentHtml ?? null) : null,
        pressArticleId: article.id,
      }))
    )

    if (item.tagSlugs && item.tagSlugs.length > 0) {
      for (const tagSlug of item.tagSlugs) {
        if (tags[tagSlug]) {
          await db.insert(schema.pressArticleTags).values({
            pressArticleId: article.id,
            tagId: tags[tagSlug],
          })
        }
      }
    }
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

  const financialReportsData = [
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
      approvedAt: new Date('2025-04-04'),
    },
    {
      title: "Informe Económico de la 46th European Students' Convention",
      approvedAt: new Date('2024-12-15'),
    },
    {
      title: 'Informe Económico de la 75.ª AGO',
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

  for (let i = 0; i < financialReportsData.length; i++) {
    const item = financialReportsData[i]
    const [report] = await db
      .insert(schema.financialReports)
      .values({
        pdfUrl: `/documentos/informes-economicos/placeholder-${i + 1}.pdf`,
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
