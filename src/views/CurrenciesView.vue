<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ArrowRightLeft, ArrowDown, ArrowUp, Minus } from '@lucide/vue'
import RateChart from '@/components/RateChart.vue'
import { useCurrencyRates } from '@/composables/useCurrencyRates'
import { HISTORY_RANGES, useRateHistory } from '@/composables/useRateHistory'
import type { HistoryRangeDays } from '@/composables/useRateHistory'
import { useQuerySync } from '@/composables/useQuerySync'
import type { QueryBinding } from '@/composables/useQuerySync'

const DEFAULT_FROM = 'EUR'
const DEFAULT_TO = 'USD'

const {
  currencies,
  selectedCurrency,
  targetCurrency,
  amountToConvert,
  amountConverted,
  unitRate,
  inverseRate,
  rateDate,
  previousRateDate,
  delta,
  deltaPercent,
  loading,
  error,
  loadCurrencies,
  loadRatesForSelectedCurrency,
  swapCurrencies,
} = useCurrencyRates()

const {
  points: historyPoints,
  rangeDays,
  loading: historyLoading,
  error: historyError,
} = useRateHistory(
  () => selectedCurrency.value.code,
  () => targetCurrency.value.code,
)

const rateFormatter = new Intl.NumberFormat('en', { maximumSignificantDigits: 5 })
const deltaPercentFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 2,
  signDisplay: 'always',
})

// Thin string adapters over the Currency-object refs, so the URL only ever
// deals with plain currency codes. Setting them looks up the matching
// Currency in the (possibly still empty) loaded list and silently ignores
// anything that does not resolve.
const fromCode = computed<string>({
  get: () => selectedCurrency.value.code,
  set: (code) => {
    const match = currencies.value.find((currency) => currency.code === code)
    if (!match || match.code === selectedCurrency.value.code) return
    selectedCurrency.value = match
    loadRatesForSelectedCurrency()
  },
})

const toCode = computed<string>({
  get: () => targetCurrency.value.code,
  set: (code) => {
    const match = currencies.value.find((currency) => currency.code === code)
    if (!match) return
    targetCurrency.value = match
  },
})

function parseCurrencyCode(raw: string): string | undefined {
  const code = raw.toUpperCase()
  return currencies.value.some((currency) => currency.code === code) ? code : undefined
}

function parseAmount(raw: string): number | undefined {
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function parseRange(raw: string): HistoryRangeDays | undefined {
  const upper = raw.toUpperCase()
  return HISTORY_RANGES.find((range) => range.label === upper)?.days
}

const { readFromRoute } = useQuerySync({
  from: {
    ref: fromCode,
    fromQuery: parseCurrencyCode,
    toQuery: (value) => (value === DEFAULT_FROM ? undefined : value),
  } satisfies QueryBinding<string>,
  to: {
    ref: toCode,
    fromQuery: parseCurrencyCode,
    toQuery: (value) => (value === DEFAULT_TO ? undefined : value),
  } satisfies QueryBinding<string>,
  amount: {
    ref: amountToConvert,
    fromQuery: parseAmount,
    toQuery: (value) => (value === null ? undefined : String(value)),
  } satisfies QueryBinding<number | null>,
  range: {
    ref: rangeDays,
    fromQuery: parseRange,
    toQuery: (value) =>
      value === 30 ? undefined : HISTORY_RANGES.find((range) => range.days === value)?.label,
  } satisfies QueryBinding<HistoryRangeDays>,
})

onMounted(async () => {
  await loadCurrencies()
  // The currency list just finished loading async, so `from`/`to` query
  // params (invalid until now, since there was nothing to validate them
  // against) can be re-applied on top of the freshly loaded defaults.
  readFromRoute()
})
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-14 md:py-20">
    <div class="panel reveal mb-8 px-6 py-10 text-center md:px-12">
      <p class="label-mono mb-4">Module 02</p>
      <h1 class="font-display text-5xl text-ink md:text-6xl">Currencies</h1>
      <p class="mx-auto mt-4 max-w-sm text-sm text-ink-dim">
        Live mid-market rates, sourced from the Frankfurter API.
      </p>
    </div>

    <div class="panel reveal px-6 py-8 md:px-10" style="animation-delay: 0.15s">
      <p v-if="loading" class="font-mono text-sm text-ink-dim">Loading rates&hellip;</p>
      <p v-else-if="error" class="font-mono text-sm text-danger" role="alert">{{ error }}</p>

      <form v-else class="flex flex-col gap-6" @submit.prevent>
        <div class="flex flex-col gap-2">
          <label for="amount-from" class="label-mono">From</label>
          <div class="flex items-stretch gap-3">
            <div class="flex flex-1 items-center border-b-2 border-rule focus-within:border-accent">
              <input
                id="amount-from"
                v-model.number="amountToConvert"
                type="number"
                placeholder="0.00"
                class="w-full bg-transparent px-1 py-2 font-mono text-2xl tabular-nums text-ink placeholder-ink-dim/85"
              />
            </div>
            <select
              v-model="selectedCurrency"
              aria-label="Source currency"
              class="w-28 appearance-none border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink uppercase [color-scheme:dark]"
              @change="loadRatesForSelectedCurrency"
            >
              <option v-for="currency in currencies" :key="currency.code" :value="currency">
                {{ currency.code }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-center">
          <button
            type="button"
            class="btn-tick"
            aria-label="Swap currencies"
            @click="swapCurrencies"
          >
            <ArrowRightLeft class="size-4" />
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <label for="amount-to" class="label-mono">To</label>
          <div class="flex items-stretch gap-3">
            <div class="flex flex-1 items-center border-b-2 border-rule">
              <input
                id="amount-to"
                :value="amountConverted.toFixed(2)"
                type="text"
                readonly
                aria-live="polite"
                class="w-full bg-transparent px-1 py-2 font-mono text-2xl tabular-nums text-accent"
              />
            </div>
            <select
              v-model="targetCurrency"
              aria-label="Target currency"
              class="w-28 appearance-none border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink uppercase [color-scheme:dark]"
            >
              <option v-for="currency in currencies" :key="currency.code" :value="currency">
                {{ currency.code }}
              </option>
            </select>
          </div>
        </div>
        <div
          v-if="unitRate !== null"
          class="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-4"
        >
          <p class="font-mono text-sm tabular-nums text-ink">
            1 {{ selectedCurrency.code }} = {{ rateFormatter.format(unitRate) }}
            {{ targetCurrency.code }}
            <span v-if="inverseRate !== null" class="text-ink-dim">
              / 1 {{ targetCurrency.code }} = {{ rateFormatter.format(inverseRate) }}
              {{ selectedCurrency.code }}
            </span>
            <span
              v-if="delta !== null"
              class="ml-2 inline-flex items-center gap-1 align-middle"
              :class="delta > 0 ? 'text-accent' : delta < 0 ? 'text-danger' : 'text-ink-dim'"
            >
              <ArrowUp v-if="delta > 0" class="size-3" aria-hidden="true" />
              <ArrowDown v-else-if="delta < 0" class="size-3" aria-hidden="true" />
              <Minus v-else class="size-3" aria-hidden="true" />
              <span v-if="deltaPercent !== null"
                >{{ deltaPercentFormatter.format(deltaPercent) }}%</span
              >
            </span>
          </p>
          <div class="text-right">
            <p v-if="rateDate" class="font-mono text-xs text-ink-dim">
              ECB reference rate: {{ rateDate }}
            </p>
            <p v-if="previousRateDate" class="label-mono">vs {{ previousRateDate }}</p>
          </div>
        </div>
      </form>
    </div>

    <div
      v-if="!loading && !error"
      class="panel reveal mt-8 px-6 py-8 md:px-10"
      style="animation-delay: 0.3s"
    >
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 class="label-mono">{{ selectedCurrency.code }} / {{ targetCurrency.code }} history</h2>
        <div class="flex gap-2" role="group" aria-label="History range">
          <button
            v-for="range in HISTORY_RANGES"
            :key="range.days"
            type="button"
            class="border px-3 py-1 font-mono text-xs uppercase transition-colors"
            :class="
              rangeDays === range.days
                ? 'border-accent bg-accent text-abyss'
                : 'border-rule text-ink-dim hover:border-accent hover:text-accent'
            "
            :aria-pressed="rangeDays === range.days"
            @click="rangeDays = range.days"
          >
            {{ range.label }}
          </button>
        </div>
      </div>

      <p v-if="historyError" class="font-mono text-sm text-danger" role="alert">
        {{ historyError }}
      </p>
      <p
        v-else-if="selectedCurrency.code === targetCurrency.code"
        class="font-mono text-sm text-ink-dim"
      >
        Select two different currencies to chart their exchange rate.
      </p>
      <p
        v-else-if="historyLoading && historyPoints.length === 0"
        class="font-mono text-sm text-ink-dim"
      >
        Loading rate history&hellip;
      </p>
      <div v-else :class="{ 'opacity-50': historyLoading }" class="transition-opacity">
        <RateChart
          :points="historyPoints"
          :base-code="selectedCurrency.code"
          :target-code="targetCurrency.code"
        />
      </div>
    </div>
  </div>
</template>
