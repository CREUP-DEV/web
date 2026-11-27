<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import {
  ADMIN_NAV_GROUPS,
  ADMIN_SECTION_DEFINITIONS,
  type AdminSectionKey,
} from '~~/shared/constants/adminSections'

definePageMeta({
  layout: 'admin',
})

interface DashboardRecentActivityItem {
  sectionKey: AdminSectionKey
  title: string
  description: string
  to: string
  updatedAt: string
}

interface AdminSummaryResponse {
  subscribers: {
    total: number
    active: number
  }
  recentActivity: DashboardRecentActivityItem[]
}

interface DashboardAction {
  title: string
  to: string
  icon: string
}

const {
  data: summaryData,
  pending: summaryPending,
  error: summaryError,
  refresh: refreshSummary,
} = await useFetch<AdminSummaryResponse>('/api/admin/summary', {
  headers: useLocaleApiHeaders(),
})
const { formatDateTime } = useLocaleFormatting()
const { t } = useI18n()
const localePath = useLocalePath()
const adminIsEnvAdmin = useState<boolean>('admin-is-env-admin', () => false)

const sectionIcons = Object.fromEntries(
  ADMIN_SECTION_DEFINITIONS.map((section) => [section.key, section.icon] as const)
) as Record<AdminSectionKey, string>

const recentActivity = computed(() => summaryData.value?.recentActivity ?? [])
const subscribers = computed(() => summaryData.value?.subscribers ?? { total: 0, active: 0 })

const primaryActions = computed<DashboardAction[]>(() => [
  {
    title: t('admin.dashboard.newPressRelease'),
    to: `${localePath(ADMIN_ROUTES.pressCreate)}?type=press_release`,
    icon: 'i-tabler-writing-sign',
  },
  {
    title: t('admin.dashboard.newStatement'),
    to: `${localePath(ADMIN_ROUTES.pressCreate)}?type=statement`,
    icon: 'i-tabler-speakerphone',
  },
  {
    title: t('admin.dashboard.newMediaAppearance'),
    to: `${localePath(ADMIN_ROUTES.pressCreate)}?type=media_appearance`,
    icon: 'i-tabler-broadcast',
  },
  {
    title: t('admin.activity.list.newCreup'),
    to: `${localePath(ADMIN_ROUTES.activityCreate)}?kind=creup`,
    icon: 'i-tabler-calendar-plus',
  },
])

/** Every section the account may open, under the same groups as the sidebar. */
const sectionGroups = computed(() =>
  ADMIN_NAV_GROUPS.map((group) => ({
    key: group,
    label: t(`admin.nav.groups.${group}`),
    sections: ADMIN_SECTION_DEFINITIONS.filter(
      (section) => section.group === group && (!section.envOnly || adminIsEnvAdmin.value)
    ).map((section) => ({
      key: section.key,
      title: t(`admin.nav.${section.key}.name`),
      description: t(`admin.nav.${section.key}.description`),
      icon: section.icon,
      to: localePath(section.to),
    })),
  })).filter((group) => group.sections.length > 0)
)

const formatActivityDate = (value: string) =>
  formatDateTime(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
</script>

<template>
  <AdminPage :title="t('admin.nav.dashboard.name')">
    <template v-if="summaryPending">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-hidden="true">
        <USkeleton class="h-36 rounded-lg" />
        <USkeleton v-for="index in 4" :key="index" class="h-36 rounded-lg" />
      </div>
      <USkeleton class="h-64 rounded-lg" aria-hidden="true" />
    </template>

    <UAlert
      v-else-if="summaryError"
      color="error"
      variant="soft"
      :title="t('admin.dashboard.loadError')"
      :description="t('admin.common.loadErrorDescription')"
      :actions="[
        {
          label: t('admin.common.retry'),
          icon: 'i-tabler-refresh',
          color: 'neutral',
          variant: 'outline',
          onClick: () => refreshSummary(),
        },
      ]"
    />

    <template v-else>
      <section aria-labelledby="admin-dashboard-quick-actions" class="space-y-3">
        <h2 id="admin-dashboard-quick-actions" class="text-highlighted text-base font-semibold">
          {{ t('admin.dashboard.quickActions') }}
        </h2>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <UCard :ui="{ body: 'flex h-full flex-col gap-3 p-4 sm:p-4' }">
            <div>
              <p class="text-muted text-sm">{{ t('admin.dashboard.newsletter') }}</p>
              <p class="text-highlighted text-2xl font-semibold">{{ subscribers.total }}</p>
              <p class="text-muted text-sm">{{ t('admin.dashboard.subscribers') }}</p>
            </div>
            <div class="mt-auto flex flex-wrap gap-2">
              <UButton :to="`${localePath(ADMIN_ROUTES.newsletter)}?open=create`" size="sm">
                {{ t('admin.dashboard.newNewsletter') }}
              </UButton>
              <UButton
                :to="localePath(ADMIN_ROUTES.newsletterSubscribers)"
                variant="outline"
                color="neutral"
                size="sm"
              >
                {{ t('admin.dashboard.viewSubscribers') }}
              </UButton>
            </div>
          </UCard>

          <UPageCard
            v-for="action in primaryActions"
            :key="action.to"
            :title="action.title"
            :icon="action.icon"
            :to="action.to"
            variant="outline"
            class="h-full"
            :ui="{ leadingIcon: 'text-primary', title: 'text-base' }"
          />
        </div>
      </section>

      <section aria-labelledby="admin-dashboard-recent" class="space-y-3">
        <div>
          <h2 id="admin-dashboard-recent" class="text-highlighted text-base font-semibold">
            {{ t('admin.dashboard.recentActivity') }}
          </h2>
          <p class="text-muted text-sm">{{ t('admin.dashboard.recentActivityHint') }}</p>
        </div>

        <ul v-if="recentActivity.length" class="divide-default divide-y rounded-lg border">
          <li
            v-for="item in recentActivity"
            :key="`${item.sectionKey}-${item.updatedAt}-${item.title}`"
          >
            <NuxtLink
              :to="localePath(item.to)"
              class="group hover:bg-elevated/50 focus-visible:outline-primary flex flex-col gap-2 p-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="flex min-w-0 items-start gap-3">
                <div
                  class="bg-elevated text-primary flex size-9 shrink-0 items-center justify-center rounded-md"
                >
                  <UIcon :name="sectionIcons[item.sectionKey]" class="size-5" />
                </div>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-highlighted truncate font-medium">{{ item.title }}</h3>
                    <UBadge color="neutral" variant="subtle" size="sm">
                      {{ t('admin.nav.' + item.sectionKey + '.name') }}
                    </UBadge>
                  </div>
                  <p class="text-muted mt-0.5 text-sm">{{ item.description }}</p>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-3 ps-12 lg:ps-0">
                <p class="text-muted text-xs sm:text-sm">
                  {{ formatActivityDate(item.updatedAt) }}
                </p>
                <UIcon
                  name="i-tabler-arrow-up-right"
                  class="text-muted group-hover:text-primary size-4 transition-colors"
                  aria-hidden="true"
                />
              </div>
            </NuxtLink>
          </li>
        </ul>

        <UEmpty
          v-else
          variant="outline"
          icon="i-tabler-history"
          :description="t('admin.dashboard.noRecentActivity')"
        />
      </section>

      <section aria-labelledby="admin-dashboard-sections" class="space-y-4">
        <h2 id="admin-dashboard-sections" class="text-highlighted text-base font-semibold">
          {{ t('admin.dashboard.sections') }}
        </h2>

        <div v-for="group in sectionGroups" :key="group.key" class="space-y-2">
          <h3 class="text-muted text-xs font-medium tracking-wide uppercase">
            {{ group.label }}
          </h3>
          <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" :aria-label="group.label">
            <li v-for="section in group.sections" :key="section.key">
              <UPageCard
                :title="section.title"
                :description="section.description"
                :icon="section.icon"
                :to="section.to"
                variant="outline"
                class="h-full"
                :ui="{ leadingIcon: 'text-primary' }"
              />
            </li>
          </ul>
        </div>
      </section>
    </template>
  </AdminPage>
</template>
