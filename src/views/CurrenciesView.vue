<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowRightLeft } from '@lucide/vue'
import { useCurrencyRates } from '@/composables/useCurrencyRates'

const {
  currencies,
  selectedCurrency,
  targetCurrency,
  amountToConvert,
  amountConverted,
  loading,
  error,
  loadCurrencies,
  loadRatesForSelectedCurrency,
} = useCurrencyRates()

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
      </form>
    </div>
  </div>
</template>
