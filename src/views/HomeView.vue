<script setup lang="ts">
import { ArrowRightLeft } from '@lucide/vue'
import { modules } from '@/router/modules'

function moduleIndex(i: number): string {
  return String(i + 1).padStart(2, '0')
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-14 md:py-20">
    <div class="panel reveal mb-10 px-6 py-12 text-center md:px-12 md:py-16">
      <p class="label-mono mb-4">Sys · Converter · Rev 2026</p>
      <h1 class="font-display text-5xl leading-none text-ink md:text-7xl">
        Convert<br class="md:hidden" />
        <span class="text-accent">anything.</span>
      </h1>
      <p class="mx-auto mt-6 max-w-md text-sm text-ink-dim md:text-base">
        A small instrument panel for everyday unit conversion. Precise, fast, and legible at a
        glance.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <RouterLink
        v-for="(mod, i) in modules"
        :key="mod.path"
        :to="mod.path"
        class="panel reveal group flex flex-col gap-4 px-6 py-8 text-left transition-colors hover:border-accent"
        :style="{ animationDelay: `${0.15 + i * 0.15}s` }"
      >
        <div class="flex items-center justify-between">
          <span class="label-mono">{{ moduleIndex(i) }}</span>
          <component
            :is="mod.icon"
            class="size-5 text-ink-dim transition-colors group-hover:text-accent"
          />
        </div>
        <h2 class="font-display text-3xl text-ink">{{ mod.label }}</h2>
        <p class="text-sm text-ink-dim">{{ mod.description }}</p>
        <span
          class="mt-2 flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase"
        >
          Open module
          <ArrowRightLeft class="size-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </RouterLink>
    </div>
  </div>
</template>
