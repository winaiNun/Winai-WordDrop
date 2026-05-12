<template>
  <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
    <button
      class="ctrl-btn"
      :class="isMusicOn ? 'ring-2 ring-purple-400 bg-purple-50' : 'bg-white/85'"
      :title="isMusicOn ? 'ปิดเพลง' : 'เปิดเพลง'"
      @click="toggleMusic"
    >
      <span class="text-xl">{{ isMusicOn ? '🎵' : '🎵' }}</span>
      <span class="text-[10px] font-bold leading-none" :class="isMusicOn ? 'text-purple-600' : 'text-gray-400'">
        {{ isMusicOn ? 'ON' : 'OFF' }}
      </span>
    </button>

    <button
      class="ctrl-btn"
      :class="isSfxOn ? 'ring-2 ring-blue-400 bg-blue-50' : 'bg-white/85'"
      :title="isSfxOn ? 'ปิดเสียง SFX' : 'เปิดเสียง SFX'"
      @click="toggleSfx"
    >
      <span class="text-xl">{{ isSfxOn ? '🔊' : '🔕' }}</span>
      <span class="text-[10px] font-bold leading-none" :class="isSfxOn ? 'text-blue-600' : 'text-gray-400'">
        SFX
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { toggleMusic, toggleSfx, isMusicOn, isSfxOn } from '~/composables/useSound'
</script>

<style scoped>
.ctrl-btn {
  @apply w-12 h-12 rounded-2xl shadow-lg backdrop-blur-sm
         flex flex-col items-center justify-center gap-0.5
         transition-all duration-150 hover:scale-110 active:scale-95;
}
</style>
