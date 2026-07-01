import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import NavBar from './NavBar.vue'

async function mountWithRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/home', component: { template: '<div />' } },
      { path: '/temperature', component: { template: '<div />' } },
      { path: '/currencies', component: { template: '<div />' } },
    ],
  })
  router.push('/home')
  await router.isReady()
  return mount(NavBar, { global: { plugins: [router] } })
}

describe('NavBar', () => {
  it('renders a link for every route', async () => {
    const wrapper = await mountWithRouter()
    const links = wrapper.findAll('a')
    expect(links.map((link) => link.text())).toEqual(['Home', 'Temperature', 'Currencies'])
  })

  it('marks the active route link', async () => {
    const wrapper = await mountWithRouter()
    const activeLink = wrapper.find('a[aria-current="page"]')
    expect(activeLink.text()).toBe('Home')
  })
})
