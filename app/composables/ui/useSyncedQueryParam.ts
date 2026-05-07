const getFirstQueryValue = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

const replaceUrlQueryParam = (
  route: ReturnType<typeof useRoute>,
  router: ReturnType<typeof useRouter>,
  key: string,
  value: string | null
) => {
  if (!import.meta.client) {
    return
  }

  const currentValue = getFirstQueryValue(route.query[key] as string | string[] | null | undefined)
  if (currentValue === value) {
    return
  }

  const nextQuery =
    value == null
      ? Object.fromEntries(Object.entries(route.query).filter(([entryKey]) => entryKey !== key))
      : {
          ...route.query,
          [key]: value,
        }

  void router.replace({
    path: route.path,
    query: nextQuery,
    hash: route.hash,
  })
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
  const state = ref<T>(options.parse(rawValue.value)) as Ref<T>

  watch(
    rawValue,
    (value) => {
      state.value = options.parse(value)
    },
    { immediate: true }
  )

  watch(state, (value) => {
    replaceUrlQueryParam(route, router, key, options.serialize(value))
  })

  if (import.meta.client) {
    watch(
      rawValue,
      (value) => {
        const normalized = options.serialize(options.parse(value))
        if (value !== normalized) {
          replaceUrlQueryParam(route, router, key, normalized)
        }
      },
      { immediate: true }
    )
  }

  return state
}
