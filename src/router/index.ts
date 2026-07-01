import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('@/views/HomeView.vue') },
    {
      path: '/temperature',
      name: 'temperature',
      component: () => import('@/views/TemperatureView.vue'),
    },
    {
      path: '/currencies',
      name: 'currencies',
      component: () => import('@/views/CurrenciesView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
})

export default router
