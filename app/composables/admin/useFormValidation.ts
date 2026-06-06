type ValidationErrors = Record<string, string>
// Shape kept compatible with both zod's `safeParse` output (issue `path` is `PropertyKey[]`) and the
// hand-written press form validator, so either can be passed to `validate`.
type ValidationIssue = {
  message: string
  path: ReadonlyArray<PropertyKey>
}

type ValidationSuccess<TPayload> = {
  data: TPayload
  success: true
}

type ValidationFailure = {
  error: {
    issues: ReadonlyArray<ValidationIssue>
  }
  success: false
}

interface ClientValidatableSchema<TPayload> {
  safeParse(payload: unknown): ValidationSuccess<TPayload> | ValidationFailure
}

export function useFormValidation() {
  const { t, te } = useI18n()
  const fieldErrors = ref<ValidationErrors>({})

  // Validation messages are i18n keys (e.g. 'admin.validation.nameRequired'). Translate known keys;
  // pass any non-key literal through untouched (te() guard keeps stray literals out of the
  // vue-i18n message compiler, avoiding linked-format crashes on chars like @ / | / {).
  const resolveMessage = (message: string) => (te(message) ? t(message) : message)

  const clearErrors = () => {
    fieldErrors.value = {}
  }

  const setErrors = (errors: ValidationErrors) => {
    fieldErrors.value = errors
  }

  const validate = <TPayload>(
    schema: ClientValidatableSchema<TPayload>,
    payload: unknown
  ): payload is TPayload => {
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
        nextErrors[key] = resolveMessage(issue.message)
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
