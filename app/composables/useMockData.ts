import { computed } from "vue";

export interface MockData {
  carousel: Array<{
    image: string;
    href: string;
    title: Record<string, string>;
    buttonText: Record<string, string>;
  }>;
}

export function useMockData() {
  return useAsyncData<MockData>("mock-data", () => $fetch("/api/mock-data"));
}

/** Selects a localized field with fallback to 'es' then first available. */
export function useI18nField<T extends Record<string, string>>(obj?: T) {
  // useI18n is auto-imported by Nuxt at runtime; types may not be available here.
  // @ts-ignore
  const { locale, defaultLocale } = useI18n?.() ?? {
    locale: { value: "es" },
    defaultLocale: "es",
  };
  return computed(() => {
    if (!obj) return "";
    const code = locale.value;
    if (obj[code]) return obj[code];
    if (obj[defaultLocale]) return obj[defaultLocale];
    const first = Object.values(obj)[0];
    return first ?? "";
  });
}
