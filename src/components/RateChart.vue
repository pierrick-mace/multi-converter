<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RatePoint } from '@/types/currency'

const props = defineProps<{
  points: RatePoint[]
  baseCode: string
  targetCode: string
}>()

const VIEW_W = 640
const VIEW_H = 240
const PAD = { top: 16, right: 64, bottom: 28, left: 56 }
const PLOT_W = VIEW_W - PAD.left - PAD.right
const PLOT_H = VIEW_H - PAD.top - PAD.bottom

const svgEl = ref<SVGSVGElement | null>(null)
const activeIndex = ref<number | null>(null)

const rateFormatter = new Intl.NumberFormat('en', { maximumSignificantDigits: 5 })

const domain = computed(() => {
  const rates = props.points.map((p) => p.rate)
  let min = Math.min(...rates)
  let max = Math.max(...rates)
  if (min === max) {
    // flat series: pad the domain so the line sits mid-plot instead of on an edge
    const pad = Math.abs(min) * 0.01 || 0.01
    min -= pad
    max += pad
  }
  return { min, max }
})

const ticks = computed(() => {
  const { min, max } = domain.value
  const rawStep = (max - min) / 3
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const residual = rawStep / magnitude
  const step = (residual >= 5 ? 5 : residual >= 2 ? 2 : 1) * magnitude
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  const values: { value: number; label: string }[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) {
    values.push({ value: v, label: v.toFixed(decimals) })
  }
  return values
})

function xAt(index: number): number {
  if (props.points.length < 2) return PAD.left + PLOT_W / 2
  return PAD.left + (index / (props.points.length - 1)) * PLOT_W
}

function yAt(rate: number): number {
  const { min, max } = domain.value
  return PAD.top + (1 - (rate - min) / (max - min)) * PLOT_H
}

const coords = computed(() => props.points.map((p, i) => ({ x: xAt(i), y: yAt(p.rate) })))

const linePath = computed(() =>
  coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' '),
)

const areaPath = computed(() => {
  if (coords.value.length < 2) return ''
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  const floor = PAD.top + PLOT_H
  return `${linePath.value} L${last.x.toFixed(2)},${floor} L${first.x.toFixed(2)},${floor} Z`
})

const endPoint = computed(() => {
  const last = coords.value[coords.value.length - 1]
  const point = props.points[props.points.length - 1]
  return last && point ? { ...last, label: rateFormatter.format(point.rate) } : null
})

const xLabels = computed(() => {
  if (props.points.length < 2) return []
  const mid = Math.floor((props.points.length - 1) / 2)
  return [0, mid, props.points.length - 1].map((i) => ({
    x: xAt(i),
    label: props.points[i].date,
    anchor: i === 0 ? 'start' : i === props.points.length - 1 ? 'end' : 'middle',
  }))
})

const active = computed(() => {
  if (activeIndex.value === null) return null
  const point = props.points[activeIndex.value]
  const coord = coords.value[activeIndex.value]
  if (!point || !coord) return null
  return { ...coord, date: point.date, label: rateFormatter.format(point.rate) }
})

const tooltipStyle = computed(() => {
  if (!active.value) return {}
  const xRatio = active.value.x / VIEW_W
  return {
    left: `${xRatio * 100}%`,
    top: `${(active.value.y / VIEW_H) * 100}%`,
    transform: `translate(${xRatio > 0.8 ? '-100%' : xRatio < 0.15 ? '0' : '-50%'}, calc(-100% - 12px))`,
  }
})

const chartLabel = computed(() => {
  const first = props.points[0]
  const last = props.points[props.points.length - 1]
  return `${props.baseCode} to ${props.targetCode} exchange rate, ${props.points.length} daily values from ${first?.date} to ${last?.date}`
})

function onPointerMove(event: PointerEvent) {
  const svg = svgEl.value
  if (!svg || props.points.length === 0) return
  const rect = svg.getBoundingClientRect()
  if (rect.width === 0) return
  const x = ((event.clientX - rect.left) / rect.width) * VIEW_W
  const ratio = Math.min(1, Math.max(0, (x - PAD.left) / PLOT_W))
  activeIndex.value = Math.round(ratio * (props.points.length - 1))
}

function onKeydown(event: KeyboardEvent) {
  const max = props.points.length - 1
  if (max < 0) return
  const current = activeIndex.value ?? max
  const next =
    event.key === 'ArrowLeft'
      ? Math.max(0, current - 1)
      : event.key === 'ArrowRight'
        ? Math.min(max, current + 1)
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? max
            : null
  if (next === null) return
  event.preventDefault()
  activeIndex.value = next
}

function clearActive() {
  activeIndex.value = null
}

watch(() => props.points, clearActive)
</script>

<template>
  <div class="relative">
    <svg
      ref="svgEl"
      :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
      class="block w-full focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
      role="img"
      :aria-label="chartLabel"
      tabindex="0"
      @pointermove="onPointerMove"
      @pointerleave="clearActive"
      @focus="activeIndex = points.length - 1"
      @blur="clearActive"
      @keydown="onKeydown"
    >
      <!-- gridlines + y ticks -->
      <g v-for="tick in ticks" :key="tick.value">
        <line
          :x1="PAD.left"
          :x2="VIEW_W - PAD.right"
          :y1="yAt(tick.value)"
          :y2="yAt(tick.value)"
          class="stroke-rule/50"
          stroke-width="1"
        />
        <text
          :x="PAD.left - 8"
          :y="yAt(tick.value)"
          text-anchor="end"
          dominant-baseline="middle"
          class="fill-ink-dim font-mono text-[10px] tabular-nums"
        >
          {{ tick.label }}
        </text>
      </g>

      <!-- x labels -->
      <text
        v-for="label in xLabels"
        :key="label.label"
        :x="label.x"
        :y="VIEW_H - 8"
        :text-anchor="label.anchor"
        class="fill-ink-dim font-mono text-[10px]"
      >
        {{ label.label }}
      </text>

      <!-- area wash + line -->
      <path v-if="areaPath" :d="areaPath" class="fill-accent/10" />
      <path
        v-if="coords.length > 1"
        :d="linePath"
        fill="none"
        class="stroke-accent"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- crosshair + active marker -->
      <g v-if="active">
        <line
          :x1="active.x"
          :x2="active.x"
          :y1="PAD.top"
          :y2="PAD.top + PLOT_H"
          class="stroke-ink-dim/60"
          stroke-width="1"
        />
        <circle :cx="active.x" :cy="active.y" r="5" class="fill-accent stroke-panel" stroke-width="2" />
      </g>

      <!-- end marker + direct end label -->
      <g v-if="endPoint">
        <circle :cx="endPoint.x" :cy="endPoint.y" r="4" class="fill-accent stroke-panel" stroke-width="2" />
        <text
          :x="endPoint.x + 10"
          :y="endPoint.y"
          dominant-baseline="middle"
          class="fill-ink font-mono text-[11px] tabular-nums"
        >
          {{ endPoint.label }}
        </text>
      </g>
    </svg>

    <div
      v-if="active"
      class="pointer-events-none absolute z-10 border border-rule bg-panel-raised px-3 py-2"
      :style="tooltipStyle"
      role="status"
    >
      <p class="font-mono text-sm tabular-nums text-ink">{{ active.label }} {{ targetCode }}</p>
      <p class="font-mono text-[10px] text-ink-dim">{{ active.date }}</p>
    </div>

    <details class="mt-4 border-t border-rule pt-3">
      <summary class="label-mono cursor-pointer">Data table</summary>
      <div class="mt-3 max-h-48 overflow-y-auto">
        <table class="w-full text-left font-mono text-xs">
          <thead>
            <tr class="text-ink-dim">
              <th scope="col" class="py-1 font-normal">Date</th>
              <th scope="col" class="py-1 font-normal">1 {{ baseCode }} in {{ targetCode }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in points" :key="point.date" class="border-t border-rule/40 text-ink">
              <td class="py-1">{{ point.date }}</td>
              <td class="py-1 tabular-nums">{{ rateFormatter.format(point.rate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>
