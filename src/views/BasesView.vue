<script setup lang="ts">
import { computed } from 'vue'
import { Copy, Check } from '@lucide/vue'
import { useClipboard } from '@/composables/useClipboard'
import { useBaseConverter, type Base } from '@/composables/useBaseConverter'

const {
  binary,
  octal,
  decimal,
  hex,
  error,
  updateFromBinary,
  updateFromOctal,
  updateFromDecimal,
  updateFromHex,
} = useBaseConverter()
const { copied, copy } = useClipboard()

const fields = [
  {
    id: 'binary',
    index: '01',
    label: 'Binary',
    base: 2 as Base,
    placeholder: 'BASE 2',
    model: binary,
    onInput: updateFromBinary,
  },
  {
    id: 'octal',
    index: '02',
    label: 'Octal',
    base: 8 as Base,
    placeholder: 'BASE 8',
    model: octal,
    onInput: updateFromOctal,
  },
  {
    id: 'decimal',
    index: '03',
    label: 'Decimal',
    base: 10 as Base,
    placeholder: 'BASE 10',
    model: decimal,
    onInput: updateFromDecimal,
  },
  {
    id: 'hex',
    index: '04',
    label: 'Hexadecimal',
    base: 16 as Base,
    placeholder: 'BASE 16',
    model: hex,
    onInput: updateFromHex,
  },
] as const

const errorMessage = computed(() => error.value?.message ?? null)

function fieldHasError(base: Base) {
  return error.value?.base === base
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-14 md:py-20">
    <div class="panel reveal mb-8 px-6 py-10 text-center md:px-12">
      <p class="label-mono mb-4">Module 04</p>
      <h1 class="font-display text-5xl text-ink md:text-6xl">Bases</h1>
      <p class="mx-auto mt-4 max-w-sm text-sm text-ink-dim">
        Enter an unsigned integer in any field. The other three update instantly.
      </p>
    </div>

    <div class="panel reveal px-6 py-8 md:px-10" style="animation-delay: 0.15s">
      <form class="flex flex-col gap-6" @submit.prevent>
        <div v-for="field in fields" :key="field.label" class="flex items-end gap-3">
          <label :for="field.id" class="w-24 shrink-0">
            <span class="label-mono block">{{ field.index }}</span>
            <span class="font-mono text-sm text-ink-dim">{{ field.label }}</span>
          </label>

          <div class="flex flex-1 flex-col">
            <input
              :id="field.id"
              v-model="field.model.value"
              type="text"
              inputmode="text"
              autocomplete="off"
              spellcheck="false"
              :placeholder="field.placeholder"
              class="field"
              :class="{ 'border-danger!': fieldHasError(field.base) }"
              :aria-invalid="fieldHasError(field.base)"
              @input="field.onInput()"
            />
            <p v-if="fieldHasError(field.base)" class="mt-1 font-mono text-xs text-danger">
              {{ errorMessage }}
            </p>
          </div>

          <button
            type="button"
            class="btn-tick"
            :aria-label="`Copy ${field.label} value`"
            @click="field.model.value !== '' && copy(field.model.value)"
          >
            <Check v-if="copied" class="size-4 text-accent" />
            <Copy v-else class="size-4" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
