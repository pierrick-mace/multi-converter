import { describe, expect, it } from 'vitest'
import { convertUnit } from './useUnitConverter'
import { dataSizeModule, lengthModule, massModule } from './unitModules'

function factorsOf(module: typeof lengthModule) {
  return Object.fromEntries(module.units.map((unit) => [unit.id, unit.factor]))
}

describe('lengthModule', () => {
  const factors = factorsOf(lengthModule)

  it('converts miles to meters', () => {
    expect(convertUnit(1, 'mi', 'm', factors)).toBeCloseTo(1609.344)
  })

  it('round-trips km to cm and back', () => {
    const original = 3.5
    const toCm = convertUnit(original, 'km', 'cm', factors)
    const backToKm = convertUnit(toCm, 'cm', 'km', factors)
    expect(backToKm).toBeCloseTo(original)
  })

  it('has sensible defaults present in the unit list', () => {
    const ids = lengthModule.units.map((unit) => unit.id)
    expect(ids).toContain(lengthModule.defaultFrom)
    expect(ids).toContain(lengthModule.defaultTo)
  })

  it('every unit id is unique', () => {
    const ids = lengthModule.units.map((unit) => unit.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('massModule', () => {
  const factors = factorsOf(massModule)

  it('converts pounds to grams', () => {
    expect(convertUnit(1, 'lb', 'g', factors)).toBeCloseTo(453.59237)
  })

  it('converts tonnes to kilograms', () => {
    expect(convertUnit(1, 't', 'kg', factors)).toBe(1000)
  })

  it('round-trips ounces to kilograms and back', () => {
    const original = 16
    const toKg = convertUnit(original, 'oz', 'kg', factors)
    const backToOz = convertUnit(toKg, 'kg', 'oz', factors)
    expect(backToOz).toBeCloseTo(original)
  })

  it('has sensible defaults present in the unit list', () => {
    const ids = massModule.units.map((unit) => unit.id)
    expect(ids).toContain(massModule.defaultFrom)
    expect(ids).toContain(massModule.defaultTo)
  })

  it('every unit id is unique', () => {
    const ids = massModule.units.map((unit) => unit.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('dataSizeModule', () => {
  const factors = factorsOf(dataSizeModule)

  it('converts 1 GiB to bytes using the binary prefix', () => {
    expect(convertUnit(1, 'GiB', 'B', factors)).toBe(1073741824)
  })

  it('converts 1 GB to bytes using the decimal prefix', () => {
    expect(convertUnit(1, 'GB', 'B', factors)).toBe(1000000000)
  })

  it('converts 8 bits to 1 byte', () => {
    expect(convertUnit(8, 'bit', 'B', factors)).toBe(1)
  })

  it('converts 1 byte to 8 bits', () => {
    expect(convertUnit(1, 'B', 'bit', factors)).toBe(8)
  })

  it('cross-checks that 1 KiB is larger than 1 kB', () => {
    const kib = convertUnit(1, 'KiB', 'B', factors)
    const kb = convertUnit(1, 'kB', 'B', factors)
    expect(kib).toBeGreaterThan(kb)
    expect(kib).toBe(1024)
    expect(kb).toBe(1000)
  })

  it('has sensible defaults present in the unit list', () => {
    const ids = dataSizeModule.units.map((unit) => unit.id)
    expect(ids).toContain(dataSizeModule.defaultFrom)
    expect(ids).toContain(dataSizeModule.defaultTo)
  })

  it('every unit id is unique', () => {
    const ids = dataSizeModule.units.map((unit) => unit.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})