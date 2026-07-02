import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UnitsView from './UnitsView.vue'

describe('UnitsView', () => {
  it('renders a panel for length and a panel for mass', () => {
    const wrapper = mount(UnitsView)
    const labels = wrapper.findAll('.label-mono').map((label) => label.text())
    expect(labels).toContain('Length')
    expect(labels).toContain('Mass')
  })

  it('converts an entered length amount using the default units (km to mi)', async () => {
    const wrapper = mount(UnitsView)
    const amountInput = wrapper.find('#length-value')
    await amountInput.setValue('10')

    const resultInput = wrapper.find<HTMLInputElement>('#length-result')
    expect(resultInput.element.value).toBe('6.213712')
  })

  it('swaps from and to units when the swap button is clicked', async () => {
    const wrapper = mount(UnitsView)
    const fromSelect = wrapper.find<HTMLSelectElement>('select[aria-label="Length source unit"]')
    const toSelect = wrapper.find<HTMLSelectElement>('select[aria-label="Length target unit"]')
    expect(fromSelect.element.value).toBe('km')
    expect(toSelect.element.value).toBe('mi')

    const swapButton = wrapper.find('button[aria-label="Swap Length units"]')
    await swapButton.trigger('click')

    expect(fromSelect.element.value).toBe('mi')
    expect(toSelect.element.value).toBe('km')
  })

  it('shows an empty result when no amount has been entered', () => {
    const wrapper = mount(UnitsView)
    const resultInput = wrapper.find<HTMLInputElement>('#mass-result')
    expect(resultInput.element.value).toBe('')
  })
})
