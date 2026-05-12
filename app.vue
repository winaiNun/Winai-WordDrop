<template>
  <div class="relative min-h-screen font-mali flex flex-col">
    <!-- Animated particle background — persists across all pages -->
    <ParticleBackground />

    <!-- Page content -->
    <div class="relative flex-1" style="z-index:1">
      <NuxtPage />
    </div>

    <!-- ===== FOOTER ===== -->
    <footer class="relative z-10 py-5 px-4 flex justify-center">
      <div class="footer-pill">
        <!-- Left star accent -->
        <span class="text-purple-300 text-base leading-none">✦</span>

        <!-- Copyright text -->
        <span class="text-white/50">©</span>
        <span class="font-bold text-purple-200">2026</span>

        <span class="footer-sep" />

        <span class="font-bold text-white tracking-wide">Winai Nunkratok</span>

        <span class="footer-sep" />

        <span class="text-pink-200 font-semibold">Educational Supervisor</span>

        <span class="footer-sep" />

        <span class="text-white/40 text-[10px]">All rights reserved.</span>

        <!-- Right star accent -->
        <span class="text-pink-300 text-base leading-none">✦</span>
      </div>
    </footer>

    <!-- Floating music / SFX controls -->
    <MusicControl />
  </div>
</template>

<style>
/* ── Global base ── */
*, *::before, *::after { box-sizing: border-box }
body { margin: 0; font-family: 'Mali', cursive }

/* ── Footer pill ── */
.footer-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(88,28,135,.82) 0%, rgba(157,23,77,.75) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 4px 24px rgba(88,28,135,.35), 0 1px 0 rgba(255,255,255,.08) inset;
  color: rgba(255,255,255,.85);
  letter-spacing: 0.01em;
}
.footer-sep {
  width: 1px;
  height: 0.9rem;
  background: rgba(255,255,255,.18);
  border-radius: 1px;
  flex-shrink: 0;
}

/* ── Utility used by both pages ── */
.btn-game {
  @apply px-5 py-2.5 rounded-xl font-bold text-white shadow-md
         transition-all duration-150 active:scale-95
         disabled:opacity-40 disabled:cursor-not-allowed;
}
</style>
