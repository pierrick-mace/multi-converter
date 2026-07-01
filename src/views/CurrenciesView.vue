<script setup lang="ts">
import { onMounted } from 'vue'
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
  <div class="mx-auto max-w-xl px-4 py-12">
    <div class="glass mb-8 px-6 py-10 text-center">
      <h1 class="font-display text-4xl md:text-5xl">Currency rates</h1>
    </div>

    <div class="glass px-6 py-8">
      <p v-if="loading" class="text-white/80">Loading rates…</p>
      <p v-else-if="error" class="text-red-300">{{ error }}</p>

      <form v-else class="mx-auto flex max-w-sm flex-col gap-4" @submit.prevent>
        <div class="flex items-center gap-2">
          <input
            v-model.number="amountToConvert"
            type="number"
            placeholder="Amount to convert"
            class="w-full rounded-lg border border-white/20 bg-black/10 px-3 py-2 text-white placeholder-white/50 focus:outline-none"
          />
          <select
            v-model="selectedCurrency"
            class="appearance-none rounded-lg border border-white/20 bg-black/40 px-2 py-2 text-white [color-scheme:dark]"
            @change="loadRatesForSelectedCurrency"
          >
            <option v-for="currency in currencies" :key="currency.code" :value="currency">
              {{ currency.code }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <input
            :value="amountConverted.toFixed(2)"
            type="text"
            readonly
            class="w-full rounded-lg border border-white/20 bg-black/10 px-3 py-2 text-white"
          />
          <select
            v-model="targetCurrency"
            class="appearance-none rounded-lg border border-white/20 bg-black/40 px-2 py-2 text-white [color-scheme:dark]"
          >
            <option v-for="currency in currencies" :key="currency.code" :value="currency">
              {{ currency.code }}
            </option>
          </select>
        </div>
      </form>
    </div>
  </div>
</template>
