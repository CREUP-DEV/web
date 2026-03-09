/**
 * Database seed script for Drizzle ORM
 * Run with: pnpm db:seed
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../server/db/schema'

const connectionString = process.env.DATABASE_URL!
const db = drizzle(connectionString, { schema })

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (in correct order for foreign keys)
  console.log('🗑️ Clearing existing data...')
  await db.delete(schema.carouselItemTranslations)
  await db.delete(schema.carouselItems)
  await db.delete(schema.pressArticleTags)
  await db.delete(schema.pressArticleTranslations)
  await db.delete(schema.pressArticles)
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
      image: '/inicio/imagenes/carousel-default.jpg',
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
    {
      image: '/inicio/imagenes/carousel-vivienda.jpg',
      href: '/noticias/vivienda',
      translations: [
        {
          locale: 'es',
          title:
            'Exigimos un plan urgente de residencias públicas y regulación de precios de la vivienda.',
          buttonText: 'Leer Posicionamiento',
        },
        {
          locale: 'en',
          title: 'We demand an urgent plan for public housing and regulation of housing prices.',
          buttonText: 'Read Statement',
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
      mediaOutletId: null,
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
      mediaOutletId: null,
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
    const publishedAt = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const slug = await generatePressSlug(esTranslation.title, publishedAt)

    const [article] = await db
      .insert(schema.pressArticles)
      .values({
        type: item.type,
        slug,
        image: item.image,
        pdfUrl: item.pdfUrl,
        externalUrl: item.externalUrl,
        mediaOutletId: item.mediaOutletId,
        active: true,
        publishedAt,
      })
      .returning()

    await db.insert(schema.pressArticleTranslations).values(
      item.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
        contentHtml: t.contentHtml ?? null,
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
      image: '/inicio/imagenes/links-mic.jpg',
      to: 'https://www.creup.es/mic/',
      translations: [
        { locale: 'es', title: 'Manual de Identidad Corporativa' },
        { locale: 'en', title: 'Corporate Identity Manual' },
      ],
    },
    {
      image: '/inicio/imagenes/links-newsletter.jpg',
      to: 'https://www.creup.es/comunicacion/newsletter/',
      translations: [
        { locale: 'es', title: 'Suscríbete a nuestra Newsletter' },
        { locale: 'en', title: 'Subscribe to our Newsletter' },
      ],
    },
    {
      image: '/inicio/imagenes/links-apariciones.jpg',
      to: '/prensa/en-los-medios',
      translations: [
        { locale: 'es', title: 'Apariciones en los medios' },
        { locale: 'en', title: 'Media Appearances' },
      ],
    },
    {
      image: '/inicio/imagenes/links-estatuto.jpg',
      to: '/documentos/estatuto-estudiante',
      translations: [
        { locale: 'es', title: 'Estatuto del Estudiante' },
        { locale: 'en', title: "Student's Statute" },
      ],
    },
    {
      image: '/inicio/imagenes/links-becas.jpg',
      to: 'https://www.becaseducacion.gob.es/',
      translations: [
        { locale: 'es', title: 'Becas del Ministerio' },
        { locale: 'en', title: 'Ministry Scholarships' },
      ],
    },
    {
      image: '/inicio/imagenes/links-esu.jpg',
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
