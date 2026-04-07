import { defineEventHandler } from 'h3'
import { db } from '../../../db'

export default defineEventHandler(async () => {
  const item = await db.query.aboutPageContent.findFirst()

  return { item }
})
