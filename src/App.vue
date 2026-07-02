<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
</script>

<template>
  <div class="grain" aria-hidden="true"></div>
  <div class="crosshair top-4 left-4" aria-hidden="true"></div>
  <div class="crosshair top-4 right-4" aria-hidden="true"></div>
  <div class="crosshair bottom-4 left-4" aria-hidden="true"></div>
  <div class="crosshair right-4 bottom-4" aria-hidden="true"></div>

  <div class="relative z-10 flex min-h-screen flex-col">
    <NavBar />
    <main class="flex-1">
      <RouterView />
    </main>
    <footer class="px-4 py-6 text-center font-mono text-[11px] tracking-[0.3em] text-ink-dim/60 uppercase">
      Converter // instrument build 2026
    </footer>
  </div>
</template>
