# Converter

A multi-conversion tool built with Vue 3, TypeScript, and Vite, wrapped in a dark
instrument-panel design. Convert temperatures, currencies (live rates from the
[Frankfurter API](https://frankfurter.dev)), number bases, units, and data sizes.

## Features

- **Temperature**: Celsius, Fahrenheit, and Kelvin kept in sync, with copy-to-clipboard.
- **Currencies**: live exchange rates, unit and inverse rates, historical dates, a
  multi-target rate board, and an SVG rate-history chart with 1M/3M/1Y ranges. State
  syncs to the URL, and rates are cached for offline use.
- **Bases**: binary, octal, decimal, and hexadecimal, using unsigned BigInt.
- **Units**: length and mass converters.
- **Data size**: bits and bytes across decimal and binary prefixes.

## Stack

- Vue 3.5 (Composition API, `<script setup>`)
- TypeScript 5.9 + Vite 8 + vue-tsc
- Vue Router 4 (lazy-loaded views)
- Tailwind CSS v4
- Lucide icons (`@lucide/vue`)
- Vitest + @vue/test-utils
- oxlint + dprint

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
npm run format     # dprint fmt, formats in place
npm run typecheck  # vue-tsc --noEmit
```

## CI

[GitHub Actions](.github/workflows/ci.yml) runs lint, typecheck, tests, and build
on every push and pull request to `master`.
