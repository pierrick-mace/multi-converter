<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ArrowRightLeft, ArrowDown, ArrowUp, Minus, X, Copy, Check, Link2 } from '@lucide/vue'
import RateChart from '@/components/RateChart.vue'
import { useCurrencyRates } from '@/composables/useCurrencyRates'
import { HISTORY_RANGES, useRateHistory } from '@/composables/useRateHistory'
import type { HistoryRangeDays } from '@/composables/useRateHistory'
import { defaultBoardFor, useRateBoard } from '@/composables/useRateBoard'
import { useQuerySync } from '@/composables/useQuerySync'
import type { QueryBinding } from '@/composables/useQuerySync'
import { useClipboard } from '@/composables/useClipboard'
import { formatCurrencyAmount } from '@/composables/formatCurrency'

const DEFAULT_FROM = 'EUR'
const DEFAULT_TO = 'USD'

// Frankfurter's data starts here; the date input is clamped to this range.
const MIN_DATE = '1999-01-04'
const todayDate = new Date().toISOString().slice(0, 10)

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
  conversionDate,
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

const {
  targetCodes: boardCodes,
  rows: boardRows,
  loading: boardLoading,
  error: boardError,
  setTargetCodes: setBoardCodes,
  addTarget: addBoardTarget,
  removeTarget: removeBoardTarget,
} = useRateBoard(
  () => selectedCurrency.value.code,
  () => currencies.value,
)

const boardDisplayRows = computed(() =>
  boardCodes.value.map((code) => {
    const row = boardRows.value.find((entry) => entry.code === code)
    return {
      code,
      rate: row?.rate ?? null,
      delta: row?.delta ?? null,
      deltaPercent: row?.deltaPercent ?? null,
    }
  }),
)

const addableBoardCurrencies = computed(() =>
  currencies.value.filter(
    (currency) => currency.code !== fromCode.value && !boardCodes.value.includes(currency.code),
  ),
)

function onAddBoardTarget(event: Event) {
  const select = event.target as HTMLSelectElement
  if (select.value) addBoardTarget(select.value)
  select.value = ''
}

const rateFormatter = new Intl.NumberFormat('en', { maximumSignificantDigits: 5 })
const deltaPercentFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 2,
  signDisplay: 'always',
})

// One `useClipboard` instance per button, per the Phase 1 convention: sharing
// a single instance would make both buttons flash "copied" together.
const amountClipboard = useClipboard()
const shareClipboard = useClipboard()

function copyConvertedAmount() {
  amountClipboard.copy(formatCurrencyAmount(amountConverted.value, targetCurrency.value.code))
}

function copyShareLink() {
  // The app's entire state (pair, amount, range, date, board) already lives
  // in the URL query via `useQuerySync`, so the current URL IS the share
  // payload: no need to build it by hand.
  shareClipboard.copy(window.location.href)
}

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

// Domain-shaped adapter (string | null, null meaning "latest") over
// `conversionDate`, used for URL sync. Setting it (and only actually
// changing the value) triggers a reload, same as `fromCode` does for a base
// currency change.
const dateQuery = computed<string | null>({
  get: () => conversionDate.value,
  set: (value) => {
    if (value === conversionDate.value) return
    conversionDate.value = value
    loadRatesForSelectedCurrency()
  },
})

// DOM-shaped adapter over `dateQuery`: native <input type="date"> wants a
// plain string, using '' for "no date selected", never null.
const dateInputValue = computed<string>({
  get: () => dateQuery.value ?? '',
  set: (value) => {
    dateQuery.value = value === '' ? null : value
  },
})

function backToLatest() {
  dateQuery.value = null
}

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

function parseConversionDate(raw: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined
  return raw >= MIN_DATE && raw <= todayDate ? raw : undefined
}

// Order-insensitive equality; both `a` and `b` are always already-deduped
// currency-code lists (see `parseBoardCodes` and `useRateBoard`'s own
// validation), so a length check plus a one-way membership check is enough.
function sameCodes(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every((code) => setA.has(code))
}

// The default basket, minus the base, further narrowed to codes the loaded
// currency list actually knows about. This is exactly what `useRateBoard`
// itself resolves an uncustomized basket down to, so comparing against it
// (rather than the raw `defaultBoardFor`) is what keeps default-state URLs
// free of a `board` param.
const defaultBoardCodes = computed<string[]>(() =>
  defaultBoardFor(fromCode.value).filter((code) =>
    currencies.value.some((currency) => currency.code === code),
  ),
)

function parseBoardCodes(raw: string): string[] {
  const base = fromCode.value
  const seen = new Set<string>()
  const valid: string[] = []
  for (const code of raw
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean)) {
    if (code === base || seen.has(code)) continue
    if (!currencies.value.some((currency) => currency.code === code)) continue
    seen.add(code)
    valid.push(code)
  }
  return valid
}

// Writable adapter over the board's (read-only) `targetCodes`: the setter
// only calls through to `setTargetCodes` (and so only triggers a board
// refetch and a URL rewrite) when the basket content actually changed.
// Without this guard, `readFromRoute` re-running on every unrelated query
// change (amount, range...) would call it with a brand-new array every time
// and trigger a spurious board refetch even when the basket is unchanged.
const boardCodesQuery = computed<string[]>({
  get: () => boardCodes.value,
  set: (codes) => {
    if (sameCodes(codes, boardCodes.value)) return
    setBoardCodes(codes)
  },
})

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
  date: {
    ref: dateQuery,
    fromQuery: parseConversionDate,
    toQuery: (value) => value ?? undefined,
  } satisfies QueryBinding<string | null>,
  board: {
    ref: boardCodesQuery,
    fromQuery: parseBoardCodes,
    toQuery: (value) => (sameCodes(value, defaultBoardCodes.value) ? undefined : value.join(',')),
  } satisfies QueryBinding<string[]>,
})

onMounted(async () => {
  await loadCurrencies()
  // The currency list just finished loading async, so `from`/`to`/`board`
  // query params (invalid until now, since there was nothing to validate
  // them against) can be re-applied on top of the freshly loaded defaults.
  // The board itself needs no explicit seeding: its default basket is
  // derived reactively from the base and currency list, not stored.
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
            <button
              type="button"
              class="btn-tick"
              aria-label="Copy converted amount"
              @click="copyConvertedAmount"
            >
              <Check v-if="amountClipboard.copied.value" class="size-4 text-accent" />
              <Copy v-else class="size-4" />
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label for="conversion-date" class="label-mono">Historical date</label>
            <button
              v-if="conversionDate"
              type="button"
              class="font-mono text-xs text-ink-dim uppercase transition-colors hover:text-accent"
              @click="backToLatest"
            >
              Back to latest
            </button>
          </div>
          <input
            id="conversion-date"
            v-model="dateInputValue"
            type="date"
            :min="MIN_DATE"
            :max="todayDate"
            class="w-full border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink [color-scheme:dark]"
          />
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
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p v-if="conversionDate && rateDate" class="label-mono">Rates as of {{ rateDate }}</p>
              <p v-else-if="rateDate" class="font-mono text-xs text-ink-dim">
                ECB reference rate: {{ rateDate }}
              </p>
              <p v-if="previousRateDate" class="label-mono">vs {{ previousRateDate }}</p>
            </div>
            <button
              type="button"
              class="btn-tick"
              aria-label="Copy share link"
              @click="copyShareLink"
            >
              <Check v-if="shareClipboard.copied.value" class="size-4 text-accent" />
              <Link2 v-else class="size-4" />
            </button>
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
        <h2 class="label-mono">{{ selectedCurrency.code }} rate board</h2>
        <div class="flex items-center gap-2">
          <select
            aria-label="Add currency to rate board"
            class="w-32 appearance-none border border-rule bg-panel-raised px-3 py-2 font-mono text-sm text-ink uppercase [color-scheme:dark]"
            :value="''"
            @change="onAddBoardTarget"
          >
            <option value="" disabled>Add&hellip;</option>
            <option
              v-for="currency in addableBoardCurrencies"
              :key="currency.code"
              :value="currency.code"
            >
              {{ currency.code }}
            </option>
          </select>
        </div>
      </div>

      <p
        v-if="boardLoading && boardDisplayRows.length === 0"
        class="font-mono text-sm text-ink-dim"
      >
        Loading rate board&hellip;
      </p>
      <p v-else-if="boardError" class="font-mono text-sm text-danger" role="alert">
        {{ boardError }}
      </p>
      <p v-else-if="boardDisplayRows.length === 0" class="font-mono text-sm text-ink-dim">
        Add a currency to start building a rate board.
      </p>
      <ul v-else :class="{ 'opacity-50': boardLoading }" class="transition-opacity">
        <li
          v-for="row in boardDisplayRows"
          :key="row.code"
          class="flex items-center justify-between gap-4 border-b border-rule py-3 last:border-b-0"
        >
          <p class="font-mono text-sm text-ink">{{ row.code }}</p>
          <div class="flex items-center gap-4">
            <p class="font-mono text-sm tabular-nums text-ink">
              {{ row.rate !== null ? rateFormatter.format(row.rate) : '—' }}
            </p>
            <span
              v-if="row.delta !== null"
              class="inline-flex w-16 items-center gap-1 font-mono text-xs tabular-nums"
              :class="
                row.delta > 0 ? 'text-accent' : row.delta < 0 ? 'text-danger' : 'text-ink-dim'
              "
            >
              <ArrowUp v-if="row.delta > 0" class="size-3" aria-hidden="true" />
              <ArrowDown v-else-if="row.delta < 0" class="size-3" aria-hidden="true" />
              <Minus v-else class="size-3" aria-hidden="true" />
              <span v-if="row.deltaPercent !== null"
                >{{ deltaPercentFormatter.format(row.deltaPercent) }}%</span
              >
            </span>
            <button
              type="button"
              class="text-ink-dim transition-colors hover:text-danger"
              :aria-label="`Remove ${row.code} from rate board`"
              @click="removeBoardTarget(row.code)"
            >
              <X class="size-4" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div
      v-if="!loading && !error"
      class="panel reveal mt-8 px-6 py-8 md:px-10"
      style="animation-delay: 0.45s"
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
