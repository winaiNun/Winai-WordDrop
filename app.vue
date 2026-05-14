<template>
  <div class="relative min-h-screen font-mali flex flex-col">
    <ParticleBackground />
    <div class="relative flex-1" style="z-index:1">
      <NuxtPage />
    </div>
    <MusicControl />
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box }
body { margin: 0; font-family: 'Mali', cursive }

.btn-game {
  @apply px-5 py-2.5 rounded-xl font-bold text-white shadow-md
         transition-all duration-150 active:scale-95
         disabled:opacity-40 disabled:cursor-not-allowed;
}
</style>
