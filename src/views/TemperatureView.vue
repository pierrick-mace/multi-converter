<script setup lang="ts">
import { Copy, Check } from '@lucide/vue'
import { useClipboard } from '@/composables/useClipboard'
import { useTemperatureConverter } from '@/composables/useTemperatureConverter'

const { celsius, fahrenheit, kelvin, updateFromCelsius, updateFromFahrenheit, updateFromKelvin } =
  useTemperatureConverter()
const { copied, copy } = useClipboard()

const fields = [
  { label: '°C', model: celsius, onInput: updateFromCelsius },
  { label: '°F', model: fahrenheit, onInput: updateFromFahrenheit },
  { label: 'K', model: kelvin, onInput: updateFromKelvin },
] as const
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-12">
    <div class="glass mb-8 px-6 py-10 text-center">
      <h1 class="font-display text-4xl md:text-5xl">Elegant temperature converter</h1>
    </div>

    <div class="glass px-6 py-8">
      <form class="mx-auto flex max-w-xs flex-col gap-6" @submit.prevent>
        <div v-for="field in fields" :key="field.label" class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full border border-white/30 p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            :aria-label="`Copy ${field.label} value`"
            @click="field.model.value !== null && copy(String(field.model.value))"
          >
            <Check v-if="copied" class="size-4" />
            <Copy v-else class="size-4" />
          </button>
          <input
            v-model.number="field.model.value"
            type="number"
            :placeholder="field.label"
            class="w-full rounded-lg border border-white/20 bg-black/10 px-3 py-2 text-white placeholder-white/50 focus:outline-none"
            @input="field.onInput()"
          />
          <span class="w-8 text-white/80">{{ field.label }}</span>
        </div>
      </form>
    </div>
  </div>
</template>
