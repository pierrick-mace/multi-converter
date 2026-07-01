# Converter

An elegant multi-conversion tool built with Vue 3, TypeScript, and Vite. Convert temperatures
and currencies (live rates via the [Frankfurter API](https://frankfurter.dev)).

## Stack

- Vue 3.5 (Composition API, `<script setup>`)
- Vite 8 + vue-tsc
- Vue Router 4
- Tailwind CSS v4
- Vitest + @vue/test-utils
- oxlint + Prettier

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
npm run lint        # oxlint
npm run format      # prettier --write
npm run typecheck    # vue-tsc --noEmit
```
