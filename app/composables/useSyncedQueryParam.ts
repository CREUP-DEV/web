const getFirstQueryValue = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

const buildQueryString = (
  query: Record<string, string | (string | null | undefined)[] | null | undefined>
) => {
  const searchParams = new URLSearchParams()

  for (const [key, rawValue] of Object.entries(query)) {
    if (Array.isArray(rawValue)) {
      for (const entry of rawValue) {
        if (entry != null && entry !== '') {
          searchParams.append(key, entry)
        }
      }
      continue
    }

    if (rawValue != null && rawValue !== '') {
      searchParams.set(key, rawValue)
    }
  }

  const search = searchParams.toString()
  return search ? `?${search}` : ''
}

const replaceUrlQueryParam = (
  route: ReturnType<typeof useRoute>,
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

  const nextUrl = `${route.path}${buildQueryString(nextQuery)}${route.hash || ''}`
  window.history.replaceState(window.history.state, '', nextUrl)
}

export function useSyncedQueryParam<T>(
  key: string,
  options: {
    parse: (rawValue: string | null) => T
    serialize: (value: T) => string | null
  }
) {
  const route = useRoute()
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
    replaceUrlQueryParam(route, key, options.serialize(value))
  })

  if (import.meta.client) {
    watch(
      rawValue,
      (value) => {
        const normalized = options.serialize(options.parse(value))
        if (value !== normalized) {
          replaceUrlQueryParam(route, key, normalized)
        }
      },
      { immediate: true }
    )
  }

  return state
}
