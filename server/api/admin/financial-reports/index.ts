import { defineEventHandler, readBody, createError } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports, financialReportTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createFinancialReportSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  // GET - List all financial reports (admin)
  if (event.method === 'GET') {
    await requireAuth(event)

    const items = await db.query.financialReports.findMany({
      orderBy: desc(financialReports.approvedAt),
      with: {
        translations: true,
      },
    })

    return { items }
  }

  // POST - Create new financial report
  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createFinancialReportSchema, body)
      const spanishTranslation = validated.translations.find(
        (translation) => translation.locale === 'es'
      )

      if (!spanishTranslation?.title?.trim()) {
        throw new Error('El título en español es obligatorio')
      }

      const [item] = await db
        .insert(financialReports)
        .values({
          pdfUrl: validated.pdfUrl,
          approvedAt: new Date(validated.approvedAt),
          order: validated.order,
          active: validated.active,
        })
        .returning()

      const translationsToCreate = validated.translations.filter(
        (translation) => translation.locale === 'es' || translation.title.trim() !== ''
      )

      if (translationsToCreate.length > 0) {
        await db.insert(financialReportTranslations).values(
          translationsToCreate.map((translation) => ({
            locale: translation.locale,
            title: translation.title.trim(),
            financialReportId: item.id,
          }))
        )
      }

      const completeItem = await db.query.financialReports.findFirst({
        where: eq(financialReports.id, item.id),
        with: {
          translations: true,
        },
      })

      return { item: completeItem }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
