<script setup lang="ts">
import { type Base, useBaseConverter } from '@/composables/useBaseConverter';
import { useClipboard } from '@/composables/useClipboard';
import { Check, Copy } from '@lucide/vue';
import { computed } from 'vue';

const { binary, octal, decimal, hex, error, updateFromBinary, updateFromOctal, updateFromDecimal, updateFromHex } =
  useBaseConverter();

const fields = [
  {
    id: 'binary',
    label: 'Binary',
    base: 2 as Base,
    placeholder: 'BASE 2',
    model: binary,
    onInput: updateFromBinary,
    clipboard: useClipboard(),
  },
  {
    id: 'octal',
    label: 'Octal',
    base: 8 as Base,
    placeholder: 'BASE 8',
    model: octal,
    onInput: updateFromOctal,
    clipboard: useClipboard(),
  },
  {
    id: 'decimal',
    label: 'Decimal',
    base: 10 as Base,
    placeholder: 'BASE 10',
    model: decimal,
    onInput: updateFromDecimal,
    clipboard: useClipboard(),
  },
  {
    id: 'hex',
    label: 'Hexadecimal',
    base: 16 as Base,
    placeholder: 'BASE 16',
    model: hex,
    onInput: updateFromHex,
    clipboard: useClipboard(),
  },
] as const;

const errorMessage = computed(() => error.value?.message ?? null);

function fieldHasError(base: Base)
{
  return error.value?.base === base;
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-14 md:py-20">
    <div class="panel reveal mb-8 px-6 py-10 text-center md:px-12">
      <h1 class="font-display text-5xl text-ink md:text-6xl">Bases</h1>
      <p class="mx-auto mt-4 max-w-sm text-sm text-ink-dim">
        Enter an unsigned integer in any field. The other three update instantly.
      </p>
    </div>

    <div class="panel reveal px-6 py-8 md:px-10" style="animation-delay: 0.15s">
      <h2 class="label-mono mb-6">Number bases</h2>

      <form class="flex flex-col gap-6" @submit.prevent>
        <div v-for="field in fields" :key="field.label" class="flex items-end gap-3">
          <label :for="field.id" class="w-24 shrink-0">
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
              :aria-describedby="fieldHasError(field.base) ? 'base-error' : undefined"
              @input="field.onInput()"
            />
            <p v-if="fieldHasError(field.base)" id="base-error" class="mt-1 font-mono text-xs text-danger">
              {{ errorMessage }}
            </p>
          </div>

          <button
            type="button"
            class="btn-tick"
            :aria-label="`Copy ${field.label} value`"
            @click="field.model.value !== '' && field.clipboard.copy(field.model.value)"
          >
            <Check v-if="field.clipboard.copied.value" class="size-4 text-accent" />
            <Copy v-else class="size-4" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
