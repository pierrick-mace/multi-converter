import type { UnitModule } from '@/types/units';
import { computed, ref } from 'vue';

export function convertUnit(value: number, from: string, to: string, factors: Record<string, number>): number
{
  const fromFactor = factors[from];
  const toFactor = factors[to];
  if (fromFactor === undefined)
  {
    throw new Error(`Unknown unit id: ${from}`);
  }
  if (toFactor === undefined)
  {
    throw new Error(`Unknown unit id: ${to}`);
  }

  const baseValue = value * fromFactor;
  return baseValue / toFactor;
}

export function useUnitConverter(definition: UnitModule)
{
  const factors = Object.fromEntries(definition.units.map((unit) => [unit.id, unit.factor]));

  const value = ref<number | null>(null);
  const from = ref(definition.defaultFrom);
  const to = ref(definition.defaultTo);

  const result = computed(() => {
    if (typeof value.value !== 'number' || Number.isNaN(value.value))
    {
      return null;
    }
    return convertUnit(value.value, from.value, to.value, factors);
  });

  function swap()
  {
    const previousFrom = from.value;
    from.value = to.value;
    to.value = previousFrom;
  }

  return { value, from, to, result, swap };
}
