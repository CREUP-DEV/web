import { defineEventHandler } from 'h3'
import mockData from '../../data/mock.json'
import { getLocale, getDefaultLocale } from '../utils/locale'

export default defineEventHandler(async (event) => {
  const requestedLocale = getLocale(event)
  const defaultLocale = getDefaultLocale()

  const payload = {
    carousel: mockData.carousel.map((item) => {
      const title =
        item.title[requestedLocale as keyof typeof item.title] || item.title[defaultLocale]
      const buttonText =
        item.buttonText[requestedLocale as keyof typeof item.buttonText] ||
        item.buttonText[defaultLocale]

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
