import { defineEventHandler } from 'h3'
import mockData from '../../data/mock.json'

type Localized = Record<string, string>
type CarouselItem = { image: string; href: string; title: Localized; buttonText: Localized }
type FeaturedNewsItem = { image: string; to: string; title: Localized }
type FeaturedLinkItem = { image: string; to: string; title: Localized }
type MockData = {
  carousel: CarouselItem[]
  featuredNews: FeaturedNewsItem[]
  featuredLinks: FeaturedLinkItem[]
}

export default defineEventHandler(async (event) => {
  const locale: string = event.context.requestLocale
  const data = mockData as unknown as MockData

  const pick = (obj: Localized): string => obj[locale] ?? Object.values(obj)[0] ?? ''

  const payload = {
    carousel: data.carousel.map((item) => ({
      image: item.image,
      href: item.href,
      title: pick(item.title),
      buttonText: pick(item.buttonText),
    })),
    featuredNews: data.featuredNews.map((item) => ({
      image: item.image,
      to: item.to,
      title: pick(item.title),
    })),
    featuredLinks: data.featuredLinks.map((item) => ({
      image: item.image,
      to: item.to,
      title: pick(item.title),
    })),
  }

  // Simulate network latency like before
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), 1000)
  })
})
