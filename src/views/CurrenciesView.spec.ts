import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CurrenciesView from './CurrenciesView.vue'
import { fetchRates, fetchRatesOn, fetchRateHistory } from '@/services/exchangeRates'

vi.mock('@/services/exchangeRates', () => ({
  fetchRates: vi.fn(),
  fetchRatesOn: vi.fn(),
  fetchRateHistory: vi.fn(),
}))

const mockedFetchRates = vi.mocked(fetchRates)
const mockedFetchRatesOn = vi.mocked(fetchRatesOn)
const mockedFetchRateHistory = vi.mocked(fetchRateHistory)

async function mountWithRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/currencies', component: { template: '<div />' } }],
  })
  router.push('/currencies')
  await router.isReady()
  const wrapper = mount(CurrenciesView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('CurrenciesView', () => {
  beforeEach(() => {
    mockedFetchRates.mockReset()
    mockedFetchRatesOn.mockReset()
    mockedFetchRateHistory.mockReset()

    mockedFetchRates.mockImplementation(async (base?: string) => {
      if (!base || base === 'EUR') {
        return { base: 'EUR', date: '2026-07-01', rates: { USD: 1.1, GBP: 0.9 } }
      }
      if (base === 'USD') {
        return { base: 'USD', date: '2026-07-01', rates: { EUR: 0.9091, GBP: 0.818 } }
      }
      throw new Error(`unexpected base "${base}"`)
    })
    mockedFetchRatesOn.mockResolvedValue({
      base: 'EUR',
      date: '2026-06-30',
      rates: { USD: 1.09, GBP: 0.89 },
    })
    mockedFetchRateHistory.mockResolvedValue({
      base: 'EUR',
      start_date: '2026-06-01',
      end_date: '2026-07-01',
      rates: { '2026-07-01': { USD: 1.1, EUR: 0.9091, GBP: 0.9 } },
    })
  })

  it('swaps the base and target currencies and updates the URL query', async () => {
    const { wrapper, router } = await mountWithRouter()

    const fromSelect = wrapper.find<HTMLSelectElement>('[aria-label="Source currency"]')
    const toSelect = wrapper.find<HTMLSelectElement>('[aria-label="Target currency"]')
    expect(fromSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('EUR')
    expect(toSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('USD')
    expect(router.currentRoute.value.query.from).toBeUndefined() // EUR is the default, omitted
    expect(router.currentRoute.value.query.to).toBeUndefined() // USD is the default, omitted

    await wrapper.find('[aria-label="Swap currencies"]').trigger('click')
    await flushPromises()

    expect(fromSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('USD')
    expect(toSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('EUR')
    expect(router.currentRoute.value.query.from).toBe('USD')
    expect(router.currentRoute.value.query.to).toBe('EUR')
    expect(mockedFetchRates).toHaveBeenCalledWith('USD')
  })

  it('shows an up/down delta indicator and the comparison date next to the unit rate', async () => {
    const { wrapper } = await mountWithRouter()

    // Latest USD rate (1.1) is above yesterday's (1.09): an "up" delta of +0.92%.
    expect(wrapper.text()).toContain('+0.92%')
    expect(wrapper.text()).toContain('vs 2026-06-30')
  })

  it('switches to historical rates from a ?date= query param and shows the effective date', async () => {
    const { wrapper, router } = await mountWithRouter()

    await router.push('/currencies?date=2026-06-29')
    await flushPromises()

    const dateInput = wrapper.find<HTMLInputElement>('#conversion-date')
    expect(dateInput.element.value).toBe('2026-06-29')
    // fetchRatesOn is mocked to resolve to 2026-06-30 regardless of the
    // requested date, standing in for Frankfurter resolving a non-trading
    // day back to the closest prior trading day.
    expect(wrapper.text()).toContain('Rates as of 2026-06-30')
  })

  it('returns to latest rates and clears the date query param via the back-to-latest button', async () => {
    const { wrapper, router } = await mountWithRouter()

    await router.push('/currencies?date=2026-06-29')
    await flushPromises()
    expect(wrapper.text()).toContain('Rates as of 2026-06-30')

    const backButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Back to latest')
    expect(backButton).toBeDefined()
    await backButton!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.date).toBeUndefined()
    expect(wrapper.text()).not.toContain('Rates as of')
    expect(wrapper.text()).toContain('ECB reference rate: 2026-07-01')
  })

  it('ignores an out-of-range date query param and keeps showing latest rates', async () => {
    const { wrapper, router } = await mountWithRouter()

    await router.push('/currencies?date=1900-01-01')
    await flushPromises()

    // Falls back silently, same as any other invalid query param: the
    // conversion date stays unset, latest rates keep showing.
    expect(wrapper.text()).not.toContain('Rates as of')
    expect(wrapper.text()).toContain('ECB reference rate: 2026-07-01')
  })
})
