import type { Content, StyleDictionary, TDocumentDefinitions, TableCell } from 'pdfmake/interfaces'
import {
  CARD_RADIUS,
  cardBackgrounds,
  createCardRegistry,
  type CardBox,
  type MarkerPosition,
} from './cards'

/**
 * The press kit as a PDF document definition for pdfmake. It follows the layout of the PDF dossier
 * CREUP used to upload: a cover over a photo tinted in CREUP red (the one uploaded for it from the
 * admin panel, or the logo's rings when there is none), cream pages with the logo at the top, one
 * chapter per section on rounded white cards, the Executive Committee under red bars, and the
 * contact details on a red back cover. Everything it prints comes translated in the model; the
 * images come already cropped and finished (see `images.ts`).
 */

export type PressKitPdfSectionKey =
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

export interface PressKitPdfLink {
  label: string
  url: string
}

export interface PressKitPdfTile {
  /** Key in `images`, or null to print a placeholder. */
  image: string | null
  title: string
  subtitle: string | null
  details: string | null
}

export interface PressKitPdfPerson {
  image: string | null
  name: string
  role: string
  degree: string | null
  university: string | null
  email: string | null
}

export interface PressKitPdfAreaPerson {
  image: string | null
  name: string
  role: string | null
}

export interface PressKitPdfModel {
  language: string
  title: string
  organizationName: string
  tagline: string
  generatedOn: string
  /** "www.creup.es · prensa@creup.es", printed at the foot of every page. */
  footer: string
  contentsTitle: string
  liveVersion: { label: string; link: PressKitPdfLink }
  sections: Record<PressKitPdfSectionKey, { number: number; title: string }>
  about: {
    stats: Array<{ value: string; label: string }>
    paragraphs: string[]
  }
  philosophy: {
    statements: Array<{ title: string; text: string }>
    valuesTitle: string
    valuesDescription: string
    values: Array<{ title: string; description: string }>
  }
  /**
   * Each list carries `failed` set to its load error when its source could not be loaded: the
   * chapter then says so and points to the live page, rather than printing it as empty.
   */
  members: { intro: string; tiles: PressKitPdfTile[]; failed: string | null }
  sectorials: { intro: string; tiles: PressKitPdfTile[]; empty: string; failed: string | null }
  executive: { intro: string; people: PressKitPdfPerson[]; failed: string | null }
  organization: {
    intro: string
    failed: string | null
    executiveLabel: string
    extendedLabel: string
    noResponsible: string
    areas: Array<{
      name: string
      responsible: PressKitPdfAreaPerson | null
      members: PressKitPdfAreaPerson[]
    }>
    committeesTitle: string
    committeesDescription: string
    responsibleLabel: string
    committees: Array<{ name: string; responsibleName: string | null }>
    committeesFailed: string | null
  }
  pressRoom: {
    paragraphs: string[]
    latestTitle: string
    empty: string
    articles: Array<{ image: string | null; meta: string; title: string; url: string }>
    allNews: PressKitPdfLink
    failed: string | null
  }
  positions: {
    paragraphs: string[]
    links: PressKitPdfLink[]
    listTitle: string
    empty: string
    documents: Array<{ name: string; date: string; assembly: string | null; url: string | null }>
    failed: string | null
  }
  faq: {
    items: Array<{
      question: string
      answer: string
      links?: PressKitPdfLink[]
      list?: Array<{ term: string; text: string }>
    }>
    upcomingTitle: string
    noUpcoming: string
    events: Array<{
      image: string | null
      name: string
      date: string
      location: string | null
      type: string | null
      url: string
    }>
    allEvents: PressKitPdfLink
    eventsFailed: string | null
  }
  contact: {
    intro: string
    mailboxes: Array<{ label: string; email: string; description: string }>
    peopleTitle: string
    phoneLabel: string
    people: Array<{ name: string; role: string; email: string | null; phone: string | null }>
    links: PressKitPdfLink[]
  }
}

export interface PressKitPdfAssets {
  /** Data URLs, keyed as the model refers to them. */
  images: Record<string, string>
  /** The CREUP logo in red, for cream pages, and in cream, for the red covers (SVG markup). */
  logoOnLight: string | null
  logoOnDark: string | null
}

const RED = '#792225'
const CREAM = '#F5EEE6'
const INK = '#221B1B'
const MUTED = '#6E6262'
const CARD = '#FFFFFF'
const PLACEHOLDER = '#EDE3D9'
/** The logo's three rings, drawn over the cover's red when there is no cover photo. */
const PATTERN = '#8E3438'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 54
const MARGIN_TOP = 92
const MARGIN_BOTTOM = 62
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
/** Space between the cards of a grid. */
const GAP = 8

/** Width of one card in a grid of `columns` across the text column. */
const columnWidth = (columns: number) => (CONTENT_WIDTH - GAP * (columns - 1)) / columns

/**
 * Sizes the images are drawn at, in points, so the browser can crop them to the same shape and
 * round their corners with the cards'.
 */
export const PRESS_KIT_PDF_LAYOUT = {
  contentWidth: CONTENT_WIDTH,
  heroHeight: CONTENT_WIDTH * (550 / 1925),
  cardImageWidth: columnWidth(3),
  cardRadius: CARD_RADIUS,
  pageColor: CREAM,
  page: { width: PAGE_WIDTH, height: PAGE_HEIGHT, marginBottom: MARGIN_BOTTOM },
} as const

const styles: StyleDictionary = {
  chapterTitle: { fontSize: 21, bold: true, color: INK, characterSpacing: 0.2 },
  subheading: { fontSize: 12.5, bold: true, color: INK, margin: [0, 16, 0, 6] },
  paragraph: { alignment: 'justify', margin: [0, 0, 0, 8] },
  muted: { color: MUTED },
  small: { fontSize: 8 },
  cardTitle: { fontSize: 8.3, bold: true, lineHeight: 1.12 },
  cardText: { fontSize: 7.3, color: MUTED, lineHeight: 1.12 },
  link: { color: RED, decoration: 'underline' },
  tocText: { fontSize: 11.5 },
  tocNumber: { fontSize: 11.5, bold: true, color: RED },
}

type CardRegistry = ReturnType<typeof createCardRegistry>
type CardCell = Parameters<CardRegistry['cardGrid']>[0][number]

/** What every chapter draws with: the model, the images and the document's card registry. */
interface Context {
  model: PressKitPdfModel
  images: Record<string, string>
  cards: CardRegistry
}

/**
 * Cards on the cream page, `columns` across the text column, after `lead` (a heading, say), which
 * stays on the page of their first row.
 */
function grid(
  context: Context,
  cells: Array<Content | CardCell>,
  columns: number,
  options: { padding?: number; bandColor?: string; lead?: Content[] } = {}
): Content {
  return context.cards.cardGrid(
    cells.map((cell) => (typeof cell === 'function' ? cell : () => cell)),
    {
      ...options,
      columns,
      gap: GAP,
      width: CONTENT_WIDTH,
      pageColor: CREAM,
      cardColor: CARD,
    }
  )
}

function paragraphs(texts: string[]): Content[] {
  return texts.map((text) => ({ text, style: 'paragraph' }))
}

/** What a chapter prints instead of a list that could not be loaded. */
function failureNotice(model: PressKitPdfModel, message: string): Content {
  return {
    text: [
      `${message} ${model.liveVersion.label} `,
      { text: model.liveVersion.link.label, link: model.liveVersion.link.url, style: 'link' },
    ],
    style: 'muted',
    italics: true,
    margin: [0, 0, 0, 8],
  }
}

function subheading(text: string): Content {
  return { text, style: 'subheading' }
}

function linkLine(link: PressKitPdfLink): Content {
  return {
    text: [
      { text: `${link.label}: `, bold: true },
      { text: link.url.replace(/^https?:\/\//, ''), link: link.url, style: 'link' },
    ],
    margin: [0, 0, 0, 3],
  }
}

/** The anchor of a chapter's heading, which the contents point at. */
const chapterId = (key: PressKitPdfSectionKey) => `chapter-${key}`

/** A chapter's opening: its number in red, its title in capitals, and a red rule. */
function chapterHeading(
  model: PressKitPdfModel,
  key: PressKitPdfSectionKey,
  options: { color?: string; ruleColor?: string } = {}
): Content[] {
  const section = model.sections[key]

  // The heading is the anchor the contents take the page from. pdfmake reads `id` on any text, but
  // its typings only allow it on plain-string text, hence the assertion.
  const heading = {
    id: chapterId(key),
    text: [
      { text: `${section.number}. `, color: options.ruleColor ?? RED },
      {
        text: section.title.toLocaleUpperCase(model.language),
        color: options.color ?? INK,
      },
    ],
    style: 'chapterTitle',
    outline: true,
    outlineText: `${section.number}. ${section.title}`,
  } as Content

  return [
    heading,
    {
      canvas: [{ type: 'rect', x: 0, y: 0, w: 46, h: 3, color: options.ruleColor ?? RED }],
      margin: [0, 6, 0, 14],
    },
  ]
}

/**
 * The image under `key`, or a placeholder of the same size. Images that top a card come with their
 * corners already rounded; the placeholder rounds the same `corners` itself.
 */
function imageOrPlaceholder(
  key: string | null,
  images: Record<string, string>,
  width: number,
  height: number,
  corners: 'none' | 'top' = 'none'
): Content {
  if (key && images[key]) {
    return { image: key, width, height }
  }

  if (corners === 'none') {
    return { canvas: [{ type: 'rect', x: 0, y: 0, w: width, h: height, color: PLACEHOLDER }] }
  }

  return {
    canvas: [
      { type: 'rect', x: 0, y: 0, w: width, h: height, r: CARD_RADIUS, color: PLACEHOLDER },
      {
        type: 'rect',
        x: 0,
        y: height - CARD_RADIUS,
        w: width,
        h: CARD_RADIUS,
        color: PLACEHOLDER,
      },
    ],
  }
}

function tileCard(tile: PressKitPdfTile, images: Record<string, string>): Content {
  const logoSize = 30

  return {
    columns: [
      { width: logoSize, stack: [imageOrPlaceholder(tile.image, images, logoSize, logoSize)] },
      {
        width: '*',
        stack: [
          { text: tile.title, style: 'cardTitle' },
          ...(tile.subtitle
            ? [{ text: tile.subtitle, style: 'cardText', margin: [0, 1.5, 0, 0] }]
            : []),
          ...(tile.details
            ? [{ text: tile.details, style: 'cardText', bold: true, margin: [0, 2, 0, 0] }]
            : []),
        ] as Content[],
      },
    ],
    columnGap: 7,
  }
}

/** A block of `width` set against the right margin, at `y`. */
function rightAligned(y: number, width: number, stack: Content[]): Content {
  return {
    columns: [{ width, stack }],
    absolutePosition: { x: PAGE_WIDTH - MARGIN_X - width, y },
  }
}

/**
 * CREUP red with the logo's three rings repeated across it, for a cover with no photo. It is an
 * SVG because the rings run off the edges: an SVG clips them to the page, and pdfmake will not draw
 * a canvas taller than the space left on it.
 */
function coverPattern(): string {
  const radius = 20
  const spacing = 92
  const rowHeight = spacing * 0.866
  // As in the logo: one ring above, two below that pass through each other's centres.
  const rings = [
    [0, -radius * 0.667],
    [-radius * 0.5, radius * 0.333],
    [radius * 0.5, radius * 0.333],
  ] as const
  const circles: string[] = []

  for (let row = 0; row * rowHeight < PAGE_HEIGHT + spacing; row++) {
    const y = row * rowHeight

    for (let x = row % 2 === 0 ? 0 : spacing / 2; x < PAGE_WIDTH + spacing; x += spacing) {
      for (const [dx, dy] of rings) {
        circles.push(
          `<circle cx="${(x + dx).toFixed(2)}" cy="${(y + dy).toFixed(2)}" r="${radius}"/>`
        )
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">`,
    `<rect x="0" y="0" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="${RED}"/>`,
    `<g fill="none" stroke="${PATTERN}" stroke-width="1.2">${circles.join('')}</g>`,
    '</svg>',
  ].join('')
}

function coverSection(model: PressKitPdfModel, assets: PressKitPdfAssets): Content {
  return {
    section: [
      rightAligned(78, 440, [
        {
          text: model.title.toLocaleUpperCase(model.language),
          fontSize: 32,
          bold: true,
          color: CREAM,
          alignment: 'right',
          characterSpacing: 0.4,
        },
        ...(assets.logoOnDark
          ? [{ svg: assets.logoOnDark, width: 210, alignment: 'right', margin: [0, 12, 0, 0] }]
          : []),
        {
          text: model.organizationName,
          fontSize: 9,
          color: CREAM,
          alignment: 'right',
          margin: [0, 10, 0, 0],
        },
      ] as Content[]),
      rightAligned(PAGE_HEIGHT - 170, 440, [
        {
          text: model.tagline.toLocaleUpperCase(model.language),
          fontSize: 22,
          bold: true,
          color: CREAM,
          alignment: 'right',
          lineHeight: 1.15,
        },
        {
          text: model.generatedOn,
          fontSize: 8.5,
          color: CREAM,
          alignment: 'right',
          margin: [0, 16, 0, 0],
        },
      ]),
    ],
    pageMargins: [0, 0, 0, 0],
    header: null,
    footer: null,
    // The cover photo comes tinted in CREUP red, so the title reads over it.
    background: () =>
      assets.images.cover
        ? { image: 'cover', width: PAGE_WIDTH, height: PAGE_HEIGHT }
        : { svg: coverPattern(), width: PAGE_WIDTH, height: PAGE_HEIGHT },
  }
}

function contentsChapter(model: PressKitPdfModel): Content[] {
  return [
    { text: model.contentsTitle.toLocaleUpperCase(model.language), style: 'chapterTitle' },
    {
      canvas: [{ type: 'rect', x: 0, y: 0, w: 46, h: 3, color: RED }],
      margin: [0, 6, 0, 22],
    },
    {
      table: {
        widths: ['*', 'auto'],
        body: (Object.keys(model.sections) as PressKitPdfSectionKey[])
          .sort((a, b) => model.sections[a].number - model.sections[b].number)
          .map((key): TableCell[] => [
            {
              text: `${model.sections[key].number}. ${model.sections[key].title}`,
              linkToDestination: chapterId(key),
              style: 'tocText',
            },
            { pageReference: chapterId(key), style: 'tocNumber', alignment: 'right' },
          ]),
      },
      layout: {
        defaultBorder: false,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
    },
    {
      text: [
        { text: `${model.liveVersion.label} ` },
        {
          text: model.liveVersion.link.label,
          link: model.liveVersion.link.url,
          style: 'link',
        },
      ],
      style: ['muted', 'small'],
      margin: [0, 28, 0, 0],
    },
  ]
}

function aboutChapter(context: Context): Content[] {
  const { model, images } = context
  const { about } = model

  return [
    ...chapterHeading(model, 'about'),
    grid(
      context,
      about.stats.map((stat) => ({
        stack: [
          { text: stat.value, fontSize: 20, bold: true, color: RED },
          { text: stat.label, style: 'cardText', margin: [0, 2, 0, 0] },
        ],
      })),
      3,
      { padding: 11 }
    ),
    { text: '', margin: [0, 0, 0, 14] },
    ...paragraphs(about.paragraphs),
    ...(images.hero
      ? [
          {
            image: 'hero',
            width: CONTENT_WIDTH,
            height: PRESS_KIT_PDF_LAYOUT.heroHeight,
            margin: [0, 8, 0, 0],
          } as Content,
        ]
      : []),
  ]
}

function philosophyChapter(context: Context): Content[] {
  const { model } = context
  const { philosophy } = model

  return [
    ...chapterHeading(model, 'philosophy'),
    grid(
      context,
      philosophy.statements.map((statement) => ({
        stack: [
          { text: statement.title, fontSize: 13, bold: true, color: RED },
          {
            text: statement.text,
            alignment: 'justify',
            margin: [0, 5, 0, 0],
            lineHeight: 1.25,
          },
        ],
      })),
      2,
      { padding: 12 }
    ),
    grid(
      context,
      philosophy.values.map((value) => ({
        stack: [
          { text: value.title, fontSize: 10, bold: true, color: RED },
          { text: value.description, style: 'cardText', margin: [0, 3, 0, 0], lineHeight: 1.25 },
        ],
      })),
      3,
      {
        padding: 10,
        lead: [
          subheading(philosophy.valuesTitle),
          { text: philosophy.valuesDescription, style: ['paragraph', 'muted'] },
        ],
      }
    ),
  ]
}

function tilesChapter(context: Context, key: 'members' | 'sectorials', empty?: string): Content[] {
  const { model, images } = context
  const { intro, tiles, failed } = model[key]

  // A failed list says so, and nothing that depends on it (the members intro states the count).
  if (failed) {
    return [...chapterHeading(model, key), failureNotice(model, failed)]
  }

  return [
    ...chapterHeading(model, key),
    { text: intro, style: 'paragraph', margin: [0, 0, 0, 10] },
    tiles.length > 0
      ? grid(
          context,
          tiles.map((tile) => tileCard(tile, images)),
          3,
          { padding: 6 }
        )
      : { text: empty ?? '', style: 'muted' },
  ]
}

function executiveChapter(context: Context): Content[] {
  const { model, images } = context
  const photoSize = 60

  const personBody = (person: PressKitPdfPerson): Content => ({
    columns: [
      {
        width: photoSize,
        stack: [imageOrPlaceholder(person.image, images, photoSize, photoSize)],
      },
      {
        width: '*',
        stack: [
          {
            text: person.name.toLocaleUpperCase(model.language),
            fontSize: 11,
            bold: true,
            color: INK,
          },
          ...(person.degree
            ? [{ text: person.degree, style: 'cardText', margin: [0, 3, 0, 0] }]
            : []),
          ...(person.university ? [{ text: person.university, style: 'cardText' }] : []),
          ...(person.email
            ? [
                {
                  text: person.email,
                  link: `mailto:${person.email}`,
                  fontSize: 8,
                  bold: true,
                  color: RED,
                  margin: [0, 3, 0, 0],
                },
              ]
            : []),
        ] as Content[],
        margin: [0, 6, 0, 0],
      },
    ],
    columnGap: 10,
    margin: [10, 10, 10, 10],
  })

  const roleBar = (person: PressKitPdfPerson): Content => ({
    text: person.role.toLocaleUpperCase(model.language),
    color: CREAM,
    bold: true,
    fontSize: 8.2,
    alignment: 'center',
    margin: [8, 5, 8, 5],
  })

  // The red bar and the white body are the two rows of a table that only paints them when the card
  // could not be measured; a measured card gets both, rounded, from the page background. The
  // layout is the same either way, so both passes place everything at the same spot. The table
  // is as wide as the card: with a flexible width, a long email would widen the whole grid.
  const personCard =
    (person: PressKitPdfPerson): CardCell =>
    ({ bandEnd, measured }) => ({
      table: {
        widths: [columnWidth(2)],
        body: [[roleBar(person)], [{ stack: [bandEnd, personBody(person)] }]],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
        fillColor: (row) => (measured ? null : row === 0 ? RED : CARD),
      },
    })

  return [
    ...chapterHeading(model, 'executive'),
    { text: model.executive.intro, style: 'paragraph', margin: [0, 0, 0, 12] },
    ...(model.executive.failed
      ? [failureNotice(model, model.executive.failed)]
      : model.executive.people.length > 0
        ? [
            grid(context, model.executive.people.map(personCard), 2, {
              padding: 0,
              bandColor: RED,
            }),
          ]
        : []),
  ]
}

function organizationChapter(context: Context): Content[] {
  const { model, images } = context
  const { organization } = model
  const photoSize = 26
  const padding = 10
  const columnGap = 12

  const personLine = (person: PressKitPdfAreaPerson, strong: boolean): Content => ({
    stack: [
      { text: person.name, fontSize: strong ? 9.4 : 8.8, bold: strong },
      ...(person.role ? [{ text: person.role, fontSize: 7.8, color: MUTED }] : []),
    ],
    margin: [0, 0, 0, strong ? 0 : 5],
  })

  const label = (text: string): Content => ({
    text: text.toLocaleUpperCase(model.language),
    fontSize: 7.4,
    bold: true,
    color: RED,
    characterSpacing: 0.3,
  })

  const committeesLead: Content[] = [
    subheading(organization.committeesTitle),
    { text: organization.committeesDescription, style: ['paragraph', 'muted'] },
  ]

  // One card per area: its responsible beside the members who report to them, under the labels of
  // the two commissions they sit on.
  const areaCards = organization.areas.map(
    (area): Content => ({
      columns: [
        {
          width: '40%',
          stack: [
            {
              text: area.name.toLocaleUpperCase(model.language),
              fontSize: 7.4,
              bold: true,
              color: RED,
              characterSpacing: 0.2,
              margin: [0, 0, 0, 5],
            },
            area.responsible
              ? {
                  columns: [
                    {
                      width: photoSize,
                      stack: [
                        imageOrPlaceholder(area.responsible.image, images, photoSize, photoSize),
                      ],
                    },
                    { width: '*', stack: [personLine(area.responsible, true)] },
                  ],
                  columnGap: 7,
                }
              : { text: organization.noResponsible, fontSize: 8.4, color: MUTED },
          ] as Content[],
        },
        {
          width: '*',
          stack: area.members.map((member) => personLine(member, false)),
          margin: [0, 12, 0, 0],
        },
      ],
      columnGap,
    })
  )

  return [
    ...chapterHeading(model, 'organization'),
    { text: organization.intro, style: 'paragraph', margin: [0, 0, 0, 12] },
    // The labels are the header row of a table around the cards, which pdfmake repeats on every
    // page the cards continue on. Only the header row is unbreakable: the cards must not be.
    organization.failed
      ? failureNotice(model, organization.failed)
      : {
          table: {
            widths: ['*'],
            headerRows: 1,
            body: [
              [
                {
                  columns: [
                    { width: '40%', ...(label(organization.executiveLabel) as object) },
                    { width: '*', ...(label(organization.extendedLabel) as object) },
                  ],
                  columnGap,
                  margin: [padding, 0, padding, 6],
                } as TableCell,
              ],
              [grid(context, areaCards, 1, { padding })],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
        },
    ...(organization.committeesFailed
      ? [...committeesLead, failureNotice(model, organization.committeesFailed)]
      : organization.committees.length > 0
        ? [
            grid(
              context,
              organization.committees.map((committee) => ({
                stack: [
                  { text: committee.name, style: 'cardTitle', fontSize: 9.4 },
                  {
                    text: [
                      { text: `${organization.responsibleLabel}: `, color: MUTED },
                      committee.responsibleName ?? organization.noResponsible,
                    ],
                    fontSize: 8.2,
                    margin: [0, 3, 0, 0],
                  },
                ],
              })),
              2,
              { padding: 10, lead: committeesLead }
            ),
          ]
        : []),
  ]
}

/** A card topped by an image that links where its title does. */
function imageCard(
  images: Record<string, string>,
  image: string | null,
  height: number,
  url: string,
  body: Content[]
): Content {
  const width = PRESS_KIT_PDF_LAYOUT.cardImageWidth

  return {
    stack: [
      {
        ...(imageOrPlaceholder(image, images, width, height, 'top') as object),
        link: url,
      } as Content,
      { stack: body, margin: [8, 7, 8, 9] },
    ],
  }
}

function pressRoomChapter(context: Context): Content[] {
  const { model, images } = context
  const { pressRoom } = model
  const height = PRESS_KIT_PDF_LAYOUT.cardImageWidth * (9 / 16)

  return [
    ...chapterHeading(model, 'pressRoom'),
    ...paragraphs(pressRoom.paragraphs),
    ...(pressRoom.failed
      ? [subheading(pressRoom.latestTitle), failureNotice(model, pressRoom.failed)]
      : pressRoom.articles.length > 0
        ? [
            grid(
              context,
              pressRoom.articles.map((article) =>
                imageCard(images, article.image, height, article.url, [
                  { text: article.meta, fontSize: 7, color: MUTED },
                  {
                    text: article.title,
                    link: article.url,
                    fontSize: 8.6,
                    bold: true,
                    lineHeight: 1.15,
                    margin: [0, 3, 0, 0],
                  },
                ])
              ),
              3,
              { padding: 0, lead: [subheading(pressRoom.latestTitle)] }
            ),
          ]
        : [subheading(pressRoom.latestTitle), { text: pressRoom.empty, style: 'muted' }]),
    { text: '', margin: [0, 0, 0, 10] },
    linkLine(pressRoom.allNews),
  ]
}

function positionsChapter(model: PressKitPdfModel): Content[] {
  const { positions } = model

  return [
    ...chapterHeading(model, 'positions'),
    ...paragraphs(positions.paragraphs),
    ...positions.links.map(linkLine),
    subheading(positions.listTitle),
    positions.failed
      ? failureNotice(model, positions.failed)
      : positions.documents.length > 0
        ? {
            ul: positions.documents.map((document) => ({
              stack: [
                document.url
                  ? { text: document.name, link: document.url, bold: true, color: INK }
                  : { text: document.name, bold: true },
                {
                  text: [document.date, document.assembly].filter(Boolean).join(' · '),
                  fontSize: 8,
                  color: MUTED,
                  margin: [0, 1, 0, 0],
                },
              ],
              margin: [0, 0, 0, 7],
            })),
            markerColor: RED,
          }
        : { text: positions.empty, style: 'muted' },
  ]
}

function faqChapter(context: Context): Content[] {
  const { model, images } = context
  const { faq } = model
  const height = PRESS_KIT_PDF_LAYOUT.cardImageWidth * (2 / 7)

  return [
    ...chapterHeading(model, 'faq'),
    ...faq.items.map(
      (item): Content => ({
        stack: [
          { text: item.question, fontSize: 11, bold: true, margin: [0, 0, 0, 3] },
          { text: item.answer, alignment: 'justify' },
          ...(item.links ?? []).map(linkLine),
          ...(item.list
            ? [
                {
                  ul: item.list.map((entry) => ({
                    text: [{ text: `${entry.term}: `, bold: true }, entry.text],
                    alignment: 'justify',
                    margin: [0, 2, 0, 0],
                  })),
                  markerColor: RED,
                  margin: [0, 4, 0, 0],
                },
              ]
            : []),
        ] as Content[],
        unbreakable: true,
        margin: [0, 0, 0, 10],
      })
    ),
    // The upcoming events stay on one page with their heading and the link to the rest.
    context.cards.keepTogether({
      stack: [
        subheading(faq.upcomingTitle),
        faq.eventsFailed
          ? failureNotice(model, faq.eventsFailed)
          : faq.events.length > 0
            ? grid(
                context,
                faq.events.map((event) =>
                  imageCard(images, event.image, height, event.url, [
                    {
                      text: event.name,
                      link: event.url,
                      fontSize: 9,
                      bold: true,
                      lineHeight: 1.15,
                    },
                    { text: event.date, style: 'cardText', margin: [0, 3, 0, 0] },
                    ...(event.location ? [{ text: event.location, style: 'cardText' }] : []),
                    ...(event.type ? [{ text: event.type, style: 'cardText', bold: true }] : []),
                  ] as Content[])
                ),
                3,
                { padding: 0 }
              )
            : { text: faq.noUpcoming, style: 'muted' },
        { text: '', margin: [0, 0, 0, 10] },
        linkLine(faq.allEvents),
      ] as Content[],
    }),
  ]
}

function contactSection(model: PressKitPdfModel, assets: PressKitPdfAssets): Content {
  const { contact } = model

  return {
    section: [
      ...chapterHeading(model, 'contact', { color: CREAM, ruleColor: CREAM }),
      { text: contact.intro, color: CREAM, margin: [0, 0, 0, 16] },
      {
        columns: contact.mailboxes.map((mailbox) => ({
          stack: [
            { text: mailbox.label, bold: true, fontSize: 11, color: CREAM },
            {
              text: mailbox.email,
              link: `mailto:${mailbox.email}`,
              fontSize: 13,
              bold: true,
              color: CREAM,
              decoration: 'underline',
              margin: [0, 3, 0, 3],
            },
            { text: mailbox.description, fontSize: 8.6, color: CREAM, opacity: 0.85 },
          ],
        })),
        columnGap: 24,
      },
      ...(contact.people.length > 0
        ? ([
            {
              text: contact.peopleTitle,
              fontSize: 12.5,
              bold: true,
              color: CREAM,
              margin: [0, 26, 0, 10],
            },
            ...contact.people.map(
              (person): Content => ({
                stack: [
                  {
                    text: [
                      { text: person.name, bold: true },
                      { text: ` · ${person.role}`, opacity: 0.85 },
                    ],
                    fontSize: 10.4,
                  },
                  {
                    text: [
                      ...(person.email
                        ? [{ text: person.email, link: `mailto:${person.email}` }]
                        : []),
                      ...(person.email && person.phone ? [{ text: '   ·   ' }] : []),
                      ...(person.phone
                        ? [
                            {
                              text: `${contact.phoneLabel}: ${person.phone}`,
                              link: `tel:${person.phone.replace(/\s+/g, '')}`,
                            },
                          ]
                        : []),
                    ],
                    fontSize: 9.4,
                    margin: [0, 2, 0, 0],
                  },
                ],
                color: CREAM,
                margin: [0, 0, 0, 10],
              })
            ),
          ] as Content[])
        : []),
      {
        stack: contact.links.map((link) => ({
          text: [
            { text: `${link.label}: `, bold: true },
            { text: link.url.replace(/^https?:\/\//, ''), link: link.url, decoration: 'underline' },
          ],
          color: CREAM,
          fontSize: 9.4,
          margin: [0, 0, 0, 4],
        })),
        margin: [0, 18, 0, 0],
      },
      ...(assets.logoOnDark
        ? [
            {
              svg: assets.logoOnDark,
              width: 230,
              absolutePosition: { x: PAGE_WIDTH - MARGIN_X - 230, y: PAGE_HEIGHT - 120 },
            } as Content,
          ]
        : []),
    ],
    pageMargins: [MARGIN_X, 70, MARGIN_X, MARGIN_BOTTOM],
    header: null,
    footer: null,
    background: () => ({
      canvas: [{ type: 'rect', x: 0, y: 0, w: PAGE_WIDTH, h: PAGE_HEIGHT, color: RED }],
    }),
  }
}

export interface PressKitPdfBuildOptions {
  /** Rounded backgrounds measured on a previous pass of the same model. */
  boxes?: CardBox[]
  /** Receives where each card marker lands, to measure the cards for the next pass. */
  markerPositions?: Map<string, MarkerPosition>
}

/**
 * The document definition, and the measure that turns the marker positions recorded while laying
 * it out into the cards' rounded backgrounds for the next build of the same model.
 */
export function buildPressKitDocument(
  model: PressKitPdfModel,
  assets: PressKitPdfAssets,
  options: PressKitPdfBuildOptions = {}
) {
  const boxes = options.boxes ?? []
  const cards = createCardRegistry(boxes)
  const context: Context = { model, images: assets.images, cards }
  const chapterBreak = (content: Content[]): Content => ({ stack: content, pageBreak: 'before' })

  const definition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [MARGIN_X, MARGIN_TOP, MARGIN_X, MARGIN_BOTTOM],
    language: model.language,
    info: {
      title: `CREUP · ${model.title}`,
      author: 'CREUP',
      subject: model.tagline,
      creator: 'CREUP',
    },
    images: assets.images,
    styles,
    defaultStyle: { font: 'Raleway', fontSize: 9.6, lineHeight: 1.3, color: INK },
    content: [
      coverSection(model, assets),
      {
        section: [
          ...contentsChapter(model),
          chapterBreak(aboutChapter(context)),
          chapterBreak(philosophyChapter(context)),
          chapterBreak(tilesChapter(context, 'members')),
          chapterBreak(tilesChapter(context, 'sectorials', model.sectorials.empty)),
          chapterBreak(executiveChapter(context)),
          chapterBreak(organizationChapter(context)),
          chapterBreak(pressRoomChapter(context)),
          chapterBreak(positionsChapter(model)),
          chapterBreak(faqChapter(context)),
        ],
        header: () => ({
          columns: [
            { text: '' },
            assets.logoOnLight
              ? { svg: assets.logoOnLight, width: 108 }
              : { text: 'CREUP', bold: true, color: RED, fontSize: 16 },
          ],
          margin: [MARGIN_X, 34, MARGIN_X, 0],
        }),
        footer: (currentPage) => ({
          columns: [
            { text: model.footer, fontSize: 7.6, color: MUTED },
            { text: String(currentPage), fontSize: 8, bold: true, color: RED, alignment: 'right' },
          ],
          margin: [MARGIN_X, 24, MARGIN_X, 0],
        }),
        background: (currentPage) => ({
          canvas: [
            { type: 'rect', x: 0, y: 0, w: PAGE_WIDTH, h: PAGE_HEIGHT, color: CREAM },
            ...cardBackgrounds(boxes, currentPage),
          ],
        }),
      },
      contactSection(model, assets),
    ],
    // pdfmake calls this with every node's position once laid out, which is how the cards are
    // measured and kept on one page.
    pageBreakBefore: cards.pageBreakBefore(options.markerPositions),
  }

  return {
    definition,
    measure: (positions: Map<string, MarkerPosition>) =>
      cards.measure(positions, PRESS_KIT_PDF_LAYOUT.page),
  }
}
