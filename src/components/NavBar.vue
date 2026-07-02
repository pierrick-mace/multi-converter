<script setup lang="ts">
const links = [
  { to: '/home', label: 'Home' },
  { to: '/temperature', label: 'Temperature' },
  { to: '/currencies', label: 'Currencies' },
  { to: '/bases', label: 'Bases' },
  { to: '/units', label: 'Units' },
  { to: '/data', label: 'Data' },
]
</script>

<template>
  <header class="relative border-b border-rule bg-panel/60">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 md:px-8">
      <span class="font-display text-2xl tracking-wide text-ink">
        Converter<span class="text-accent">.</span>
      </span>

      <ul class="nav-list flex items-center gap-1 md:gap-2">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="nav-link relative inline-block px-3 py-2 font-mono text-xs tracking-[0.2em] text-ink-dim uppercase transition-colors"
            active-class="nav-link-active"
            exact-active-class="nav-link-active"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped>
.nav-list {
  counter-reset: nav;
}

.nav-link {
  counter-increment: nav;
}

.nav-link::before {
  content: '0' counter(nav) ' / ';
  color: var(--color-accent);
  opacity: 0.7;
}

.nav-link::after {
  content: '';
  position: absolute;
  right: 0.75rem;
  bottom: 0;
  left: 0.75rem;
  height: 2px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.nav-link:hover {
  color: var(--color-ink);
}

.nav-link-active {
  color: var(--color-ink);
}

.nav-link-active::after {
  transform: scaleX(1);
}
</style>
