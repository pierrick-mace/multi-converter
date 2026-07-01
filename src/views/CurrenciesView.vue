<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowRightLeft } from '@lucide/vue'
import RateChart from '@/components/RateChart.vue'
import { useCurrencyRates } from '@/composables/useCurrencyRates'
import { HISTORY_RANGES, useRateHistory } from '@/composables/useRateHistory'

const {
  currencies,
  selectedCurrency,
  targetCurrency,
  amountToConvert,
  amountConverted,
  unitRate,
  inverseRate,
  rateDate,
  loading,
  error,
  loadCurrencies,
  loadRatesForSelectedCurrency,
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

onMounted(loadCurrencies)
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
                class="w-full bg-transparent px-1 py-2 font-mono text-2xl tabular-nums text-ink placeholder-ink-dim/40 focus:outline-none"
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

        <div class="flex items-center justify-center text-accent" aria-hidden="true">
          <ArrowRightLeft class="size-4" />
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
                class="w-full bg-transparent px-1 py-2 font-mono text-2xl tabular-nums text-accent focus:outline-none"
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
          </p>
          <p v-if="rateDate" class="font-mono text-xs text-ink-dim">
            ECB reference rate: {{ rateDate }}
          </p>
        </div>
      </form>
    </div>

    <div v-if="!loading && !error" class="panel reveal mt-8 px-6 py-8 md:px-10" style="animation-delay: 0.3s">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 class="label-mono">
          {{ selectedCurrency.code }} / {{ targetCurrency.code }} history
        </h2>
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
      <p v-else-if="historyLoading && historyPoints.length === 0" class="font-mono text-sm text-ink-dim">
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
