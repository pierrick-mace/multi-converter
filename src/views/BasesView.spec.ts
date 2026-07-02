import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BasesView from './BasesView.vue';

describe('BasesView', () => {
  it('renders a field for each base', () => {
    const wrapper = mount(BasesView);
    const labels = wrapper.findAll('.label-mono').map((label) => label.text());
    expect(labels).toContain('Number bases');
    expect(wrapper.find('#binary').exists()).toBe(true);
    expect(wrapper.find('#octal').exists()).toBe(true);
    expect(wrapper.find('#decimal').exists()).toBe(true);
    expect(wrapper.find('#hex').exists()).toBe(true);
  });

  it('syncs all fields when a value is entered in one of them', async () => {
    const wrapper = mount(BasesView);
    const decimalInput = wrapper.find<HTMLInputElement>('#decimal');
    await decimalInput.setValue('255');
    await decimalInput.trigger('input');

    expect(wrapper.find<HTMLInputElement>('#binary').element.value).toBe('11111111');
    expect(wrapper.find<HTMLInputElement>('#octal').element.value).toBe('377');
    expect(wrapper.find<HTMLInputElement>('#hex').element.value).toBe('FF');
  });

  it('shows an error message wired via aria-describedby on the invalid field', async () => {
    const wrapper = mount(BasesView);
    const binaryInput = wrapper.find<HTMLInputElement>('#binary');
    await binaryInput.setValue('102');
    await binaryInput.trigger('input');

    expect(binaryInput.attributes('aria-invalid')).toBe('true');
    expect(binaryInput.attributes('aria-describedby')).toBe('base-error');

    const errorMessage = wrapper.find('#base-error');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text().length).toBeGreaterThan(0);

    const octalInput = wrapper.find<HTMLInputElement>('#octal');
    expect(octalInput.attributes('aria-invalid')).toBe('false');
    expect(octalInput.attributes('aria-describedby')).toBeUndefined();
  });
});
