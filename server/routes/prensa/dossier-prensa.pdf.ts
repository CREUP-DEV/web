import { defineEventHandler, sendRedirect } from 'h3'
import { PRESS_KIT_PATH } from '~~/shared/constants/pressRoutes'

/**
 * Former address of the uploaded press dossier PDF. The press kit page replaced it, so links already
 * shared in emails and documents land there instead.
 */
export default defineEventHandler((event) => sendRedirect(event, PRESS_KIT_PATH, 301))
