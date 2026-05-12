<template>
  <div class="fixed inset-0 pointer-events-none overflow-hidden" style="z-index:0">

    <!-- ── Animated gradient base ── -->
    <div
      class="absolute inset-0"
      style="background: linear-gradient(135deg,#ede9fe 0%,#fce7f3 45%,#dbeafe 100%)"
    />
    <!-- Soft radial overlay that breathes -->
    <div
      class="absolute inset-0 animate-bgShift"
      style="background: radial-gradient(ellipse 90% 70% at 50% 40%,rgba(167,139,250,.18) 0%,transparent 70%)"
    />

    <!-- ── Floating color bubbles ── -->
    <div
      v-for="b in bubbles"
      :key="`b${b.id}`"
      class="absolute rounded-full"
      :style="{
        left: `${b.x}%`,
        bottom: '-60px',
        width:  `${b.size}px`,
        height: `${b.size}px`,
        background: b.color,
        opacity: b.op,
        animationName: 'particleRise',
        animationDuration: `${b.dur}s`,
        animationDelay: `${b.delay}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      }"
    />

    <!-- ── Twinkle stars (CSS only) ── -->
    <div
      v-for="s in stars"
      :key="`s${s.id}`"
      class="absolute text-yellow-300 select-none"
      :style="{
        left: `${s.x}%`,
        top:  `${s.y}%`,
        fontSize: `${s.size}rem`,
        animationName: 'twinkle',
        animationDuration: `${s.dur}s`,
        animationDelay: `${s.delay}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }"
    >✦</div>

    <!-- ── Emoji particles rising from bottom ── -->
    <div
      v-for="p in particles"
      :key="`p${p.id}`"
      class="absolute select-none"
      :style="{
        left: `${p.x}%`,
        bottom: '-60px',
        fontSize: `${p.size}rem`,
        opacity: p.op,
        animationName: 'particleRise',
        animationDuration: `${p.dur}s`,
        animationDelay: `${p.delay}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }"
    >{{ p.char }}</div>

  </div>
</template>

<script setup lang="ts">
const EMOJIS  = ['✨','⭐','🌟','💫','🎈','🌸','🦋','🎊','📚','✏️','🎯','🌈','🍀','🎆','🎇','🌙','☁️','🎵']
const COLORS  = ['#c084fc','#a78bfa','#60a5fa','#34d399','#fbbf24','#f472b6','#fb923c','#e879f9']

function r(min: number, max: number) { return Math.random() * (max - min) + min }

const bubbles = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: r(1, 99), size: r(8, 38), dur: r(12, 28),
  delay: r(0, 24), color: COLORS[i % COLORS.length], op: r(0.10, 0.22),
}))

const stars = Array.from({ length: 18 }, (_, i) => ({
  id: i, x: r(2, 98), y: r(2, 85), size: r(0.5, 1.1),
  dur: r(1.8, 4.5), delay: r(0, 4),
}))

const particles = Array.from({ length: 30 }, (_, i) => ({
  id: i, char: EMOJIS[i % EMOJIS.length],
  x: r(1, 99), size: r(0.85, 1.9), dur: r(10, 26),
  delay: r(0, 22), op: r(0.35, 0.72),
}))
</script>
