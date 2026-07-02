# Converter

A multi-conversion tool built with Vue 3, TypeScript, and Vite, wrapped in a dark
instrument-panel design. Convert temperatures (Celsius, Fahrenheit, Kelvin) and
currencies with live rates and a historical rate chart, powered by the
[Frankfurter API](https://frankfurter.dev).

## Features

- **Temperature**: Celsius, Fahrenheit, and Kelvin kept in sync, with copy-to-clipboard.
- **Currencies**: live exchange rates, unit and inverse rates, and an SVG rate-history
  chart with 1M/3M/1Y ranges.

## Stack

- Vue 3.5 (Composition API, `<script setup>`)
- TypeScript 5.9 + Vite 8 + vue-tsc
- Vue Router 4 (lazy-loaded views)
- Tailwind CSS v4
- Lucide icons (`@lucide/vue`)
- Vitest + @vue/test-utils
- oxlint + oxfmt

## Project layout

See [`backbone.yml`](backbone.yml) for a full navigation map of the codebase.
In short: views in `src/views/`, reusable state in `src/composables/`, API calls
in `src/services/`, shared types in `src/types/`.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build   # type-checks then builds to dist/
npm run preview # preview the production build
```

## Tests, linting, formatting

```sh
npm run test       # run the Vitest suite once
npm run test:watch # watch mode
npm run lint       # oxlint
npm run format     # oxfmt, formats in place
npm run typecheck  # vue-tsc --noEmit
```
