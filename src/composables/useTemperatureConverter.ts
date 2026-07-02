import { ref } from 'vue'

export function celsiusToFahrenheit(celsius: number) {
  return (celsius * 9) / 5 + 32
}

export function celsiusToKelvin(celsius: number) {
  return celsius + 273.15
}

export function fahrenheitToCelsius(fahrenheit: number) {
  return ((fahrenheit - 32) * 5) / 9
}

export function kelvinToCelsius(kelvin: number) {
  return kelvin - 273.15
}

export function useTemperatureConverter() {
  const celsius = ref<number | null>(null)
  const fahrenheit = ref<number | null>(null)
  const kelvin = ref<number | null>(null)

  function updateFromCelsius() {
    if (celsius.value === null) return
    fahrenheit.value = celsiusToFahrenheit(celsius.value)
    kelvin.value = celsiusToKelvin(celsius.value)
  }

  function updateFromFahrenheit() {
    if (fahrenheit.value === null) return
    celsius.value = fahrenheitToCelsius(fahrenheit.value)
    kelvin.value = celsiusToKelvin(celsius.value)
  }

  function updateFromKelvin() {
    if (kelvin.value === null) return
    celsius.value = kelvinToCelsius(kelvin.value)
    fahrenheit.value = celsiusToFahrenheit(celsius.value)
  }

  return { celsius, fahrenheit, kelvin, updateFromCelsius, updateFromFahrenheit, updateFromKelvin }
}