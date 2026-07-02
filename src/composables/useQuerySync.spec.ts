import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { Router } from 'vue-router';
import { useQuerySync } from './useQuerySync';
import type { QueryBinding } from './useQuerySync';

function createTestRouter(initialPath = '/currencies')
{
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/currencies', component: { template: '<div />' } }],
  });
  router.push(initialPath);
  return router;
}

function mountTestComponent(router: Router)
{
  const code = ref('foo');
  const amount = ref<number | null>(null);

  const TestComponent = defineComponent({
    setup()
    {
      useQuerySync({
        code: {
          ref: code,
          fromQuery: (raw) => (['foo', 'bar', 'baz'].includes(raw) ? raw : undefined),
          toQuery: (value) => (value === 'foo' ? undefined : value),
        } satisfies QueryBinding<string>,
        amount: {
          ref: amount,
          fromQuery: (raw) => {
            const value = Number(raw);
            return Number.isFinite(value) && value > 0 ? value : undefined;
          },
          toQuery: (value) => (value === null ? undefined : String(value)),
        } satisfies QueryBinding<number | null>,
      });
      return {};
    },
    template: '<div />',
  });

  const wrapper = mount(TestComponent, { global: { plugins: [router] } });
  return { wrapper, code, amount };
}

describe('useQuerySync', () => {
  it('reads valid query params into refs on setup', async () => {
    const router = createTestRouter('/currencies?code=bar&amount=42');
    await router.isReady();

    const { code, amount } = mountTestComponent(router);

    expect(code.value).toBe('bar');
    expect(amount.value).toBe(42);
  });

  it('falls back to the ref default silently on invalid or garbage params', async () => {
    const router = createTestRouter('/currencies?code=nope&amount=-5');
    await router.isReady();

    const { code, amount } = mountTestComponent(router);

    expect(code.value).toBe('foo');
    expect(amount.value).toBeNull();
  });

  it('writes ref changes to the query via router.replace, omitting default values', async () => {
    const router = createTestRouter('/currencies');
    await router.isReady();
    const replaceSpy = vi.spyOn(router, 'replace');
    const pushSpy = vi.spyOn(router, 'push');

    const { code, amount } = mountTestComponent(router);

    code.value = 'bar';
    await nextTick();
    await flushPromises();
    expect(router.currentRoute.value.query.code).toBe('bar');

    amount.value = 10;
    await nextTick();
    await flushPromises();
    expect(router.currentRoute.value.query.amount).toBe('10');

    // Setting a ref back to its default omits the param again.
    code.value = 'foo';
    await nextTick();
    await flushPromises();
    expect(router.currentRoute.value.query.code).toBeUndefined();

    expect(replaceSpy).toHaveBeenCalled();
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('does not feed back into another route write when the route changes externally', async () => {
    const router = createTestRouter('/currencies');
    await router.isReady();

    const { code } = mountTestComponent(router);
    const replaceSpy = vi.spyOn(router, 'replace');

    await router.replace({ query: { code: 'baz' } });
    await nextTick();
    await flushPromises();

    expect(code.value).toBe('baz');
    // Only the explicit external replace above should have happened: the
    // ref, once synced from that query, re-serializes to the same value
    // it came from, so the sync logic itself must not issue another one.
    expect(replaceSpy).toHaveBeenCalledTimes(1);
  });

  it('exposes readFromRoute so a caller can re-apply the query once async validation data is ready', async () => {
    const router = createTestRouter('/currencies?code=bar');
    await router.isReady();

    const validCodes = ref<string[]>([]); // starts empty, like an unloaded currency list
    const code = ref('foo');
    let readFromRoute: () => void = () => {};

    const TestComponent = defineComponent({
      setup()
      {
        ({ readFromRoute } = useQuerySync({
          code: {
            ref: code,
            fromQuery: (raw) => (validCodes.value.includes(raw) ? raw : undefined),
            toQuery: (value) => (value === 'foo' ? undefined : value),
          } satisfies QueryBinding<string>,
        }));
        return {};
      },
      template: '<div />',
    });

    mount(TestComponent, { global: { plugins: [router] } });

    // Not loaded yet: the query param cannot be validated, ref keeps its default.
    expect(code.value).toBe('foo');

    validCodes.value = ['foo', 'bar', 'baz'];
    readFromRoute();

    expect(code.value).toBe('bar');
  });
});
