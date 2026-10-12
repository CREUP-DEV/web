import type { Ref } from 'vue'
import type { PressArticle } from '@/composables/press/usePress'
import type { CREUPEventListItem } from '@/composables/events/useEvents'
import { CREUP_VALUES } from '@/composables/about/useAboutPageData'
import {
  usePressKitAbout,
  type PressKitAreaPerson,
  type PressKitAreaRow,
  type PressKitCommitteeItem,
  type PressKitPerson,
  type PressKitPressContact,
  type PressKitTile,
} from '@/composables/press/usePressKitContent'
import type { PolicyDocument } from '@/types/policy'
import {
  buildPressKitDocument,
  type PressKitPdfModel,
  type PressKitPdfSectionKey,
} from '@/utils/pressKitPdf/document'
import {
  rasterizeImage,
  runWithConcurrency,
  type RasterizeOptions,
} from '@/utils/pressKitPdf/images'
import ralewayBoldUrl from '~/assets/fonts/press-kit/Raleway-Bold.ttf?url'
import ralewayBoldItalicUrl from '~/assets/fonts/press-kit/Raleway-BoldItalic.ttf?url'
import ralewayItalicUrl from '~/assets/fonts/press-kit/Raleway-Italic.ttf?url'
import ralewayRegularUrl from '~/assets/fonts/press-kit/Raleway-Regular.ttf?url'
import { getEventTypeI18nKey } from '~~/shared/constants/eventTypes'
import { PRESS_KIT_PATH, getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import {
  CONTACT_TYPE_QUERY_KEY,
  GENERAL_CONTACT_EMAIL,
  PRESS_CONTACT_EMAIL,
  PRESS_CONTACT_TYPE_QUERY_VALUE,
} from '~~/shared/utils/contactShared'

/** The lists the PDF prints, each loaded on its own by the page. */
export type PressKitPdfSource =
  | 'members'
  | 'sectorials'
  | 'areas'
  | 'committees'
  | 'press'
  | 'positions'
  | 'events'

/** What each list says on the page when it fails to load; the PDF says the same. */
const LOAD_ERROR_KEYS: Record<PressKitPdfSource, string> = {
  members: 'members.loadError',
  sectorials: 'members.sectoriales.loadError',
  areas: 'team.loadError',
  committees: 'committees.loadError',
  press: 'press.news.loadError',
  positions: 'policy.positions.loadError',
  events: 'events.loadError',
}

/** At most this many images load and get drawn at once. */
const IMAGE_CONCURRENCY = 6
const PHOTO_RING = '#792225'

const PRESS_TYPE_LABEL_KEYS: Record<PressArticleType, string> = {
  press_release: 'press.releases.title',
  statement: 'press.statements.title',
  media_appearance: 'press.inMedia.title',
}

/** Spanish numbers read as "+34 600 00 00 00"; any other E.164 number is shown as sent. */
function formatPhone(phone: string) {
  const spanishNumber = /^\+34(\d{3})(\d{2})(\d{2})(\d{2})$/.exec(phone)
  return spanishNumber ? `+34 ${spanishNumber.slice(1).join(' ')}` : phone
}

function decodePhone(encodedPhone: string | null) {
  if (!encodedPhone) {
    return null
  }

  try {
    return formatPhone(atob(encodedPhone))
  } catch {
    return null
  }
}

const isSvgUrl = (url: string) => {
  try {
    const parsed = new URL(url, 'https://creup.es')
    return (
      parsed.pathname.toLowerCase().endsWith('.svg') ||
      parsed.searchParams.get('__imgkind') === 'svg'
    )
  } catch {
    return false
  }
}

/**
 * The press kit as a PDF made in the browser from the content the page already shows: the same
 * people, universities, publications and events, laid out like the printed dossier. pdfmake and the
 * fonts only download when someone asks for the PDF.
 */
export function usePressKitPdf(sources: {
  sections: Ref<Array<{ key: PressKitPdfSectionKey; number: number; title: string }>>
  heroImage: Ref<string | null>
  universityCount: Ref<number | null>
  years: Ref<number>
  memberTiles: Ref<PressKitTile[]>
  sectorialTiles: Ref<PressKitTile[]>
  executivePeople: Ref<PressKitPerson[]>
  areaRows: Ref<PressKitAreaRow[]>
  committeeItems: Ref<PressKitCommitteeItem[]>
  pressContacts: Ref<PressKitPressContact[]>
  articles: Ref<PressArticle[]>
  positionPapers: Ref<PolicyDocument[]>
  upcomingEvents: Ref<CREUPEventListItem[]>
  siteUrl: Ref<string>
  loadState: Ref<Record<PressKitPdfSource, { pending: boolean; failed: boolean }>>
}) {
  const { t, locale } = useI18n()
  const { getLanguageTag } = useLocales()
  const localePath = useLocalePath()
  const { formatDate } = useLocaleFormatting()
  const { formatDateRange } = useDatePresets()
  const img = useImage()
  const toast = useToast()
  const about = usePressKitAbout({ universities: sources.universityCount, years: sources.years })

  const isGenerating = ref(false)
  /** Not before every list has loaded or failed: a list still loading would print as empty. */
  const isReady = computed(() =>
    Object.values(sources.loadState.value).every((state) => !state.pending)
  )
  const loadError = (source: PressKitPdfSource) =>
    sources.loadState.value[source].failed ? t(LOAD_ERROR_KEYS[source]) : null

  const absoluteUrl = (path: string) =>
    /^https?:\/\//.test(path) ? path : `${sources.siteUrl.value}${path}`
  const siteHost = () => sources.siteUrl.value.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const formatLongDate = (value: string | Date) => {
    try {
      return formatDate(value, { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return String(value)
    }
  }

  /** The URL to draw an image from: the image service at the size needed, or the SVG itself. */
  const imageUrl = (src: string, options: RasterizeOptions) =>
    isSvgUrl(src)
      ? src
      : img(src, {
          width: options.width,
          height: options.height,
          fit: options.fit === 'cover' ? 'cover' : 'inside',
          format: options.format === 'jpeg' ? 'jpeg' : 'png',
          // JPEG has no transparency, and the image service flattens it onto black otherwise.
          ...(options.format === 'jpeg' ? { background: 'ffffff' } : {}),
        })

  async function loadImages() {
    const requests: Array<{ key: string; src: string; options: RasterizeOptions }> = []
    const queued = new Set<string>()
    const queue = (key: string, src: string | null, options: RasterizeOptions) => {
      if (src && !queued.has(key)) {
        queued.add(key)
        requests.push({ key, src, options })
      }
    }

    const hero = sources.heroImage.value
    // The group photo is a wide banner: a band across the cover, and a strip under section 1.
    queue('cover', hero, {
      width: 1600,
      height: 673,
      fit: 'cover',
      format: 'jpeg',
      background: '#FFFFFF',
    })
    queue('hero', hero, {
      width: 1600,
      height: 457,
      fit: 'cover',
      format: 'jpeg',
      background: '#FFFFFF',
    })

    for (const tile of [...sources.memberTiles.value, ...sources.sectorialTiles.value]) {
      queue(`tile:${tile.id}`, tile.logo, {
        width: 128,
        height: 128,
        fit: 'contain',
        format: 'png',
      })
    }

    const photoOptions: RasterizeOptions = {
      width: 240,
      height: 240,
      fit: 'cover',
      format: 'png',
      circle: { ringColor: PHOTO_RING, ringWidth: 10 },
    }
    for (const person of sources.executivePeople.value) {
      queue(`person:${person.id}`, person.photo, photoOptions)
    }
    for (const area of sources.areaRows.value) {
      if (area.responsible) {
        queue(`person:${area.responsible.id}`, area.responsible.photo, photoOptions)
      }
    }

    for (const article of sources.articles.value) {
      queue(`press:${article.id}`, article.image, {
        width: 480,
        height: 270,
        fit: 'cover',
        format: 'jpeg',
        background: '#FFFFFF',
      })
    }

    for (const event of sources.upcomingEvents.value) {
      queue(`event:${event.id}`, event.banner.url, {
        width: 700,
        height: 200,
        fit: 'cover',
        format: 'jpeg',
        background: '#FFFFFF',
      })
    }

    const results = await runWithConcurrency(
      requests.map(
        ({ key, src, options }) =>
          async () =>
            [key, await rasterizeImage(imageUrl(src, options), options)] as const
      ),
      IMAGE_CONCURRENCY
    )

    return Object.fromEntries(
      results.filter((entry): entry is readonly [string, string] => entry[1] !== null)
    )
  }

  async function loadSvg(path: string) {
    try {
      const response = await fetch(path)
      return response.ok ? await response.text() : null
    } catch {
      return null
    }
  }

  function buildModel(images: Record<string, string>): PressKitPdfModel {
    const imageKey = (key: string) => (images[key] ? key : null)
    const sections = Object.fromEntries(
      sources.sections.value.map(({ key, number, title }) => [key, { number, title }])
    ) as PressKitPdfModel['sections']
    const pressKitUrl = absoluteUrl(localePath(PRESS_KIT_PATH))
    const pressContactUrl = absoluteUrl(
      localePath({
        path: '/contacto',
        query: { [CONTACT_TYPE_QUERY_KEY]: PRESS_CONTACT_TYPE_QUERY_VALUE },
      })
    )
    const toAreaPerson = (person: PressKitAreaPerson) => ({
      image: imageKey(`person:${person.id}`),
      name: person.name,
      role: person.role,
    })

    return {
      language: getLanguageTag(locale.value),
      title: t('nav.press.pressKit'),
      organizationName: t('pressKit.cover.organization'),
      tagline: t('pressKit.tagline'),
      generatedOn: t('pressKit.cover.generatedOn', {
        date: formatDate(new Date(), {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Madrid',
        }),
      }),
      footer: `${siteHost()} · ${PRESS_CONTACT_EMAIL}`,
      contentsTitle: t('pressKit.toc.title'),
      liveVersion: {
        label: t('pressKit.toc.liveVersion'),
        link: { label: pressKitUrl.replace(/^https?:\/\//, ''), url: pressKitUrl },
      },
      sections,
      about: {
        stats: about.stats.value.map(({ value, label }) => ({ value, label })),
        paragraphs: about.paragraphs.value,
      },
      philosophy: {
        statements: [
          { title: t('aboutPage.missionTitle'), text: t('aboutPage.missionText') },
          { title: t('aboutPage.visionTitle'), text: t('aboutPage.visionText') },
        ],
        valuesTitle: t('aboutPage.valuesTitle'),
        valuesDescription: t('aboutPage.valuesDescription'),
        values: CREUP_VALUES.map(({ key }) => ({
          title: t(`aboutPage.values.${key}.title`),
          description: t(`aboutPage.values.${key}.description`),
        })),
      },
      members: {
        intro: t('pressKit.members.intro', { count: sources.memberTiles.value.length }),
        failed: loadError('members'),
        tiles: sources.memberTiles.value.map((tile) => ({
          image: imageKey(`tile:${tile.id}`),
          title: tile.title,
          subtitle: tile.subtitle,
          details: tile.details,
        })),
      },
      sectorials: {
        intro: t('pressKit.sectorials.intro'),
        empty: t('members.sectoriales.noSectoriales'),
        failed: loadError('sectorials'),
        tiles: sources.sectorialTiles.value.map((tile) => ({
          image: imageKey(`tile:${tile.id}`),
          title: tile.title,
          subtitle: tile.subtitle,
          details: tile.details,
        })),
      },
      executive: {
        intro: t('pressKit.executive.intro'),
        failed: loadError('areas'),
        people: sources.executivePeople.value.map((person) => ({
          image: imageKey(`person:${person.id}`),
          name: person.name,
          role: person.role,
          degree: person.degree,
          university: person.university,
          email: person.email,
        })),
      },
      organization: {
        intro: t('pressKit.organization.intro'),
        failed: loadError('areas'),
        executiveLabel: t('team.executiveCommission'),
        extendedLabel: t('team.extendedCommission'),
        noResponsible: t('pressKit.organization.noResponsible'),
        areas: sources.areaRows.value.map((area) => ({
          name: area.name,
          responsible: area.responsible ? toAreaPerson(area.responsible) : null,
          members: area.members.map(toAreaPerson),
        })),
        committeesTitle: t('committees.title'),
        committeesDescription: t('committees.description'),
        responsibleLabel: t('pressKit.organization.responsible'),
        committees: sources.committeeItems.value.map(({ name, responsibleName }) => ({
          name,
          responsibleName,
        })),
        committeesFailed: loadError('committees'),
      },
      pressRoom: {
        paragraphs: [t('pressKit.pressRoom.paragraph1'), t('pressKit.pressRoom.paragraph2')],
        latestTitle: t('pressKit.pressRoom.latestTitle'),
        empty: t('pressKit.pressRoom.empty'),
        articles: sources.articles.value.map((article) => ({
          image: imageKey(`press:${article.id}`),
          meta: [
            formatLongDate(article.publishedAt),
            t(PRESS_TYPE_LABEL_KEYS[article.type]),
            article.mediaOutlet?.name,
          ]
            .filter(Boolean)
            .join(' · '),
          title: article.title,
          url: absoluteUrl(
            localePath(`${getPressArticlePublicListPath(article.type)}/${article.slug}`)
          ),
        })),
        allNews: {
          label: t('pressKit.pressRoom.allNews'),
          url: absoluteUrl(localePath('/prensa/noticias')),
        },
        failed: loadError('press'),
      },
      positions: {
        paragraphs: [t('pressKit.positions.paragraph1'), t('pressKit.positions.paragraph2')],
        links: [
          { label: t('policy.positions.title'), path: '/politica/posicionamientos' },
          { label: t('policy.resolutions.title'), path: '/politica/resoluciones' },
          { label: t('policy.reports.title'), path: '/politica/informes-ejecutivos' },
        ].map(({ label, path }) => ({ label, url: absoluteUrl(localePath(path)) })),
        listTitle: t('pressKit.positions.listTitle'),
        empty: t('policy.positions.empty'),
        documents: sources.positionPapers.value.map((document) => ({
          name: document.name,
          date: formatLongDate(document.date),
          assembly: document.assembly || null,
          url: document.file?.url ? absoluteUrl(document.file.url) : null,
        })),
        failed: loadError('positions'),
      },
      faq: {
        items: [
          {
            question: t('pressKit.faq.positioning.question'),
            answer: t('pressKit.faq.positioning.answer'),
          },
          {
            question: t('pressKit.faq.resolution.question'),
            answer: t('pressKit.faq.resolution.answer'),
          },
          {
            question: t('pressKit.faq.where.question'),
            answer: t('pressKit.faq.where.answer'),
            links: [
              { label: t('policy.positions.title'), path: '/politica/posicionamientos' },
              { label: t('policy.resolutions.title'), path: '/politica/resoluciones' },
            ].map(({ label, path }) => ({ label, url: absoluteUrl(localePath(path)) })),
          },
          {
            question: t('pressKit.faq.assemblies.question'),
            answer: t('pressKit.faq.assemblies.answer'),
          },
          {
            question: t('pressKit.faq.events.question'),
            answer: t('pressKit.faq.events.answer'),
            list: [
              { term: t('events.types.stageFormativo'), text: t('pressKit.faq.events.stage') },
              {
                term: t('events.types.congresoYEncuentro'),
                text: t('pressKit.faq.events.congress'),
              },
            ],
          },
        ],
        upcomingTitle: t('pressKit.faq.upcomingTitle'),
        noUpcoming: t('pressKit.faq.noUpcoming'),
        events: sources.upcomingEvents.value.map((event) => {
          const typeKey = getEventTypeI18nKey(event.type)

          return {
            image: imageKey(`event:${event.id}`),
            name: event.name,
            date: formatDateRange(event.startDate, event.endDate, { includeYear: true }),
            location: event.location || null,
            type: typeKey ? t(typeKey) : event.type || null,
            url: absoluteUrl(localePath(`/conocenos/eventos/${event.slug}`)),
          }
        }),
        allEvents: {
          label: t('pressKit.faq.allEvents'),
          url: absoluteUrl(localePath('/conocenos/eventos')),
        },
        eventsFailed: loadError('events'),
      },
      contact: {
        intro: t('pressKit.contact.intro'),
        mailboxes: [
          {
            label: t('contactPage.contactType.press'),
            email: PRESS_CONTACT_EMAIL,
            description: t('contactPage.contactType.pressDescription'),
          },
          {
            label: t('contactPage.contactType.general'),
            email: GENERAL_CONTACT_EMAIL,
            description: t('contactPage.contactType.generalDescription'),
          },
        ],
        peopleTitle: t('pressKit.contact.peopleTitle'),
        phoneLabel: t('pressKit.contact.phone'),
        people: sources.pressContacts.value.map((contact) => ({
          name: contact.name,
          role: contact.role,
          email: contact.email,
          phone: decodePhone(contact.encodedPhone),
        })),
        links: [
          { label: t('pressKit.contact.form'), url: pressContactUrl },
          { label: t('common.visitWebsite'), url: sources.siteUrl.value },
        ],
      },
    }
  }

  async function downloadPdf() {
    if (isGenerating.value || !isReady.value) {
      return
    }

    isGenerating.value = true

    try {
      const [{ default: pdfMake }, images, logoOnLight, logoOnDark] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        loadImages(),
        loadSvg('/nav/creup-site-header-logo-light.svg'),
        loadSvg('/nav/creup-site-header-logo-dark.svg'),
      ])

      const fontUrl = (url: string) => new URL(url, window.location.href).href
      // Only the fonts are fetched by pdfmake; every image arrives as a data URL.
      pdfMake.setUrlAccessPolicy((url) => url.startsWith(window.location.origin))
      pdfMake.addFonts({
        Raleway: {
          normal: fontUrl(ralewayRegularUrl),
          bold: fontUrl(ralewayBoldUrl),
          italics: fontUrl(ralewayItalicUrl),
          bolditalics: fontUrl(ralewayBoldItalicUrl),
        },
      })

      const definition = buildPressKitDocument(buildModel(images), {
        images,
        logoOnLight,
        logoOnDark,
      })

      await pdfMake.createPdf(definition).download(`CREUP - ${t('nav.press.pressKit')}.pdf`)
    } catch (error) {
      console.error('[press-kit] PDF generation failed', error)
      toast.add({
        title: t('pressKit.pdf.error'),
        color: 'error',
        icon: 'i-tabler-alert-triangle',
      })
    } finally {
      isGenerating.value = false
    }
  }

  return { isGenerating, isReady, downloadPdf }
}
