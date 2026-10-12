import type {
  Content,
  CustomTableLayout,
  StyleDictionary,
  TDocumentDefinitions,
  TableCell,
} from 'pdfmake/interfaces'

/**
 * The press kit as a PDF document definition for pdfmake. It follows the layout of the PDF dossier
 * CREUP used to upload: a cover over the group photo tinted in CREUP red, cream pages with the
 * logo at the top, one chapter per section, the Executive Committee under red bars, and the
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
const LINE = '#E4D8CD'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 54
const MARGIN_TOP = 92
const MARGIN_BOTTOM = 62
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
/** Space between the cards of a grid. */
const GAP = 8

/** Cards per row in each grid, and the width of one card. */
const columnWidth = (columns: number) => (CONTENT_WIDTH - GAP * (columns - 1)) / columns

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

/**
 * Cards in a grid: a table whose rules are as wide as the gap and coloured like the page, so the
 * cells read as separate white cards of the same height in each row.
 */
function cardGridLayout(
  columns: number,
  rows: number,
  padding: number,
  fill: string | null
): CustomTableLayout {
  return {
    hLineWidth: (index) => (index === 0 || index === rows ? 0 : GAP),
    vLineWidth: (index) => (index === 0 || index === columns ? 0 : GAP),
    hLineColor: () => CREAM,
    vLineColor: () => CREAM,
    fillColor: () => fill,
    paddingLeft: () => padding,
    paddingRight: () => padding,
    paddingTop: () => padding,
    paddingBottom: () => padding,
  }
}

function cardGrid(
  cells: Content[],
  columns: number,
  padding = 8,
  fill: string | null = CARD
): Content {
  // pdfmake still draws a table with no rows as one empty cell.
  if (cells.length === 0) {
    return { text: '' }
  }

  const rows: TableCell[][] = []

  for (let index = 0; index < cells.length; index += columns) {
    const row: TableCell[] = cells.slice(index, index + columns)

    while (row.length < columns) {
      row.push({ text: '', fillColor: CREAM })
    }

    rows.push(row)
  }

  return {
    table: {
      widths: Array.from({ length: columns }, () => '*'),
      body: rows,
      dontBreakRows: true,
    },
    layout: cardGridLayout(columns, rows.length, padding, fill),
  }
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

function imageOrPlaceholder(
  key: string | null,
  images: Record<string, string>,
  width: number,
  height: number
): Content {
  if (key && images[key]) {
    return { image: key, width, height }
  }

  return {
    canvas: [{ type: 'rect', x: 0, y: 0, w: width, h: height, color: '#EDE3D9' }],
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

/** Height of the group photo band on the cover, full width at the banner's 1925:810 crop. */
const COVER_PHOTO_HEIGHT = PAGE_WIDTH * (810 / 1925)

/** A block of `width` set against the right margin, at `y`. */
function rightAligned(y: number, width: number, stack: Content[]): Content {
  return {
    columns: [{ width, stack }],
    absolutePosition: { x: PAGE_WIDTH - MARGIN_X - width, y },
  }
}

function coverSection(model: PressKitPdfModel, assets: PressKitPdfAssets): Content {
  const photoTop = 300

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
      ...(assets.images.cover
        ? [
            {
              image: 'cover',
              width: PAGE_WIDTH,
              height: COVER_PHOTO_HEIGHT,
              absolutePosition: { x: 0, y: photoTop },
            } as Content,
          ]
        : []),
      rightAligned(photoTop + COVER_PHOTO_HEIGHT + 56, 440, [
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
    background: () => ({
      canvas: [{ type: 'rect', x: 0, y: 0, w: PAGE_WIDTH, h: PAGE_HEIGHT, color: RED }],
    }),
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

function aboutChapter(model: PressKitPdfModel, images: Record<string, string>): Content[] {
  const { about } = model

  return [
    ...chapterHeading(model, 'about'),
    cardGrid(
      about.stats.map((stat) => ({
        stack: [
          { text: stat.value, fontSize: 20, bold: true, color: RED },
          { text: stat.label, style: 'cardText', margin: [0, 2, 0, 0] },
        ],
      })),
      3,
      11
    ),
    { text: '', margin: [0, 0, 0, 14] },
    ...paragraphs(about.paragraphs),
    ...(images.hero
      ? [
          {
            image: 'hero',
            width: CONTENT_WIDTH,
            height: CONTENT_WIDTH * (550 / 1925),
            margin: [0, 8, 0, 0],
          } as Content,
        ]
      : []),
  ]
}

function philosophyChapter(model: PressKitPdfModel): Content[] {
  const { philosophy } = model

  return [
    ...chapterHeading(model, 'philosophy'),
    cardGrid(
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
      12
    ),
    subheading(philosophy.valuesTitle),
    { text: philosophy.valuesDescription, style: ['paragraph', 'muted'] },
    cardGrid(
      philosophy.values.map((value) => ({
        stack: [
          { text: value.title, fontSize: 10, bold: true, color: RED },
          { text: value.description, style: 'cardText', margin: [0, 3, 0, 0], lineHeight: 1.25 },
        ],
      })),
      3,
      10
    ),
  ]
}

function tilesChapter(
  model: PressKitPdfModel,
  key: 'members' | 'sectorials',
  images: Record<string, string>,
  empty?: string
): Content[] {
  const { intro, tiles, failed } = model[key]

  // A failed list says so, and nothing that depends on it (the members intro states the count).
  if (failed) {
    return [...chapterHeading(model, key), failureNotice(model, failed)]
  }

  return [
    ...chapterHeading(model, key),
    { text: intro, style: 'paragraph', margin: [0, 0, 0, 10] },
    tiles.length > 0
      ? cardGrid(
          tiles.map((tile) => tileCard(tile, images)),
          3,
          6
        )
      : { text: empty ?? '', style: 'muted' },
  ]
}

function executiveChapter(model: PressKitPdfModel, images: Record<string, string>): Content[] {
  const photoSize = 60
  const cardWidth = columnWidth(2)

  const personCard = (person: PressKitPdfPerson): Content => ({
    table: {
      widths: [cardWidth],
      body: [
        [
          {
            text: person.role.toLocaleUpperCase(model.language),
            fillColor: RED,
            color: CREAM,
            bold: true,
            fontSize: 8.2,
            alignment: 'center',
            margin: [8, 4, 8, 4],
          },
        ],
        [
          {
            fillColor: CARD,
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
          },
        ],
      ],
    },
    layout: {
      defaultBorder: false,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  })

  return [
    ...chapterHeading(model, 'executive'),
    { text: model.executive.intro, style: 'paragraph', margin: [0, 0, 0, 12] },
    ...(model.executive.failed
      ? [failureNotice(model, model.executive.failed)]
      : model.executive.people.length > 0
        ? [cardGrid(model.executive.people.map(personCard), 2, 0, null)]
        : []),
  ]
}

function organizationChapter(model: PressKitPdfModel, images: Record<string, string>): Content[] {
  const { organization } = model
  const photoSize = 26

  const personLine = (person: PressKitPdfAreaPerson, strong: boolean): Content => ({
    stack: [
      { text: person.name, fontSize: strong ? 9.4 : 8.8, bold: strong },
      ...(person.role ? [{ text: person.role, fontSize: 7.8, color: MUTED }] : []),
    ],
    margin: [0, 0, 0, strong ? 0 : 5],
  })

  const headerCell = (text: string): TableCell => ({
    text: text.toLocaleUpperCase(model.language),
    fontSize: 7.6,
    bold: true,
    color: CREAM,
    fillColor: RED,
    characterSpacing: 0.3,
  })

  const body: TableCell[][] = [
    [headerCell(organization.executiveLabel), headerCell(organization.extendedLabel)],
    ...organization.areas.map((area): TableCell[] => [
      {
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
        stack: area.members.map((member) => personLine(member, false)),
        margin: [0, 12, 0, 0],
      },
    ]),
  ]

  return [
    ...chapterHeading(model, 'organization'),
    { text: organization.intro, style: 'paragraph', margin: [0, 0, 0, 12] },
    organization.failed
      ? failureNotice(model, organization.failed)
      : {
          table: { widths: ['40%', '*'], headerRows: 1, dontBreakRows: true, body },
          layout: {
            hLineWidth: (index, node) =>
              index === 0 || index === node.table.body.length ? 0 : 0.7,
            vLineWidth: () => 0,
            hLineColor: () => LINE,
            fillColor: (rowIndex) => (rowIndex === 0 ? RED : CARD),
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: (index) => (index === 0 ? 6 : 9),
            paddingBottom: (index) => (index === 0 ? 6 : 8),
          },
        },
    ...(organization.committeesFailed || organization.committees.length > 0
      ? [
          subheading(organization.committeesTitle),
          { text: organization.committeesDescription, style: ['paragraph', 'muted'] },
        ]
      : []),
    organization.committeesFailed
      ? failureNotice(model, organization.committeesFailed)
      : organization.committees.length === 0
        ? { text: '' }
        : cardGrid(
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
            10
          ),
  ]
}

function pressRoomChapter(model: PressKitPdfModel, images: Record<string, string>): Content[] {
  const { pressRoom } = model
  const width = columnWidth(3)
  const height = width * (9 / 16)

  return [
    ...chapterHeading(model, 'pressRoom'),
    ...paragraphs(pressRoom.paragraphs),
    subheading(pressRoom.latestTitle),
    pressRoom.failed
      ? failureNotice(model, pressRoom.failed)
      : pressRoom.articles.length > 0
        ? cardGrid(
            pressRoom.articles.map((article) => ({
              stack: [
                {
                  ...(imageOrPlaceholder(article.image, images, width, height) as object),
                  link: article.url,
                } as Content,
                {
                  stack: [
                    { text: article.meta, fontSize: 7, color: MUTED },
                    {
                      text: article.title,
                      link: article.url,
                      fontSize: 8.6,
                      bold: true,
                      lineHeight: 1.15,
                      margin: [0, 3, 0, 0],
                    },
                  ],
                  margin: [8, 7, 8, 9],
                },
              ],
            })),
            3,
            0
          )
        : { text: pressRoom.empty, style: 'muted' },
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

function faqChapter(model: PressKitPdfModel, images: Record<string, string>): Content[] {
  const { faq } = model
  const width = columnWidth(3)
  const height = width * (2 / 7)

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
    {
      stack: [
        subheading(faq.upcomingTitle),
        faq.eventsFailed
          ? failureNotice(model, faq.eventsFailed)
          : faq.events.length > 0
            ? cardGrid(
                faq.events.map((event) => ({
                  stack: [
                    {
                      ...(imageOrPlaceholder(event.image, images, width, height) as object),
                      link: event.url,
                    } as Content,
                    {
                      stack: [
                        {
                          text: event.name,
                          link: event.url,
                          fontSize: 9,
                          bold: true,
                          lineHeight: 1.15,
                        },
                        { text: event.date, style: 'cardText', margin: [0, 3, 0, 0] },
                        ...(event.location ? [{ text: event.location, style: 'cardText' }] : []),
                        ...(event.type
                          ? [{ text: event.type, style: 'cardText', bold: true }]
                          : []),
                      ] as Content[],
                      margin: [8, 7, 8, 9],
                    },
                  ],
                })),
                3,
                0
              )
            : { text: faq.noUpcoming, style: 'muted' },
        { text: '', margin: [0, 0, 0, 10] },
        linkLine(faq.allEvents),
      ] as Content[],
      unbreakable: true,
    },
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

export function buildPressKitDocument(
  model: PressKitPdfModel,
  assets: PressKitPdfAssets
): TDocumentDefinitions {
  const { images } = assets

  const chapterBreak = (content: Content[]): Content => ({ stack: content, pageBreak: 'before' })

  return {
    pageSize: 'A4',
    pageMargins: [MARGIN_X, MARGIN_TOP, MARGIN_X, MARGIN_BOTTOM],
    language: model.language,
    info: {
      title: `CREUP · ${model.title}`,
      author: 'CREUP',
      subject: model.tagline,
      creator: 'CREUP',
    },
    images,
    styles,
    defaultStyle: { font: 'Raleway', fontSize: 9.6, lineHeight: 1.3, color: INK },
    content: [
      coverSection(model, assets),
      {
        section: [
          ...contentsChapter(model),
          chapterBreak(aboutChapter(model, images)),
          chapterBreak(philosophyChapter(model)),
          chapterBreak(tilesChapter(model, 'members', images)),
          chapterBreak(tilesChapter(model, 'sectorials', images, model.sectorials.empty)),
          chapterBreak(executiveChapter(model, images)),
          chapterBreak(organizationChapter(model, images)),
          chapterBreak(pressRoomChapter(model, images)),
          chapterBreak(positionsChapter(model)),
          chapterBreak(faqChapter(model, images)),
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
        background: () => ({
          canvas: [{ type: 'rect', x: 0, y: 0, w: PAGE_WIDTH, h: PAGE_HEIGHT, color: CREAM }],
        }),
      },
      contactSection(model, assets),
    ],
  }
}
