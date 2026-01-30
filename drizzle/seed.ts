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
  await db.delete(schema.newsItemTranslations)
  await db.delete(schema.newsItems)
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
      image: '/img/carousel/default.jpg',
      href: '/que-es',
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
      image: '/img/carousel/vivienda.jpg',
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

  console.log('📰 Creating news items...')
  const newsData = [
    {
      image: '/img/news/vivienda-estudiantes.jpg',
      to: '/noticias/crisis-vivienda-septiembre-2025',
      tagSlugs: ['university-life-health', 'funding-scholarships', 'inclusion-equality'],
      translations: [
        {
          locale: 'es',
          title: 'Emergencia habitacional: los precios expulsan al estudiantado de la universidad',
        },
        { locale: 'en', title: 'Housing emergency: prices are driving students out of university' },
      ],
    },
    {
      image: '/img/news/huelga-madrid-pancarta.jpg',
      to: '/noticias/huelga-universidades-madrid',
      tagSlugs: ['funding-scholarships', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title: 'Huelga universitaria en Madrid: movilizaciones por la financiación educativa',
        },
        {
          locale: 'en',
          title: 'University strike in Madrid: protests over education funding',
        },
      ],
    },
    {
      image: '/img/news/soberania-digital.jpg',
      to: '/noticias/resolucion-soberania-digital',
      tagSlugs: ['digital-sovereignty', 'university-policy', 'rights-coexistence'],
      translations: [
        { locale: 'es', title: 'Resolución por la soberanía digital en las universidades' },
        { locale: 'en', title: 'Resolution on digital sovereignty in universities' },
      ],
    },
    {
      image: '/img/news/estatuto-becario-firma.jpg',
      to: '/noticias/entrada-vigor-estatuto-becario',
      tagSlugs: ['rights-coexistence', 'university-policy'],
      translations: [
        { locale: 'es', title: 'Entrada en vigor del Estatuto del Becario' },
        { locale: 'en', title: "Intern's Statute comes into force" },
      ],
    },
    {
      image: '/img/news/medicina-practicas.jpg',
      to: '/noticias/acuerdo-practicas-sanitarias-valencia',
      tagSlugs: ['teaching-quality', 'university-policy'],
      translations: [
        {
          locale: 'es',
          title:
            'Acuerdo en Valencia para blindar la prioridad pública en las prácticas sanitarias',
        },
        {
          locale: 'en',
          title: 'Agreement in Valencia to shield public priority in health internships',
        },
      ],
    },
    {
      image: '/img/news/fundacion-once-acuerdo.jpg',
      to: '/noticias/convenio-fundacion-once',
      tagSlugs: ['inclusion-equality', 'rights-coexistence'],
      translations: [
        {
          locale: 'es',
          title: 'Nueva alianza con Fundación ONCE para la inclusión plena en los campus',
        },
        { locale: 'en', title: 'New alliance with ONCE Foundation for full inclusion on campuses' },
      ],
    },
    {
      image: '/img/news/calidad-universitaria.jpg',
      to: '/noticias/apoyo-decreto-calidad',
      tagSlugs: ['teaching-quality', 'university-policy'],
      translations: [
        { locale: 'es', title: 'Apoyo al decreto de garantía de calidad universitaria' },
        { locale: 'en', title: 'Support for the university quality decree' },
      ],
    },
    {
      image: '/img/news/comedores-ugr.jpg',
      to: '/noticias/protesta-comedores-granada',
      tagSlugs: ['university-life-health', 'funding-scholarships'],
      translations: [
        {
          locale: 'es',
          title: 'Protestas por el precio de los comedores: alimentarse no es un lujo',
        },
        { locale: 'en', title: 'Canteen price protests: eating is not a luxury' },
      ],
    },
    {
      image: '/img/news/canarias-parlamento.jpg',
      to: '/noticias/recurso-inconstitucionalidad-canarias',
      tagSlugs: ['university-policy'],
      translations: [
        { locale: 'es', title: 'Recurso de inconstitucionalidad contra normativa en Canarias' },
        { locale: 'en', title: 'Constitutional challenge against regulation in Canarias' },
      ],
    },
    {
      image: '/img/news/asamblea-sevilla.jpg',
      to: '/noticias/conclusiones-77-asamblea',
      tagSlugs: ['university-policy', 'university-life-health'],
      translations: [
        { locale: 'es', title: 'Conclusiones de la 77ª Asamblea: prioridades y acuerdos' },
        { locale: 'en', title: 'Conclusions of the 77th Assembly: priorities and agreements' },
      ],
    },
  ]

  for (let i = 0; i < newsData.length; i++) {
    const item = newsData[i]
    const [newsItem] = await db
      .insert(schema.newsItems)
      .values({
        image: item.image,
        to: item.to,
        order: i,
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each news 1 day older
      })
      .returning()

    await db.insert(schema.newsItemTranslations).values(
      item.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        newsItemId: newsItem.id,
      }))
    )

    // Add all tag relationships
    if (item.tagSlugs && item.tagSlugs.length > 0) {
      for (const tagSlug of item.tagSlugs) {
        if (tags[tagSlug]) {
          await db.insert(schema.newsTags).values({
            newsItemId: newsItem.id,
            tagId: tags[tagSlug],
          })
        }
      }
    }
  }

  console.log('🔗 Creating featured links...')
  const featuredLinksData = [
    {
      image: '/img/links/mic.jpg',
      to: 'https://www.creup.es/mic/',
      translations: [
        { locale: 'es', title: 'Manual de Identidad Corporativa' },
        { locale: 'en', title: 'Corporate Identity Manual' },
      ],
    },
    {
      image: '/img/links/newsletter.jpg',
      to: 'https://www.creup.es/comunicacion/newsletter/',
      translations: [
        { locale: 'es', title: 'Suscríbete a nuestra Newsletter' },
        { locale: 'en', title: 'Subscribe to our Newsletter' },
      ],
    },
    {
      image: '/img/links/apariciones.jpg',
      to: '/prensa/en-los-medios',
      translations: [
        { locale: 'es', title: 'Apariciones en los medios' },
        { locale: 'en', title: 'Media Appearances' },
      ],
    },
    {
      image: '/img/links/estatuto.jpg',
      to: '/documentos/estatuto-estudiante',
      translations: [
        { locale: 'es', title: 'Estatuto del Estudiante' },
        { locale: 'en', title: "Student's Statute" },
      ],
    },
    {
      image: '/img/links/becas.jpg',
      to: 'https://www.becaseducacion.gob.es/',
      translations: [
        { locale: 'es', title: 'Becas del Ministerio' },
        { locale: 'en', title: 'Ministry Scholarships' },
      ],
    },
    {
      image: '/img/links/esu.jpg',
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
