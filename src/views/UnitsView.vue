<script setup lang="ts">
import { watch } from 'vue'
import { ArrowRightLeft, Copy, Check } from '@lucide/vue'
import { useClipboard } from '@/composables/useClipboard'
import { useUnitConverter } from '@/composables/useUnitConverter'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { lengthModule, massModule } from '@/composables/unitModules'

const displayFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 6 })
const copyFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 6,
  useGrouping: false,
})

function formatResult(result: number | null): string {
  return result === null ? '' : displayFormatter.format(result)
}

const panels = [
  {
    id: 'length',
    label: 'Length',
    module: lengthModule,
    converter: useUnitConverter(lengthModule),
    delay: '0.15s',
    clipboard: useClipboard(),
  },
  {
    id: 'mass',
    label: 'Mass',
    module: massModule,
    converter: useUnitConverter(massModule),
    delay: '0.3s',
    clipboard: useClipboard(),
  },
] as const

interface StoredUnitPair {
  from: string
  to: string
}

// Local persistence of the last from/to selection per panel
// (`converter:units:length`, `converter:units:mass`). This module has no URL
// state to reconcile against (unlike currencies), so there's no precedence
// rule here: the stored pair, when present and still valid for the module's
// unit table, is simply applied once at setup, then kept in sync afterwards.
for (const panel of panels) {
  const stored = useLocalStorage<StoredUnitPair | null>(`converter:units:${panel.id}`, null)
  const validIds = new Set(panel.module.units.map((unit) => unit.id))

  if (stored.value && validIds.has(stored.value.from) && validIds.has(stored.value.to)) {
    panel.converter.from.value = stored.value.from
    panel.converter.to.value = stored.value.to
  }

  watch([panel.converter.from, panel.converter.to], ([from, to]) => {
    stored.value = { from, to }
  })
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-14 md:py-20">
    <div class="panel reveal mb-8 px-6 py-10 text-center md:px-12">
      <p class="label-mono mb-4">Module 03</p>
      <h1 class="font-display text-5xl text-ink md:text-6xl">Units</h1>
      <p class="mx-auto mt-4 max-w-sm text-sm text-ink-dim">
        Length and mass conversions, driven by a shared factor table.
      </p>
    </div>

    <div
      v-for="(panel, panelIndex) in panels"
      :key="panel.id"
      class="panel reveal px-6 py-8 md:px-10"
      :class="{ 'mt-8': panelIndex > 0 }"
      :style="{ animationDelay: panel.delay }"
    >
      <h2 class="label-mono mb-6">{{ panel.label }}</h2>

      <form class="flex flex-col gap-6" @submit.prevent>
        <div class="flex items-end gap-3">
          <div class="flex flex-1 flex-col gap-2">
            <label :for="`${panel.id}-value`" class="label-mono">Amount</label>
            <input
              :id="`${panel.id}-value`"
              v-model.number="panel.converter.value.value"
              type="number"
              placeholder="0"
              class="field"
            />
          </div>
          <select
            v-model="panel.converter.from.value"
            :aria-label="`${panel.label} source unit`"
            class="w-24 shrink-0 appearance-none border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink uppercase [color-scheme:dark]"
          >
            <option v-for="unit in panel.module.units" :key="unit.id" :value="unit.id">
              {{ unit.symbol }}
            </option>
          </select>
        </div>

        <div class="flex justify-center">
          <button
            type="button"
            class="btn-tick"
            :aria-label="`Swap ${panel.label} units`"
            @click="panel.converter.swap()"
          >
            <ArrowRightLeft class="size-4" />
          </button>
        </div>

        <div class="flex items-end gap-3">
          <div class="flex flex-1 flex-col gap-2">
            <label :for="`${panel.id}-result`" class="label-mono">Result</label>
            <input
              :id="`${panel.id}-result`"
              :value="formatResult(panel.converter.result.value)"
              type="text"
              readonly
              aria-live="polite"
              class="field text-accent"
            />
          </div>
          <select
            v-model="panel.converter.to.value"
            :aria-label="`${panel.label} target unit`"
            class="w-24 shrink-0 appearance-none border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink uppercase [color-scheme:dark]"
          >
            <option v-for="unit in panel.module.units" :key="unit.id" :value="unit.id">
              {{ unit.symbol }}
            </option>
          </select>
          <button
            type="button"
            class="btn-tick"
            :aria-label="`Copy ${panel.label} result`"
            @click="
              panel.converter.result.value !== null &&
              panel.clipboard.copy(copyFormatter.format(panel.converter.result.value))
            "
          >
            <Check v-if="panel.clipboard.copied.value" class="size-4 text-accent" />
            <Copy v-else class="size-4" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>