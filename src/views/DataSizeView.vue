<script setup lang="ts">
import { dataSizeModule } from '@/composables/unitModules';
import { useClipboard } from '@/composables/useClipboard';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useUnitConverter } from '@/composables/useUnitConverter';
import { ArrowRightLeft, Check, Copy } from '@lucide/vue';
import { watch } from 'vue';

const { copied, copy } = useClipboard();
const converter = useUnitConverter(dataSizeModule);

interface StoredUnitPair
{
  from: string;
  to: string;
}

// Local persistence of the last from/to selection, same pattern as
// `UnitsView`: no URL state here, so the stored pair (when present and still
// valid for the module's unit table) is simply applied once at setup, then
// kept in sync afterwards.
const storedUnits = useLocalStorage<StoredUnitPair | null>('converter:data:units', null);
const validUnitIds = new Set(dataSizeModule.units.map((unit) => unit.id));

if (storedUnits.value && validUnitIds.has(storedUnits.value.from) && validUnitIds.has(storedUnits.value.to))
{
  converter.from.value = storedUnits.value.from;
  converter.to.value = storedUnits.value.to;
}

watch([converter.from, converter.to], ([from, to]) => {
  storedUnits.value = { from, to };
});

const displayFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 6 });
const copyFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 6,
  useGrouping: false,
});

function formatResult(result: number | null): string
{
  return result === null ? '' : displayFormatter.format(result);
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-14 md:py-20">
    <div class="panel reveal mb-8 px-6 py-10 text-center md:px-12">
      <h1 class="font-display text-5xl text-ink md:text-6xl">Data</h1>
      <p class="mx-auto mt-4 max-w-sm text-sm text-ink-dim">
        Bits and bytes, decimal (kB, MB, GB, TB) and binary (KiB, MiB, GiB, TiB) prefixes, one factor table.
      </p>
    </div>

    <div class="panel reveal px-6 py-8 md:px-10" style="animation-delay: 0.15s">
      <h2 class="label-mono mb-6">Data size</h2>

      <form class="flex flex-col gap-6" @submit.prevent>
        <div class="flex items-end gap-3">
          <div class="flex flex-1 flex-col gap-2">
            <label for="data-value" class="label-mono">Amount</label>
            <input id="data-value" v-model.number="converter.value.value" type="number" placeholder="0" class="field" />
          </div>
          <select
            v-model="converter.from.value"
            aria-label="Data size source unit"
            class="w-24 shrink-0 appearance-none border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink [color-scheme:dark]"
          >
            <option v-for="unit in dataSizeModule.units" :key="unit.id" :value="unit.id">
              {{ unit.symbol }}
            </option>
          </select>
        </div>

        <div class="flex justify-center">
          <button type="button" class="btn-tick" aria-label="Swap Data size units" @click="converter.swap()">
            <ArrowRightLeft class="size-4" />
          </button>
        </div>

        <div class="flex items-end gap-3">
          <div class="flex flex-1 flex-col gap-2">
            <label for="data-result" class="label-mono">Result</label>
            <input
              id="data-result"
              :value="formatResult(converter.result.value)"
              type="text"
              readonly
              aria-live="polite"
              class="field text-accent"
            />
          </div>
          <select
            v-model="converter.to.value"
            aria-label="Data size target unit"
            class="w-24 shrink-0 appearance-none border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink [color-scheme:dark]"
          >
            <option v-for="unit in dataSizeModule.units" :key="unit.id" :value="unit.id">
              {{ unit.symbol }}
            </option>
          </select>
          <button
            type="button"
            class="btn-tick"
            aria-label="Copy Data size result"
            @click="converter.result.value !== null && copy(copyFormatter.format(converter.result.value))"
          >
            <Check v-if="copied" class="size-4 text-accent" />
            <Copy v-else class="size-4" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
