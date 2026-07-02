import { modules } from '@/router/modules';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './HomeView.vue';

async function mountWithRouter()
{
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/home', component: { template: '<div />' } },
      ...modules.map((mod) => ({ path: mod.path, component: { template: '<div />' } })),
    ],
  });
  router.push('/home');
  await router.isReady();
  return mount(HomeView, { global: { plugins: [router] } });
}

describe('HomeView', () => {
  it('renders one card per module in the registry', async () => {
    const wrapper = await mountWithRouter();
    const cards = wrapper.findAll('a.panel');
    expect(cards).toHaveLength(modules.length);
  });

  it('links each card to its module path', async () => {
    const wrapper = await mountWithRouter();
    const cards = wrapper.findAll('a.panel');
    const hrefs = cards.map((card) => card.attributes('href'));
    expect(hrefs).toEqual(modules.map((mod) => mod.path));
  });

  it('shows the module label and description on each card', async () => {
    const wrapper = await mountWithRouter();
    const text = wrapper.text();
    for (const mod of modules)
    {
      expect(text).toContain(mod.label);
      expect(text).toContain(mod.description);
    }
  });
});
