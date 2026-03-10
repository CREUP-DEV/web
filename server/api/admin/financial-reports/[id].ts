import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports, financialReportTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateFinancialReportSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET - Get single financial report
  if (event.method === 'GET') {
    await requireAuth(event)

    const item = await db.query.financialReports.findFirst({
      where: eq(financialReports.id, id),
      with: {
        translations: true,
      },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update financial report
  if (event.method === 'PUT') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updateFinancialReportSchema, body)
      const spanishTranslation = validated.translations.find(
        (translation) => translation.locale === 'es'
      )

      if (!spanishTranslation?.title?.trim()) {
        throw new Error('El título en español es obligatorio')
      }

      await db
        .update(financialReports)
        .set({
          pdfUrl: validated.pdfUrl,
          approvedAt: new Date(validated.approvedAt),
          order: validated.order,
          active: validated.active,
        })
        .where(eq(financialReports.id, id))

      await db
        .delete(financialReportTranslations)
        .where(eq(financialReportTranslations.financialReportId, id))

      const translationsToCreate = validated.translations.filter(
        (translation) => translation.locale === 'es' || translation.title.trim() !== ''
      )

      if (translationsToCreate.length > 0) {
        await db.insert(financialReportTranslations).values(
          translationsToCreate.map((translation) => ({
            locale: translation.locale,
            title: translation.title.trim(),
            financialReportId: id,
          }))
        )
      }

      const item = await db.query.financialReports.findFirst({
        where: eq(financialReports.id, id),
        with: {
          translations: true,
        },
      })

      return { item }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE - Delete financial report
  if (event.method === 'DELETE') {
    await requireAuth(event)

    await db.delete(financialReports).where(eq(financialReports.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
