import type { UnitModule } from '@/types/units';

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
};

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
};

// Base unit: byte. Decimal and binary prefixes share one factor table:
// decimal steps by 1000 (kB, MB, GB, TB), binary steps by 1024 (KiB, MiB, GiB, TiB).
export const dataSizeModule: UnitModule = {
  units: [
    { id: 'bit', label: 'Bit', symbol: 'bit', factor: 0.125 },
    { id: 'B', label: 'Byte', symbol: 'B', factor: 1 },
    { id: 'kB', label: 'Kilobyte', symbol: 'kB', factor: 1e3 },
    { id: 'MB', label: 'Megabyte', symbol: 'MB', factor: 1e6 },
    { id: 'GB', label: 'Gigabyte', symbol: 'GB', factor: 1e9 },
    { id: 'TB', label: 'Terabyte', symbol: 'TB', factor: 1e12 },
    { id: 'KiB', label: 'Kibibyte', symbol: 'KiB', factor: 1024 },
    { id: 'MiB', label: 'Mebibyte', symbol: 'MiB', factor: 1024 ** 2 },
    { id: 'GiB', label: 'Gibibyte', symbol: 'GiB', factor: 1024 ** 3 },
    { id: 'TiB', label: 'Tebibyte', symbol: 'TiB', factor: 1024 ** 4 },
  ],
  defaultFrom: 'GB',
  defaultTo: 'GiB',
};
