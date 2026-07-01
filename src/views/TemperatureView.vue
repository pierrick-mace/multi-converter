<script setup lang="ts">
import { Copy, Check } from '@lucide/vue'
import { useClipboard } from '@/composables/useClipboard'
import { useTemperatureConverter } from '@/composables/useTemperatureConverter'

const { celsius, fahrenheit, kelvin, updateFromCelsius, updateFromFahrenheit, updateFromKelvin } =
  useTemperatureConverter()
const { copied, copy } = useClipboard()

const fields = [
  {
    id: 'celsius',
    index: '01',
    label: 'Celsius',
    unit: '°C',
    model: celsius,
    onInput: updateFromCelsius,
  },
  {
    id: 'fahrenheit',
    index: '02',
    label: 'Fahrenheit',
    unit: '°F',
    model: fahrenheit,
    onInput: updateFromFahrenheit,
  },
  {
    id: 'kelvin',
    index: '03',
    label: 'Kelvin',
    unit: 'K',
    model: kelvin,
    onInput: updateFromKelvin,
  },
] as const
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-14 md:py-20">
    <div class="panel reveal mb-8 px-6 py-10 text-center md:px-12">
      <p class="label-mono mb-4">Module 01</p>
      <h1 class="font-display text-5xl text-ink md:text-6xl">Temperature</h1>
      <p class="mx-auto mt-4 max-w-sm text-sm text-ink-dim">
        Enter a value in any field. The other two update instantly.
      </p>
    </div>

    <div class="panel reveal px-6 py-8 md:px-10" style="animation-delay: 0.15s">
      <form class="flex flex-col gap-6" @submit.prevent>
        <div v-for="field in fields" :key="field.label" class="flex items-end gap-3">
          <label :for="field.id" class="w-24 shrink-0">
            <span class="label-mono block">{{ field.index }}</span>
            <span class="font-mono text-sm text-ink-dim">{{ field.label }}</span>
          </label>

          <div
            class="flex flex-1 items-center gap-3 border-b-2 border-rule focus-within:border-accent"
          >
            <input
              :id="field.id"
              v-model.number="field.model.value"
              type="number"
              :placeholder="field.unit"
              class="w-full bg-transparent px-1 py-2 font-mono text-2xl tabular-nums text-ink placeholder-ink-dim/40 focus:outline-none"
              @input="field.onInput()"
            />
            <span class="pr-1 font-mono text-lg text-ink-dim">{{ field.unit }}</span>
          </div>

          <button
            type="button"
            class="btn-tick"
            :aria-label="`Copy ${field.label} value`"
            @click="field.model.value !== null && copy(String(field.model.value))"
          >
            <Check v-if="copied" class="size-4 text-accent" />
            <Copy v-else class="size-4" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
