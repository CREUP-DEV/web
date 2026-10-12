<script setup lang="ts">
import type { PressKitAreaRow, PressKitCommitteeItem } from '@/composables/press/usePressKitContent'

defineProps<{
  areas: PressKitAreaRow[]
  areasPending: boolean
  areasFailed: boolean
  committees: PressKitCommitteeItem[]
  committeesPending: boolean
  committeesFailed: boolean
  imageLoading: 'lazy' | 'eager'
}>()

const emit = defineEmits<{
  retryAreas: []
  retryCommittees: []
}>()

const { t } = useI18n()

/** Both columns of a row; the headings above them name the two committees. */
const ROW_COLUMNS = 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] print:grid-cols-[2fr_3fr]'
</script>

<template>
  <div class="space-y-10">
    <div class="space-y-6">
      <p class="leading-relaxed">
        {{ t('pressKit.organization.intro') }}
      </p>

      <PressKitAsyncState
        :pending="areasPending"
        :failed="areasFailed"
        :error-title="t('team.loadError')"
        @retry="emit('retryAreas')"
      >
        <template #skeleton>
          <div class="space-y-3">
            <USkeleton v-for="n in 4" :key="n" class="h-28 rounded-xl" />
          </div>
        </template>

        <div class="bg-default ring-default overflow-hidden rounded-xl ring-1">
          <div
            class="bg-elevated/50 border-default text-muted hidden gap-6 border-b px-5 py-2.5 text-xs font-semibold tracking-wide uppercase md:grid print:grid print:px-4"
            :class="ROW_COLUMNS"
          >
            <span>{{ t('team.executiveCommission') }}</span>
            <span>{{ t('team.extendedCommission') }}</span>
          </div>

          <ul class="divide-default divide-y" :aria-label="t('pressKit.organization.areas')">
            <li
              v-for="area in areas"
              :key="area.id"
              class="grid gap-4 px-5 py-4 md:gap-6 print:break-inside-avoid print:gap-6 print:px-4 print:py-3"
              :class="ROW_COLUMNS"
            >
              <div>
                <p class="text-primary text-xs font-semibold tracking-wide uppercase">
                  {{ area.name }}
                </p>

                <p v-if="!area.responsible" class="text-muted mt-2 text-sm">
                  {{ t('pressKit.organization.noResponsible') }}
                </p>
                <div v-else class="mt-2 flex items-center gap-3">
                  <div
                    class="ring-primary/20 size-12 shrink-0 overflow-hidden rounded-full ring-2 print:size-10"
                  >
                    <AdaptiveImage
                      v-if="area.responsible.photo"
                      :src="area.responsible.photo"
                      :alt="area.responsible.name"
                      width="96"
                      height="96"
                      format="webp"
                      quality="75"
                      class="size-full object-cover"
                      :loading="imageLoading"
                      decoding="async"
                    />
                    <div
                      v-else
                      class="bg-primary/10 text-primary flex size-full items-center justify-center"
                      aria-hidden="true"
                    >
                      <UIcon name="i-tabler-user" class="size-6" />
                    </div>
                  </div>
                  <div class="min-w-0 leading-snug">
                    <p class="font-semibold">{{ area.responsible.name }}</p>
                    <p v-if="area.responsible.role" class="text-muted text-sm">
                      {{ area.responsible.role }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Below its responsible on narrow screens, indented to show who it reports to. -->
              <ul
                v-if="area.members.length > 0"
                class="border-default ml-6 space-y-2.5 border-l-2 pl-4 text-sm leading-snug md:ml-0 md:border-l-0 md:pt-6 md:pl-0 print:ml-0 print:border-l-0 print:pt-5 print:pl-0"
              >
                <li v-for="member in area.members" :key="member.id">
                  <p class="font-medium">{{ member.name }}</p>
                  <p v-if="member.role" class="text-muted">{{ member.role }}</p>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </PressKitAsyncState>
    </div>

    <div class="space-y-4">
      <h3 class="text-xl font-semibold">{{ t('committees.title') }}</h3>
      <p class="text-muted leading-relaxed">
        {{ t('committees.description') }}
      </p>

      <PressKitAsyncState
        :pending="committeesPending"
        :failed="committeesFailed"
        :error-title="t('committees.loadError')"
        @retry="emit('retryCommittees')"
      >
        <template #skeleton>
          <div class="grid gap-3 sm:grid-cols-2">
            <USkeleton v-for="n in 4" :key="n" class="h-20 rounded-xl" />
          </div>
        </template>

        <ul class="grid gap-3 sm:grid-cols-2 print:grid-cols-2" :aria-label="t('committees.title')">
          <li
            v-for="committee in committees"
            :key="committee.id"
            class="bg-default ring-default rounded-xl p-4 ring-1 print:break-inside-avoid print:p-3"
          >
            <p class="font-semibold">{{ committee.name }}</p>
            <p class="mt-1 text-sm leading-snug">
              <span class="text-muted">{{ t('pressKit.organization.responsible') }}:</span>
              {{ ' ' }}
              <template v-if="committee.responsibleName">{{ committee.responsibleName }}</template>
              <span v-else class="text-muted">{{ t('pressKit.organization.noResponsible') }}</span>
            </p>
          </li>
        </ul>
      </PressKitAsyncState>
    </div>
  </div>
</template>
