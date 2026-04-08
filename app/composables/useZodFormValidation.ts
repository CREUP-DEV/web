import type { ZodTypeAny, infer as ZodInfer } from 'zod'

type ValidationErrors = Record<string, string>

export function useZodFormValidation() {
  const fieldErrors = ref<ValidationErrors>({})

  const clearErrors = () => {
    fieldErrors.value = {}
  }

  const setErrors = (errors: ValidationErrors) => {
    fieldErrors.value = errors
  }

  const validate = <TSchema extends ZodTypeAny>(
    schema: TSchema,
    payload: unknown
  ): payload is ZodInfer<TSchema> => {
    const result = schema.safeParse(payload)

    if (result.success) {
      clearErrors()
      return true
    }

    const nextErrors: ValidationErrors = {}

    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      const key = path || '_form'

      if (!nextErrors[key]) {
        nextErrors[key] = issue.message
      }
    }

    setErrors(nextErrors)
    return false
  }

  const getFieldError = (path: string) => fieldErrors.value[path]

  return {
    clearErrors,
    fieldErrors,
    getFieldError,
    validate,
  }
}
