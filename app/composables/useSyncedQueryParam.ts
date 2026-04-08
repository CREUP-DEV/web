const getFirstQueryValue = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

const setQueryParam = async (
  router: ReturnType<typeof useRouter>,
  route: ReturnType<typeof useRoute>,
  key: string,
  value: string | null
) => {
  const currentValue = getFirstQueryValue(route.query[key] as string | string[] | null | undefined)
  if (currentValue === value) {
    return
  }

  const { [key]: _removed, ...restQuery } = route.query
  const nextQuery = value === null ? restQuery : { ...restQuery, [key]: value }

  await router.replace({ query: nextQuery })
}

export function useSyncedQueryParam<T>(
  key: string,
  options: {
    parse: (rawValue: string | null) => T
    serialize: (value: T) => string | null
  }
) {
  const route = useRoute()
  const router = useRouter()

  const rawValue = computed(() =>
    getFirstQueryValue(route.query[key] as string | string[] | null | undefined)
  )

  const state = computed<T>({
    get: () => options.parse(rawValue.value),
    set: (value) => {
      void setQueryParam(router, route, key, options.serialize(value))
    },
  })

  if (import.meta.client) {
    watch(
      rawValue,
      (value) => {
        const serialized = options.serialize(options.parse(value))
        if (value !== serialized) {
          void setQueryParam(router, route, key, serialized)
        }
      },
      { immediate: true }
    )
  }

  return state
}
