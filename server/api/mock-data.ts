import { defineEventHandler } from 'h3'
import mockData from '../../data/mock.json'

export default defineEventHandler(async (event) => {
  const locale = event.context.requestLocale

  const payload = {
    carousel: mockData.carousel.map((item) => {
      const title =
        item.title[locale as keyof typeof item.title] ||
        item.title[locale as keyof typeof item.title]
      const buttonText =
        item.buttonText[locale as keyof typeof item.buttonText] ||
        item.buttonText[locale as keyof typeof item.buttonText]

      return {
        image: item.image,
        href: item.href,
        title,
        buttonText,
      }
    }),
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(payload)
    }, 1000) // Simulate a 1-second delay
  })
})
