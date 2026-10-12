import type {
  CanvasElement,
  Content,
  CustomTableLayout,
  Node,
  TDocumentDefinitions,
  TableCell,
} from 'pdfmake/interfaces'

/**
 * Rounded cards for the press kit PDF. pdfmake fills table cells with plain rectangles and has no
 * corner radius for them, so the document is laid out twice: the first pass records where each
 * card starts and ends (invisible markers in it, read back through `pageBreakBefore`), and the
 * second draws a rounded rectangle behind each one from the page background. A card that could not
 * be measured keeps a square white fill instead, so no card is ever left without its background.
 *
 * pdfmake reports the position of whatever is inside an unbreakable block (`unbreakable`,
 * `dontBreakRows`) as that of the block, so nothing holding cards may be one. Each row of cards is
 * its own table instead, kept on one page by breaking before it when it would split; any other
 * block can be kept together the same way with `keepTogether`.
 */

export const CARD_RADIUS = 8

/** Where a marker landed, as pdfmake reports a node's start position. */
export interface MarkerPosition {
  pageNumber: number
  left: number
  top: number
}

/** A card's rounded background, in page coordinates. */
export interface CardBox {
  cardId: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  color: string
  /** Height of a band at the top painted `bandColor`, with the card's top corners. */
  band?: { height: number; color: string }
}

interface CardSpec {
  id: string
  /** The row of cards it is in, across all grids. */
  row: number
  width: number
  padding: number
  color: string
  band: string | null
}

const MARKER_PREFIX = 'card-'
const KEEP_PREFIX = 'keep-'

/** An invisible, zero-height line whose position pdfmake reports. */
function marker(id: string): Content {
  return { text: ' ', id, fontSize: 1, lineHeight: 0.01 }
}

export interface CardGridOptions {
  columns: number
  /** Inner padding of each card. */
  padding?: number
  /** Space between cards; also the width of the rules that separate them. */
  gap: number
  /** Width of the column the grid fills. */
  width: number
  /** Colour of the page behind the grid, which the rules between cards take. */
  pageColor: string
  cardColor: string
  /** Paints the top of each card in this colour, down to the marker `bandEnd` returns. */
  bandColor?: string
  /** What goes before the grid, such as its heading, kept on the page of its first row. */
  lead?: Content[]
}

/**
 * Collects the cards of one document, numbers them the same way on both passes, and turns the
 * first pass's marker positions into the boxes the second pass draws.
 */
export function createCardRegistry(boxes: CardBox[] = []) {
  const specs: CardSpec[] = []
  const measured = new Set(boxes.map((box) => box.cardId))
  let cards = 0
  let rows = 0
  let blocks = 0

  /** Keeps `content` on one page, moving it to the next when it would split. */
  function keepTogether(content: Content): Content {
    return { stack: [content], id: `${KEEP_PREFIX}${blocks++}` } as Content
  }

  /**
   * Cards in a grid, one table per row: rules as wide as the gap and coloured like the page set
   * the cells apart as cards of the same height. Each cell is built by a function that gets the
   * `bandEnd` marker, which closes the coloured band of cards that have one, and whether the card
   * was measured. A card with a band paints its own square background when it was not: pdfmake
   * would paint the cell's fill over that of any table nested in it.
   */
  function cardGrid(
    cells: Array<(card: { bandEnd: Content; measured: boolean }) => Content>,
    options: CardGridOptions
  ): Content {
    const padding = options.padding ?? 8
    const cardWidth = (options.width - options.gap * (options.columns - 1)) / options.columns
    const rowTables: Content[] = []

    for (let start = 0; start < cells.length; start += options.columns) {
      const row = rows++
      const ids: string[] = []
      const body: TableCell[] = cells.slice(start, start + options.columns).map((cell) => {
        const id = `${MARKER_PREFIX}${cards++}`
        ids.push(id)
        specs.push({
          id,
          row,
          width: cardWidth,
          padding,
          color: options.cardColor,
          band: options.bandColor ?? null,
        })

        return {
          stack: [
            marker(`${id}-top`),
            cell({ bandEnd: marker(`${id}-band`), measured: measured.has(id) }),
            marker(`${id}-end`),
          ],
        }
      })

      while (body.length < options.columns) {
        body.push({ text: '' })
      }

      const layout: CustomTableLayout = {
        hLineWidth: () => 0,
        vLineWidth: (index) => (index === 0 || index === options.columns ? 0 : options.gap),
        vLineColor: () => options.pageColor,
        // Measured cards are drawn rounded from the background; the rest keep a square fill.
        fillColor: (_rowIndex, _node, columnIndex) => {
          const id = columnIndex === undefined ? undefined : ids[columnIndex]
          return id && !measured.has(id) && !options.bandColor ? options.cardColor : null
        },
        paddingLeft: () => padding,
        paddingRight: () => padding,
        paddingTop: () => padding,
        paddingBottom: () => padding,
      }

      const table: Content = {
        table: { widths: Array.from({ length: options.columns }, () => '*'), body: [body] },
        layout,
      }

      rowTables.push(
        start === 0
          ? keepTogether({ stack: [...(options.lead ?? []), table] })
          : ({ ...(keepTogether(table) as object), margin: [0, options.gap, 0, 0] } as Content)
      )
    }

    return { stack: rowTables.length > 0 ? rowTables : (options.lead ?? []) }
  }

  /**
   * The rounded boxes behind the cards, from where the first pass placed their markers. Cards in a
   * row share the height of the tallest, as the cells of its table do. A card split across pages
   * (only one taller than a page can be) is left to its square fill.
   */
  function measure(
    positions: Map<string, MarkerPosition>,
    page: { height: number; marginBottom: number }
  ): CardBox[] {
    const placed = specs.flatMap((spec) => {
      const top = positions.get(`${spec.id}-top`)
      const end = positions.get(`${spec.id}-end`)
      return top && end && top.pageNumber === end.pageNumber ? [{ spec, top, end }] : []
    })
    const rowBottoms = new Map<number, number>()

    for (const { spec, end } of placed) {
      rowBottoms.set(spec.row, Math.max(rowBottoms.get(spec.row) ?? 0, end.top))
    }

    return placed.map(({ spec, top }): CardBox => {
      const y = top.top - spec.padding
      const bottom = rowBottoms.get(spec.row)! + spec.padding
      const bandEnd = spec.band ? positions.get(`${spec.id}-band`) : undefined

      return {
        cardId: spec.id,
        pageNumber: top.pageNumber,
        x: top.left - spec.padding,
        y,
        width: spec.width,
        height: Math.min(bottom, page.height - page.marginBottom) - y,
        color: spec.color,
        ...(spec.band && bandEnd && bandEnd.pageNumber === top.pageNumber
          ? { band: { height: bandEnd.top - y, color: spec.band } }
          : {}),
      }
    })
  }

  /**
   * The document's `pageBreakBefore`: breaks before a block kept together that would split, and
   * records where each card marker lands in `markerPositions`, when given. Both passes need it, so
   * the second breaks the pages where the first did.
   */
  function pageBreakBefore(
    markerPositions?: Map<string, MarkerPosition>
  ): NonNullable<TDocumentDefinitions['pageBreakBefore']> {
    return (node: Node) => {
      const id = node.id ?? ''

      if (markerPositions && id.startsWith(MARKER_PREFIX) && node.startPosition) {
        markerPositions.set(id, {
          pageNumber: node.startPosition.pageNumber,
          left: node.startPosition.left,
          top: node.startPosition.top,
        })
      }

      return id.startsWith(KEEP_PREFIX) && node.pageNumbers.length > 1
    }
  }

  return { cardGrid, keepTogether, measure, pageBreakBefore }
}

/** The vectors that paint the given page's cards, to sit in its background. */
export function cardBackgrounds(boxes: CardBox[], pageNumber: number): CanvasElement[] {
  return boxes
    .filter((box) => box.pageNumber === pageNumber)
    .flatMap((box): CanvasElement[] => [
      {
        type: 'rect',
        x: box.x,
        y: box.y,
        w: box.width,
        h: box.height,
        r: CARD_RADIUS,
        color: box.color,
      },
      ...(box.band
        ? ([
            // Rounded at the top with the card, square where it meets the card's body: the body's
            // colour covers the band's rounded bottom, and a point past it, or the band's
            // antialiased edge shows through as a faint line.
            {
              type: 'rect',
              x: box.x,
              y: box.y,
              w: box.width,
              h: box.band.height + CARD_RADIUS,
              r: CARD_RADIUS,
              color: box.band.color,
            },
            {
              type: 'rect',
              x: box.x,
              y: box.y + box.band.height,
              w: box.width,
              h: CARD_RADIUS + 1,
              color: box.color,
            },
          ] satisfies CanvasElement[])
        : []),
    ])
}
