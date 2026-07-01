<script setup lang="ts">
const links = [
  { to: '/home', label: 'Home' },
  { to: '/temperature', label: 'Temperature' },
  { to: '/currencies', label: 'Currencies' },
]
</script>

<template>
  <nav class="glass">
    <ul class="flex flex-wrap items-center justify-center gap-6 px-6 py-4">
      <li v-for="link in links" :key="link.to">
        <RouterLink
          :to="link.to"
          class="text-white/80 transition-colors hover:text-white"
          active-class="font-semibold text-white underline underline-offset-4"
        >
          {{ link.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
