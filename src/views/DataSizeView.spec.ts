import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DataSizeView from './DataSizeView.vue';

describe('DataSizeView', () => {
  it('renders a panel for data size', () => {
    const wrapper = mount(DataSizeView);
    const labels = wrapper.findAll('.label-mono').map((label) => label.text());
    expect(labels).toContain('Data size');
  });

  it('converts an entered amount using the default units (GB to GiB)', async () => {
    const wrapper = mount(DataSizeView);
    const amountInput = wrapper.find('#data-value');
    await amountInput.setValue('10');

    const resultInput = wrapper.find<HTMLInputElement>('#data-result');
    expect(resultInput.element.value).toBe('9.313226');
  });

  it('swaps from and to units when the swap button is clicked', async () => {
    const wrapper = mount(DataSizeView);
    const fromSelect = wrapper.find<HTMLSelectElement>('select[aria-label="Data size source unit"]');
    const toSelect = wrapper.find<HTMLSelectElement>('select[aria-label="Data size target unit"]');
    expect(fromSelect.element.value).toBe('GB');
    expect(toSelect.element.value).toBe('GiB');

    const swapButton = wrapper.find('button[aria-label="Swap Data size units"]');
    await swapButton.trigger('click');

    expect(fromSelect.element.value).toBe('GiB');
    expect(toSelect.element.value).toBe('GB');
  });

  it('shows an empty result when no amount has been entered', () => {
    const wrapper = mount(DataSizeView);
    const resultInput = wrapper.find<HTMLInputElement>('#data-result');
    expect(resultInput.element.value).toBe('');
  });
});
