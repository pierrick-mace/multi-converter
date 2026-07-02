import { ref, watch } from 'vue';
import type { Ref } from 'vue';

/**
 * Typed wrapper around `localStorage`: returns a `Ref<T>` that reads its
 * initial value from storage (falling back to `defaultValue`) and writes
 * through to storage on every subsequent change.
 *
 * Key convention (the caller's job, not enforced here): namespace keys as
 * `converter:<view>:<what>`, e.g. `converter:currencies:pair`, so different
 * views never collide on the same storage key.
 *
 * Guards, both silent (never throw into the caller):
 * - A missing key, corrupted JSON, or any other read failure falls back to
 *   `defaultValue`.
 * - `localStorage` being unavailable altogether (private browsing in some
 *   browsers throws on access, not just on `setItem`, and quota-exceeded
 *   errors are always a risk) is treated the same way: reads fall back to
 *   the default and writes are skipped. The returned ref keeps working as an
 *   ordinary in-memory ref either way, just without persistence.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T>
{
  const state = ref<T>(readStorage(key, defaultValue)) as Ref<T>;

  watch(
    state,
    (value) => writeStorage(key, value),
    // A no-op for primitives; needed so in-place mutations of object/array
    // values (push, property assignment, ...), not just whole-value
    // reassignment, also get persisted.
    { deep: true },
  );

  return state;
}

function readStorage<T>(key: string, defaultValue: T): T
{
  try
  {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  }
  catch
  {
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): void
{
  try
  {
    localStorage.setItem(key, JSON.stringify(value));
  }
  catch
  {
    // Storage disabled, blocked, or full: keep working in-memory, just don't persist.
  }
}
