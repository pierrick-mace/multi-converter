import { describe, expect, it } from 'vitest'
import {
  celsiusToFahrenheit,
  celsiusToKelvin,
  fahrenheitToCelsius,
  kelvinToCelsius,
  useTemperatureConverter,
} from './useTemperatureConverter'

describe('temperature conversion formulas', () => {
  it('converts celsius to fahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
    expect(celsiusToFahrenheit(100)).toBe(212)
  })

  it('converts celsius to kelvin', () => {
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15)
  })

  it('converts fahrenheit to celsius', () => {
    expect(fahrenheitToCelsius(32)).toBe(0)
    expect(fahrenheitToCelsius(212)).toBe(100)
  })

  it('converts kelvin to celsius', () => {
    expect(kelvinToCelsius(273.15)).toBeCloseTo(0)
  })
})

describe('useTemperatureConverter', () => {
  it('updates fahrenheit and kelvin from celsius', () => {
    const { celsius, fahrenheit, kelvin, updateFromCelsius } = useTemperatureConverter()
    celsius.value = 25
    updateFromCelsius()
    expect(fahrenheit.value).toBe(77)
    expect(kelvin.value).toBeCloseTo(298.15)
  })

  it('updates celsius and kelvin from fahrenheit', () => {
    const { celsius, fahrenheit, kelvin, updateFromFahrenheit } = useTemperatureConverter()
    fahrenheit.value = 32
    updateFromFahrenheit()
    expect(celsius.value).toBe(0)
    expect(kelvin.value).toBeCloseTo(273.15)
  })

  it('updates celsius and fahrenheit from kelvin', () => {
    const { celsius, fahrenheit, kelvin, updateFromKelvin } = useTemperatureConverter()
    kelvin.value = 373.15
    updateFromKelvin()
    expect(celsius.value).toBeCloseTo(100)
    expect(fahrenheit.value).toBeCloseTo(212)
  })

  it('does nothing when the source value is null', () => {
    const { fahrenheit, updateFromCelsius } = useTemperatureConverter()
    updateFromCelsius()
    expect(fahrenheit.value).toBeNull()
  })
})