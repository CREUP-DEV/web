import { defineEventHandler } from 'h3'
import { seedRequestLocale } from '../utils/locale/requestLocale'

export default defineEventHandler((event) => {
  seedRequestLocale(event)
})
