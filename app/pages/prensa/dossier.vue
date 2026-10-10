<script setup lang="ts">
import { PRESS_KIT_PATH } from '~~/shared/constants/pressRoutes'

type PressKitSectionKey =
  | 'about'
  | 'philosophy'
  | 'members'
  | 'sectorials'
  | 'executive'
  | 'organization'
  | 'pressRoom'
  | 'positions'
  | 'faq'
  | 'contact'

/** Section anchors in display order. Not translated, so a shared link works in every locale. */
const SECTION_ANCHORS: Record<PressKitSectionKey, string> = {
  about: 'que-es-creup',
  philosophy: 'filosofia',
  members: 'universidades-miembro',
  sectorials: 'entidades-sectoriales',
  executive: 'comision-ejecutiva',
  organization: 'organizacion',
  pressRoom: 'sala-de-prensa',
  positions: 'posicionamientos',
  faq: 'preguntas-frecuentes',
  contact: 'contacto',
}
const SECTION_ORDER = Object.keys(SECTION_ANCHORS) as PressKitSectionKey[]

const LATEST_PRESS_ITEMS = 6

const { t } = useI18n()
const localePath = useLocalePath()
const siteUrl = useRuntimeSiteUrl()

usePageSeo('nav.press.pressKit', 'pressKit.seo.description', {
  breadcrumbs: () => [
    { name: t('nav.home'), path: localePath('/') },
    { name: t('nav.press.label'), path: localePath('/prensa/noticias') },
    { name: t('nav.press.pressKit'), path: localePath(PRESS_KIT_PATH) },
  ],
})

// The press kit is assembled from the same sources as the pages it summarizes, so it is always as
// current as the site.
const [
  { heroImage, heroVisible, availableMemberCount, completedYears },
  {
    allMembers,
    allSectoriales,
    membersPending,
    membersError,
    refreshMembers,
    sectorialesPending,
    sectorialesError,
    refreshSectoriales,
  },
  { areas, pending: areasPending, error: areasError, refresh: refreshAreas },
] = await Promise.all([useAboutPageData(), useMembersPageData(), useTeamPageData()])

const {
  committees,
  pending: committeesPending,
  error: committeesError,
  refresh: refreshCommittees,
  getCommitteeName,
} = useCommitteesData()

const {
  data: latestPress,
  pending: latestPressPending,
  error: latestPressError,
  refresh: refreshLatestPress,
} = usePress(null, null, LATEST_PRESS_ITEMS)

const {
  positionPapers,
  pending: positionPapersPending,
  error: positionPapersError,
  refresh: refreshPositionPapers,
} = usePressKitPositionPapers()

const {
  upcomingEvents,
  pending: eventsPending,
  error: eventsError,
  refresh: refreshEvents,
} = usePressKitUpcomingEvents()

// Section 1 states the figure that section 3 lists: the loaded members list's length, else the
// members count API's figure. Null when neither is available, so it is never a made-up number.
const universityCount = computed(() =>
  !membersError.value && allMembers.value.length > 0
    ? allMembers.value.length
    : availableMemberCount.value
)

const pressKitRef = useTemplateRef<HTMLElement>('pressKitRef')
const { imageLoading, isPreparingPrint, generatedAt, printPressKit } = usePressKitPrint(pressKitRef)

const sections = computed(() =>
  SECTION_ORDER.map((key, index) => ({
    key,
    id: SECTION_ANCHORS[key],
    number: index + 1,
    title: t(`pressKit.sections.${key}`),
  }))
)
const sectionProps = computed(
  () =>
    Object.fromEntries(
      sections.value.map(({ key, id, number, title }) => [key, { id, number, title }])
    ) as Record<PressKitSectionKey, { id: string; number: number; title: string }>
)

const siteHost = computed(() => {
  try {
    return new URL(siteUrl.value).host
  } catch {
    return siteUrl.value
  }
})
const liveUrl = computed(() => `${siteUrl.value}${localePath(PRESS_KIT_PATH)}`)
const liveUrlLabel = computed(() => `${siteHost.value}${localePath(PRESS_KIT_PATH)}`)
</script>

<template>
  <UContainer class="press-kit py-8 sm:py-12 print:max-w-none print:px-0 print:py-0">
    <article
      ref="pressKitRef"
      class="mx-auto max-w-5xl space-y-16 print:max-w-none print:space-y-0"
    >
      <div class="space-y-8 print:space-y-0">
        <PressKitCover
          :hero-image="heroVisible ? heroImage : null"
          :generated-at="generatedAt"
          :site-host="siteHost"
        />

        <PressKitToc :sections="sections" :live-url="liveUrl" :live-url-label="liveUrlLabel" />
      </div>

      <PressKitSection v-bind="sectionProps.about">
        <PressKitAbout :universities="universityCount" :years="completedYears" />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.philosophy">
        <PressKitPhilosophy />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.members">
        <PressKitMembers
          :members="allMembers"
          :pending="membersPending"
          :failed="Boolean(membersError)"
          :image-loading="imageLoading"
          @retry="refreshMembers()"
        />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.sectorials">
        <PressKitSectorials
          :sectorials="allSectoriales"
          :pending="sectorialesPending"
          :failed="Boolean(sectorialesError)"
          :image-loading="imageLoading"
          @retry="refreshSectoriales()"
        />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.executive">
        <PressKitExecutive
          :areas="areas"
          :pending="areasPending"
          :failed="Boolean(areasError)"
          :image-loading="imageLoading"
          @retry="refreshAreas()"
        />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.organization">
        <PressKitOrganizationTree
          :areas="areas"
          :areas-pending="areasPending"
          :areas-failed="Boolean(areasError)"
          :committees="committees"
          :committees-pending="committeesPending"
          :committees-failed="Boolean(committeesError)"
          :get-committee-name="getCommitteeName"
          :image-loading="imageLoading"
          @retry-areas="refreshAreas()"
          @retry-committees="refreshCommittees()"
        />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.pressRoom">
        <PressKitPressRoom
          :articles="latestPress?.data ?? []"
          :pending="latestPressPending"
          :failed="Boolean(latestPressError)"
          :site-url="siteUrl"
          :image-loading="imageLoading"
          @retry="refreshLatestPress()"
        />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.positions">
        <PressKitPositions
          :documents="positionPapers"
          :pending="positionPapersPending"
          :failed="Boolean(positionPapersError)"
          :site-url="siteUrl"
          @retry="refreshPositionPapers()"
        />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.faq">
        <PressKitFaq
          :events="upcomingEvents"
          :pending="eventsPending"
          :failed="Boolean(eventsError)"
          :image-loading="imageLoading"
          @retry="refreshEvents()"
        />
      </PressKitSection>

      <PressKitSection v-bind="sectionProps.contact">
        <PressKitContact
          :areas="areas"
          :areas-pending="areasPending"
          :areas-failed="Boolean(areasError)"
          :site-url="siteUrl"
          @retry-areas="refreshAreas()"
        />
      </PressKitSection>

      <div class="no-print archived:hidden border-default flex justify-center border-t pt-10">
        <!-- Opens the print dialog: the file comes from its "Save as PDF" destination. -->
        <UButton
          type="button"
          size="lg"
          icon="i-tabler-file-type-pdf"
          :loading="isPreparingPrint"
          :label="t('pressKit.cover.printAction')"
          @click="printPressKit"
        />
      </div>
    </article>
  </UContainer>
</template>

<style>
/*
 * Print layout: printing this page is how the press kit's PDF is made. Not scoped, because it also
 * hides the chrome the layout renders around <main> and restyles the page box; every rule is keyed
 * on `.press-kit`, so the stylesheet stays inert on other pages once it has loaded.
 *
 * Server-rendered, these rules arrive inline and nuxt-seo-utils minifies them: it drops any space
 * before a `:`, which turns `a :has(...)` (descendant) into `a:has(...)` (same element). So no
 * selector here may put a descendant space right before a pseudo-class, or printing before
 * hydration, without JavaScript or from a web archive replay keeps the site chrome. Name the
 * element instead (`div:has(...)`, not `*:has(...)`: Lightning CSS minifies a bare `*` away).
 */
@media print {
  /*
   * Every margin box is declared, with `content: ''` where nothing goes: Chrome prints its own
   * date, title, URL and page count ("Headers and footers", ticked by default) in any margin box
   * that is not generated, and `content: none` does not generate one.
   */
  @page press-kit {
    size: A4;
    margin: 15mm 15mm 17mm;

    @top-left {
      content: '';
    }

    @top-center {
      content: '';
    }

    @top-right {
      content: '';
    }

    @bottom-center {
      content: '';
    }

    @bottom-left {
      content: 'www.creup.es · prensa@creup.es';
      font-family: Raleway, sans-serif;
      font-size: 8pt;
      color: #6b6b6b;
    }

    @bottom-right {
      content: counter(page);
      font-family: Raleway, sans-serif;
      font-size: 8pt;
      color: #6b6b6b;
    }
  }

  @page press-kit:first {
    @bottom-left {
      content: '';
    }

    @bottom-right {
      content: '';
    }
  }

  .press-kit {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* A subheading (and the line introducing a list) moves to the next page with what follows it. */
  .press-kit h3,
  .press-kit h4,
  .press-kit h3 + p {
    break-after: avoid;
  }

  /* Header, footer, skip links, cookie banner: all the layout's root <div> holds but <main>. */
  html:has(.press-kit) div:has(> #main-content) > :not(#main-content) {
    display: none !important;
  }

  /* Dark text on white in either colour mode. */
  html:has(.press-kit) {
    color-scheme: light;
    font-size: 14px;
    --ui-primary: var(--color-creup-red-900);
    --ui-secondary: var(--color-creup-blue-950);
    --ui-text-dimmed: #6b6b6b;
    --ui-text-muted: #4d4d4d;
    --ui-text-toned: #333;
    --ui-text: #1a1a1a;
    --ui-text-highlighted: #000;
    --ui-text-inverted: #fff;
    --ui-bg: #fff;
    --ui-bg-muted: #fafafa;
    --ui-bg-elevated: #f5f5f5;
    --ui-bg-accented: #e5e5e5;
    --ui-bg-inverted: #1a1a1a;
    --ui-border: #d9d9d9;
    --ui-border-muted: #e5e5e5;
    --ui-border-accented: #bfbfbf;
    --ui-border-inverted: #1a1a1a;
  }

  /*
   * The named page goes on body, not on .press-kit: an element after #__nuxt (Nuxt's #teleports, a
   * portal) on a different page would force a break and print a blank last page.
   */
  html:has(.press-kit) body {
    page: press-kit;
    background: #fff;
    color: var(--ui-text);
  }
}
</style>
