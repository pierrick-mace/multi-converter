import { Thermometer, Coins, Ruler, Binary, Database } from '@lucide/vue'
import type { Component } from 'vue'

/**
 * Single source of truth for every conversion module: NavBar links and the
 * HomeView module grid both derive their entries from this array. Route
 * components stay lazily imported in `src/router/index.ts`; this registry
 * only carries display metadata.
 */
export interface ConversionModule {
  /** Route path, matches the corresponding entry in src/router/index.ts. */
  path: string
  /** Route name, matches the corresponding entry in src/router/index.ts. */
  name: string
  /** Short nav/card label. */
  label: string
  /** One-line description shown on the home card. */
  description: string
  /** Lucide icon component. */
  icon: Component
}

export const modules: ConversionModule[] = [
  {
    path: '/temperature',
    name: 'temperature',
    label: 'Temperature',
    description: 'Celsius, Fahrenheit, Kelvin, synced in real time.',
    icon: Thermometer,
  },
  {
    path: '/currencies',
    name: 'currencies',
    label: 'Currencies',
    description: 'Live mid-market rates from the Frankfurter API.',
    icon: Coins,
  },
  {
    path: '/units',
    name: 'units',
    label: 'Units',
    description: 'Length and mass, driven by a shared factor table.',
    icon: Ruler,
  },
  {
    path: '/bases',
    name: 'bases',
    label: 'Bases',
    description: 'Binary, octal, decimal, and hex, synced instantly.',
    icon: Binary,
  },
  {
    path: '/data',
    name: 'data',
    label: 'Data',
    description: 'Bits and bytes, decimal and binary prefixes.',
    icon: Database,
  },
]
