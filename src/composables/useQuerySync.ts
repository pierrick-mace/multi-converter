import { watch } from 'vue';
import type { Ref } from 'vue';
import type { LocationQueryRaw } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';

/**
 * Binds a single query-string param to a ref.
 *
 * `fromQuery` doubles as validation: return `undefined` for anything that
 * cannot be parsed (missing currency, non-numeric amount, unknown range
 * label), and the ref is left untouched, i.e. it silently falls back to
 * whatever default it already holds.
 *
 * `toQuery` doubles as "is this the default value": return `undefined` to
 * omit the param from the URL entirely, keeping default-state URLs clean.
 */
export interface QueryBinding<T = unknown>
{
  ref: Ref<T>;
  fromQuery: (raw: string) => T | undefined;
  toQuery: (value: T) => string | undefined;
}

export type QueryBindings = Record<string, QueryBinding>;

/**
 * Keeps a set of refs in sync with the current route's query params, the
 * URL-first alternative to a store for small, shareable pieces of state.
 *
 * - `readFromRoute` reads query params into the refs. It runs once during
 *   setup and again whenever the route's query changes externally (back /
 *   forward navigation, a pasted link). It is also returned so callers can
 *   re-run it once async data a `fromQuery` validator depends on (e.g. a
 *   currency list) has finished loading.
 * - Whenever a bound ref changes, the query string is updated via
 *   `router.replace` so typing/selecting never pushes a history entry.
 *
 * Feedback loops (route change -> ref write -> route change -> ...) are
 * avoided structurally rather than with a re-entrancy flag: writing back to
 * the route only touches params whose serialized value actually differs
 * from what is already in the URL, so a ref set from the current query
 * always re-serializes to that same value and the write step is a no-op.
 */
export function useQuerySync(bindings: QueryBindings)
{
  const route = useRoute();
  const router = useRouter();

  function readFromRoute()
  {
    for (const [key, binding] of Object.entries(bindings))
    {
      const raw = route.query[key];
      if (typeof raw !== 'string') continue;
      const parsed = binding.fromQuery(raw);
      if (parsed === undefined) continue;
      binding.ref.value = parsed;
    }
  }

  function writeToRoute()
  {
    const query: LocationQueryRaw = { ...route.query };
    let changed = false;

    for (const [key, binding] of Object.entries(bindings))
    {
      const serialized = binding.toQuery(binding.ref.value);
      const current = route.query[key];

      if (serialized === undefined)
      {
        if (key in query)
        {
          delete query[key];
          changed = true;
        }
        continue;
      }

      if (current !== serialized)
      {
        query[key] = serialized;
        changed = true;
      }
    }

    if (changed) router.replace({ query });
  }

  readFromRoute();

  watch(
    Object.values(bindings).map((binding) => binding.ref),
    writeToRoute,
  );

  watch(() => route.query, readFromRoute);

  return { readFromRoute, writeToRoute };
}
