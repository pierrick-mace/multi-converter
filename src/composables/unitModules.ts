import type { UnitModule } from '@/types/units'

// Base unit: meter.
export const lengthModule: UnitModule = {
  units: [
    { id: 'm', label: 'Meter', symbol: 'm', factor: 1 },
    { id: 'km', label: 'Kilometer', symbol: 'km', factor: 1000 },
    { id: 'cm', label: 'Centimeter', symbol: 'cm', factor: 0.01 },
    { id: 'mm', label: 'Millimeter', symbol: 'mm', factor: 0.001 },
    { id: 'mi', label: 'Mile', symbol: 'mi', factor: 1609.344 },
    { id: 'yd', label: 'Yard', symbol: 'yd', factor: 0.9144 },
    { id: 'ft', label: 'Foot', symbol: 'ft', factor: 0.3048 },
    { id: 'in', label: 'Inch', symbol: 'in', factor: 0.0254 },
  ],
  defaultFrom: 'km',
  defaultTo: 'mi',
}

// Base unit: kilogram.
export const massModule: UnitModule = {
  units: [
    { id: 'kg', label: 'Kilogram', symbol: 'kg', factor: 1 },
    { id: 'g', label: 'Gram', symbol: 'g', factor: 0.001 },
    { id: 'mg', label: 'Milligram', symbol: 'mg', factor: 0.000001 },
    { id: 't', label: 'Tonne', symbol: 't', factor: 1000 },
    { id: 'lb', label: 'Pound', symbol: 'lb', factor: 0.45359237 },
    { id: 'oz', label: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
  ],
  defaultFrom: 'kg',
  defaultTo: 'lb',
}
