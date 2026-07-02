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

async function mountWithRouter(path = '/currencies') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/currencies', component: { template: '<div />' } }],
  })
  router.push(path)
  await router.isReady()
  const wrapper = mount(CurrenciesView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('CurrenciesView', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('converges on the deep-linked target currency when mounting directly at a ?to= URL', async () => {
    const { wrapper } = await mountWithRouter('/currencies?to=GBP')

    const toSelect = wrapper.find<HTMLSelectElement>('[aria-label="Target currency"]')
    expect(toSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('GBP')
    // The currency-list load (which resolves after the component mounts)
    // must not clobber the query-provided selection once applied.
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('converges on the deep-linked base currency and historical date when mounting directly at a ?from=&date= URL', async () => {
    // Base currencies other than the default EUR/USD need their own branch:
    // the `from` query binding resolves (and fetches for) GBP before the
    // `date` binding is applied in the same readFromRoute() pass.
    mockedFetchRates.mockImplementation(async (base?: string) => {
      if (!base || base === 'EUR')
        return { base: 'EUR', date: '2026-07-01', rates: { USD: 1.1, GBP: 0.9 } }
      if (base === 'USD')
        return { base: 'USD', date: '2026-07-01', rates: { EUR: 0.9091, GBP: 0.818 } }
      if (base === 'GBP')
        return { base: 'GBP', date: '2026-07-01', rates: { EUR: 1.11, USD: 1.22 } }
      throw new Error(`unexpected base "${base}"`)
    })

    const { wrapper } = await mountWithRouter('/currencies?from=GBP&date=2026-06-15')

    const fromSelect = wrapper.find<HTMLSelectElement>('[aria-label="Source currency"]')
    expect(fromSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('GBP')
    const dateInput = wrapper.find<HTMLInputElement>('#conversion-date')
    expect(dateInput.element.value).toBe('2026-06-15')
    // fetchRatesOn is mocked to resolve to 2026-06-30 regardless of args, so
    // this holds whichever of the two in-flight requests (the base change's,
    // the date's) lands last.
    expect(wrapper.text()).toContain('Rates as of 2026-06-30')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
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

  it('renders the default rate board and removes a target via its row control', async () => {
    const { wrapper } = await mountWithRouter()

    // Currency list here only has EUR/GBP/USD, so the CHF/JPY portion of the
    // default basket is silently dropped: nothing to validate them against.
    expect(wrapper.find('[aria-label="Remove USD from rate board"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Remove GBP from rate board"]').exists()).toBe(true)

    await wrapper.find('[aria-label="Remove USD from rate board"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[aria-label="Remove USD from rate board"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Remove GBP from rate board"]').exists()).toBe(true)
  })

  it('adds a target from the board select, skipping the current base and existing targets', async () => {
    const { wrapper } = await mountWithRouter()

    const addSelect = wrapper.find<HTMLSelectElement>('[aria-label="Add currency to rate board"]')
    const optionValues = addSelect.findAll('option').map((option) => option.element.value)
    // EUR is the base, USD/GBP are already in the default board: none of
    // them should be offered again.
    expect(optionValues).not.toContain('EUR')
    expect(optionValues).not.toContain('USD')
    expect(optionValues).not.toContain('GBP')
  })

  it('round-trips a ?board= query param through the rate board', async () => {
    const { wrapper, router } = await mountWithRouter()

    await router.push('/currencies?board=GBP')
    await flushPromises()

    expect(wrapper.find('[aria-label="Remove GBP from rate board"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Remove USD from rate board"]').exists()).toBe(false)
    // Not the default basket (USD, GBP), so the param stays in the URL.
    expect(router.currentRoute.value.query.board).toBe('GBP')

    await wrapper.find('[aria-label="Remove GBP from rate board"]').trigger('click')
    await flushPromises()

    // An empty basket is still not the default, so it stays explicit.
    expect(router.currentRoute.value.query.board).toBe('')
  })

  it('drops an unknown code from a ?board= query param, showing only the valid ones', async () => {
    const { wrapper, router } = await mountWithRouter()

    await router.push('/currencies?board=USD,GBP,NOT-A-CODE')
    await flushPromises()

    // NOT-A-CODE never resolves to a valid currency, so no remove control is
    // ever rendered for it; USD/GBP still show as they're both valid.
    expect(wrapper.find('[aria-label="Remove USD from rate board"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Remove GBP from rate board"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('NOT-A-CODE')
  })

  it('renders a copy button for the converted amount and a share-link button', async () => {
    const { wrapper } = await mountWithRouter()

    expect(wrapper.find('[aria-label="Copy converted amount"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Copy share link"]').exists()).toBe(true)
  })

  it('omits the ?board= param once a customized basket is set back to the default', async () => {
    const { wrapper, router } = await mountWithRouter()

    await router.push('/currencies?board=GBP')
    await flushPromises()
    expect(router.currentRoute.value.query.board).toBe('GBP')

    // Re-add USD: USD,GBP is now the (currency-list-narrowed) default
    // basket again, so the param is omitted from the URL.
    const addSelect = wrapper.find<HTMLSelectElement>('[aria-label="Add currency to rate board"]')
    await addSelect.setValue('USD')
    await flushPromises()

    expect(wrapper.find('[aria-label="Remove USD from rate board"]').exists()).toBe(true)
    expect(router.currentRoute.value.query.board).toBeUndefined()
  })

  it('applies a stored pair from localStorage when no ?from/?to query params are present', async () => {
    localStorage.setItem('converter:currencies:pair', JSON.stringify({ from: 'USD', to: 'GBP' }))

    const { wrapper } = await mountWithRouter()

    const fromSelect = wrapper.find<HTMLSelectElement>('[aria-label="Source currency"]')
    const toSelect = wrapper.find<HTMLSelectElement>('[aria-label="Target currency"]')
    expect(fromSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('USD')
    expect(toSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('GBP')
    expect(mockedFetchRates).toHaveBeenCalledWith('USD')
  })

  it('lets a ?from= query param win over a stored pair, while storage still fills in the missing ?to=', async () => {
    localStorage.setItem('converter:currencies:pair', JSON.stringify({ from: 'USD', to: 'EUR' }))
    mockedFetchRates.mockImplementation(async (base?: string) => {
      if (!base || base === 'EUR')
        return { base: 'EUR', date: '2026-07-01', rates: { USD: 1.1, GBP: 0.9 } }
      if (base === 'USD')
        return { base: 'USD', date: '2026-07-01', rates: { EUR: 0.9091, GBP: 0.818 } }
      if (base === 'GBP')
        return { base: 'GBP', date: '2026-07-01', rates: { EUR: 1.11, USD: 1.22 } }
      throw new Error(`unexpected base "${base}"`)
    })

    const { wrapper } = await mountWithRouter('/currencies?from=GBP')

    const fromSelect = wrapper.find<HTMLSelectElement>('[aria-label="Source currency"]')
    const toSelect = wrapper.find<HTMLSelectElement>('[aria-label="Target currency"]')
    // ?from=GBP overrides the stored "USD", but the stored "EUR" still fills
    // in `to` since the URL never mentions it.
    expect(fromSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('GBP')
    expect(toSelect.element.selectedOptions[0]?.textContent?.trim()).toBe('EUR')
  })

  describe('offline notice', () => {
    it('is hidden when rates load live', async () => {
      const { wrapper } = await mountWithRouter()

      expect(wrapper.text()).not.toContain('offline')
    })

    it('shows "rates as of {date}, offline" when the service falls back to a cached response', async () => {
      mockedFetchRates.mockReset()
      mockedFetchRates.mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-06-30',
        rates: { USD: 1.09, GBP: 0.89 },
        stale: true,
        cachedAt: '2026-07-01T00:00:00.000Z',
      })

      const { wrapper } = await mountWithRouter()

      const notice = wrapper.find('[role="status"]')
      expect(notice.exists()).toBe(true)
      expect(notice.text()).toBe('Rates as of 2026-06-30, offline')
    })
  })
})
