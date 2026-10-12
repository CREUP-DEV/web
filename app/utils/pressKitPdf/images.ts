/**
 * Images for the press kit PDF, drawn on a canvas in the browser: the PDF only takes JPEG and PNG,
 * and its layout cannot crop, mask, tint or round corners, so each image is sized, cropped and
 * finished here once.
 */

export interface RasterizeOptions {
  /** Output size in pixels. */
  width: number
  height: number
  /** `cover` crops to fill the box; `contain` fits inside it, centred. */
  fit: 'cover' | 'contain'
  format: 'jpeg' | 'png'
  /** Clip to a circle, optionally with a ring of this colour and width (px) around it. */
  circle?: { ringColor?: string; ringWidth?: number }
  /** Paint this colour over the image (e.g. `rgba(121, 34, 37, 0.8)`). */
  tint?: string
  /** Fill behind the image, for formats without transparency. */
  background?: string
  /**
   * Rounds the image's corners (`radius` in px) by painting `color` outside them, the colour of
   * the page it sits on: JPEG has no transparency to cut them out with.
   */
  corners?: { radius: number; which: 'top' | 'all'; color: string }
}

const JPEG_QUALITY = 0.86

function loadImageElement(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${url}`))
    image.src = url
  })
}

/**
 * Draws `url` as described and returns it as a data URL, or null if it cannot be used: when it
 * does not load, or when it comes from another origin without CORS and the canvas refuses to
 * export it. The document then prints a placeholder rather than failing as a whole.
 */
export async function rasterizeImage(url: string, options: RasterizeOptions) {
  try {
    return drawImage(await loadImageElement(url), options)
  } catch {
    return null
  }
}

function drawImage(image: HTMLImageElement, options: RasterizeOptions) {
  const sourceWidth = image.naturalWidth || options.width
  const sourceHeight = image.naturalHeight || options.height
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.imageSmoothingQuality = 'high'

  if (options.background) {
    context.fillStyle = options.background
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  const ringWidth = options.circle?.ringColor ? (options.circle.ringWidth ?? 0) : 0

  if (options.circle) {
    const radius = Math.min(canvas.width, canvas.height) / 2
    context.save()
    context.beginPath()
    context.arc(canvas.width / 2, canvas.height / 2, radius - ringWidth / 2, 0, Math.PI * 2)
    context.clip()
  }

  const scale =
    options.fit === 'cover'
      ? Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight)
      : Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  context.drawImage(
    image,
    (canvas.width - drawWidth) / 2,
    (canvas.height - drawHeight) / 2,
    drawWidth,
    drawHeight
  )

  if (options.tint) {
    context.fillStyle = options.tint
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  if (options.circle) {
    context.restore()

    if (ringWidth > 0 && options.circle.ringColor) {
      const radius = Math.min(canvas.width, canvas.height) / 2
      context.beginPath()
      context.arc(canvas.width / 2, canvas.height / 2, radius - ringWidth / 2, 0, Math.PI * 2)
      context.lineWidth = ringWidth
      context.strokeStyle = options.circle.ringColor
      context.stroke()
    }
  }

  if (options.corners) {
    const { radius, which, color } = options.corners
    const bottom = which === 'all' ? radius : 0
    context.beginPath()
    context.rect(0, 0, canvas.width, canvas.height)
    context.roundRect(0, 0, canvas.width, canvas.height, [radius, radius, bottom, bottom])
    context.fillStyle = color
    // Even-odd fills what lies inside the rectangle but outside the rounded one: the corners.
    context.fill('evenodd')
  }

  return options.format === 'jpeg'
    ? canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    : canvas.toDataURL('image/png')
}

/** Runs `tasks` with at most `limit` of them at once. */
export async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number) {
  const results: T[] = new Array(tasks.length)
  let next = 0

  const worker = async () => {
    while (next < tasks.length) {
      const index = next++
      results[index] = await tasks[index]!()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}
