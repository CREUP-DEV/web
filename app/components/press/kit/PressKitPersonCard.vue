<script setup lang="ts">
import { encodeObfuscatedEmail } from '@/utils/obfuscatedEmail'

defineProps<{
  name: string
  role: string
  photo: string | null
  degree: string | null
  university: string | null
  email: string | null
  imageLoading: 'lazy' | 'eager'
}>()

const { t } = useI18n()
</script>

<template>
  <article
    class="bg-default ring-default flex h-full flex-col items-center rounded-xl p-5 text-center ring-1 print:break-inside-avoid print:p-3"
  >
    <div class="ring-primary/20 size-24 shrink-0 overflow-hidden rounded-full ring-2 print:size-20">
      <AdaptiveImage
        v-if="photo"
        :src="photo"
        :alt="name"
        width="192"
        height="192"
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
        <UIcon name="i-tabler-user" class="size-10" />
      </div>
    </div>

    <p class="text-primary mt-3 text-sm font-medium">{{ role }}</p>
    <h3 class="mt-1 font-semibold">{{ name }}</h3>

    <dl class="text-muted mt-2 space-y-0.5 text-sm leading-snug">
      <div v-if="degree">
        <dt class="sr-only">{{ t('team.degree') }}</dt>
        <dd>{{ degree }}</dd>
      </div>
      <div v-if="university">
        <dt class="sr-only">{{ t('team.university') }}</dt>
        <dd>{{ university }}</dd>
      </div>
      <div v-if="email" class="pt-1">
        <dt class="sr-only">{{ t('team.email') }}</dt>
        <dd>
          <ObfuscatedEmail
            v-bind="encodeObfuscatedEmail(email)"
            class="hover:text-primary break-all transition-colors"
          />
        </dd>
      </div>
    </dl>
  </article>
</template>
