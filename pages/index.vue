<template>
  <div class="min-h-screen font-mali select-none">

    <!-- ===== HEADER ===== -->
    <header class="sticky top-0 z-20 bg-white/75 backdrop-blur-sm border-b border-purple-100 shadow-sm">
      <div class="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <img src="/icons/icon-192x192.png" alt="Winai WordDrop"
            class="w-10 h-10 rounded-xl object-cover shadow-sm" />
          <h1 class="text-xl font-bold text-purple-700 leading-tight">Winai WordDrop</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
            {{ currentItem?.category }}
          </span>
          <span class="text-gray-400 text-sm font-semibold tabular-nums">
            {{ currentIndex + 1 }}/{{ filteredVocabList.length }}
          </span>
          <NuxtLink
            to="/settings"
            class="w-9 h-9 rounded-xl bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95"
            title="ตั้งค่าคำศัพท์"
            @click="sfxClick"
          >⚙️</NuxtLink>
        </div>
      </div>
    </header>

    <!-- ===== EMPTY STATE (no category selected) ===== -->
    <div v-if="filteredVocabList.length === 0"
      class="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-5 text-center">
      <div class="text-7xl animate-bounce">🗂️</div>
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-md border-2 border-amber-200">
        <p class="text-xl font-bold text-amber-600 mb-2">ยังไม่ได้เลือกหมวดหมู่!</p>
        <p class="text-gray-500 text-sm mb-5">กรุณาเลือกอย่างน้อย 1 หมวดหมู่<br>ก่อนเริ่มเล่นเกม</p>
        <NuxtLink to="/settings"
          class="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95">
          ⚙️ ไปเลือกหมวดหมู่
        </NuxtLink>
      </div>
    </div>

    <main v-else class="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">

      <!-- ===== TOPIC BANNER ===== -->
      <Transition name="slide">
        <div v-if="displayTopic" class="flex items-center justify-between gap-3">
          <!-- Title pill -->
          <div class="flex-1 flex items-center gap-2 bg-white/75 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-sm border border-purple-100 min-w-0">
            <span class="text-lg shrink-0">📖</span>
            <h2 class="text-base font-bold text-purple-700 leading-snug break-words">{{ displayTopic }}</h2>
          </div>
          <!-- Play mode badge -->
          <div
            class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-sm shadow-sm border transition-all cursor-pointer select-none"
            :class="playMode === 'sequence'
              ? 'bg-purple-100 border-purple-200 text-purple-700'
              : 'bg-amber-100 border-amber-200 text-amber-700'"
            title="เปลี่ยนโหมดที่หน้าตั้งค่า"
          >
            <span>{{ playMode === 'sequence' ? '📋' : '🎲' }}</span>
            <span>{{ playMode === 'sequence' ? 'เรียงลำดับ' : 'สุ่ม' }}</span>
          </div>
        </div>
      </Transition>

      <!-- ===== IMAGE / EMOJI CARD ===== -->
      <div
        class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border-2 transition-all duration-300"
        :class="gameState === 'correct' ? 'border-green-300 shadow-green-100' : 'border-purple-100'"
      >
        <div class="relative flex items-center justify-center p-5" style="min-height:200px;max-height:240px">

          <!-- 🔊 Speak button — top-right of card -->
          <button
            v-if="ttsSupported && currentItem"
            type="button"
            class="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-150 active:scale-90 focus:outline-none"
            :class="isSpeaking
              ? 'bg-purple-500 text-white scale-110 ring-4 ring-purple-300 ring-opacity-60'
              : 'bg-white/90 text-purple-500 hover:bg-purple-50 hover:scale-110 border border-purple-200'"
            :title="isSpeaking ? 'กำลังพูด...' : 'ฟังเสียงคำศัพท์'"
            @click.stop="isSpeaking ? stop() : speak(currentItem.word)"
          >
            <!-- Pulse ring while speaking -->
            <span v-if="isSpeaking"
              class="absolute inset-0 rounded-full bg-purple-400 opacity-40 animate-ping"
              style="animation-duration:1s"
            />
            <span class="relative text-lg leading-none">{{ isSpeaking ? '⏹' : '🔊' }}</span>
          </button>

          <Transition name="img-swap" mode="out-in">
            <!-- IndexedDB image (local folder) or public/images/ fallback -->
            <img
              v-if="currentImgSrc && !imgError"
              :key="`img-${currentItem?.id}`"
              :src="currentImgSrc"
              :alt="currentItem?.word"
              class="max-h-44 max-w-full object-contain drop-shadow-sm"
              @error="imgError = true"
            />
            <!-- Emoji fallback -->
            <div
              v-else
              :key="`em-${currentItem?.id}`"
              class="flex items-center justify-center animate-float"
              style="font-size:5.5rem;line-height:1"
            >{{ currentItem?.emoji || '🖼️' }}</div>
          </Transition>
        </div>
      </div>

      <!-- ===== FEEDBACK BANNER ===== -->
      <div class="h-10 flex items-center justify-center">
        <Transition name="slide">
          <p v-if="gameState === 'correct'" key="ok"
            class="text-2xl font-bold text-green-500 animate-wiggle drop-shadow-sm tracking-wide">
            🎉 {{ feedbackText }} 🌟
          </p>
          <p v-else-if="gameState === 'incorrect'" key="err"
            class="text-lg font-bold text-red-400 drop-shadow-sm tracking-wide">
            {{ feedbackText }}
          </p>
        </Transition>
      </div>

      <!-- ===== SLOTS (DROP ZONE) ===== -->
      <div
        class="flex flex-wrap justify-center gap-2 px-4 py-4 bg-white/60 backdrop-blur-sm rounded-2xl border-2 transition-all duration-200"
        :class="[
          isShaking ? 'border-red-400 animate-shake' : 'border-purple-200',
          gameState === 'correct' ? 'bg-green-50/70 border-green-300' : '',
        ]"
        @dragover.prevent
        @drop.prevent="dropOnPool"
      >
        <div
          v-for="(slot, i) in slots"
          :key="`slot-${i}`"
          class="relative w-[52px] h-[52px] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-150"
          :class="[
            slot
              ? (gameState === 'correct' ? 'border-green-400 bg-green-50 scale-105' : 'border-purple-400 bg-purple-50')
              : (hoveredSlot === i ? 'border-purple-500 bg-purple-100 scale-110 shadow-md' : 'border-gray-300 bg-white/80'),
          ]"
          @dragover.stop.prevent="hoveredSlot = i"
          @dragleave.stop="hoveredSlot = null"
          @drop.stop.prevent="dropOnSlot(i)"
          @click="tapSlot(i)"
        >
          <span v-if="!slot" class="absolute bottom-0.5 right-1 text-[10px] text-gray-300 font-bold leading-none">
            {{ i + 1 }}
          </span>
          <Transition name="pop">
            <span
              v-if="slot"
              :key="slot.id"
              class="w-full h-full flex items-center justify-center rounded-lg text-white text-xl font-bold shadow-sm transition-transform"
              :class="[tileColor(slot.letter), gameState === 'correct' ? 'scale-110' : '']"
              draggable="true"
              @dragstart.stop="startDrag(slot, 'slot', i, $event)"
              @dragend.stop="finishDrag"
            >{{ slot.letter }}</span>
          </Transition>
        </div>
      </div>

      <!-- ===== LETTER POOL ===== -->
      <div
        class="min-h-24 px-4 py-4 bg-white/60 backdrop-blur-sm rounded-2xl border-2 transition-colors duration-200"
        :class="poolHighlighted ? 'border-purple-400 bg-purple-50/60' : 'border-purple-200'"
        @dragover.stop.prevent="poolHighlighted = true"
        @dragleave.stop="poolHighlighted = false"
        @drop.stop.prevent="dropOnPool(); poolHighlighted = false"
      >
        <TransitionGroup name="tile" tag="div" class="flex flex-wrap justify-center gap-3">
          <button
            v-for="(tile, i) in letterPool"
            :key="tile.id"
            type="button"
            class="w-[52px] h-[52px] rounded-xl text-white text-xl font-bold shadow-md
                   transition-all duration-150 cursor-grab active:cursor-grabbing
                   focus:outline-none focus:ring-2 focus:ring-purple-400"
            :class="[
              tileColor(tile.letter),
              dragInfo?.tile.id === tile.id ? 'opacity-40 scale-95' : 'hover:scale-110 hover:shadow-lg active:scale-90',
            ]"
            draggable="true"
            @dragstart="startDrag(tile, 'pool', i, $event)"
            @dragend="finishDrag"
            @click="tapPool(tile, i)"
          >{{ tile.letter }}</button>
        </TransitionGroup>
        <p v-if="letterPool.length === 0 && gameState !== 'correct'"
          class="text-center text-gray-400 text-sm py-2">
          ลากหรือแตะตัวอักษรไปวางในช่องด้านบน
        </p>
      </div>

      <!-- ===== CONTROLS ===== -->
      <div class="flex flex-wrap justify-center gap-3 pb-6">
        <button type="button"
          class="btn-game bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="gameState === 'correct' || gameState === 'revealed'"
          @click="sfxClick(); revealAnswer()">
          💡 เฉลย
        </button>
        <button type="button" class="btn-game bg-slate-400 hover:bg-slate-500"
          @click="sfxClick(); clearWord()">
          🔄 ล้างข้อมูล
        </button>
        <button type="button" class="btn-game bg-purple-500 hover:bg-purple-600"
          @click="sfxClick(); nextWord()">
          ➡️ ข้อถัดไป
        </button>
        <button type="button" class="btn-game bg-sky-400 hover:bg-sky-500"
          @click="sfxClick(); randomWord()">
          🎲 สุ่มคำถาม
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import confetti from 'canvas-confetti'
import { useVocab, type VocabItem } from '~/composables/useVocab'
import { sfxPickup, sfxDrop, sfxCorrect, sfxWrong, sfxReveal, sfxClick } from '~/composables/useSound'
import { getImageUrl } from '~/composables/useImageStore'
import { useTts } from '~/composables/useTts'

// ── Vocab ─────────────────────────────────────────────────────────────────────
const { vocabList, filteredVocabList, topic, playMode, init } = useVocab()
const { ttsSupported, isSpeaking, speak, stop } = useTts()
onMounted(init)

// ── Feedback phrases (English, kid-friendly) ──────────────────────────────────
const CORRECT_PHRASES = ['Excellent!', 'Well done!', 'Amazing!', 'Fantastic!', 'Brilliant!', 'Perfect!', 'Great job!']
const WRONG_PHRASES   = ['Oops! Try again!', 'Not quite!', 'Almost there!', 'Keep trying!']
const feedbackText    = ref('')

function pickCorrect() { return CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)] }
function pickWrong()   { return WRONG_PHRASES  [Math.floor(Math.random() * WRONG_PHRASES.length)]   }

// Displayed title: custom topic → category of current word → fallback
const displayTopic = computed(() => topic.value || currentItem.value?.category || '')

// ── Types ─────────────────────────────────────────────────────────────────────
interface LetterTile { id: string; letter: string }
type GameState = 'playing' | 'correct' | 'incorrect' | 'revealed'
interface DragInfo { tile: LetterTile; source: 'pool' | 'slot'; idx: number }

// ── State ─────────────────────────────────────────────────────────────────────
const currentIndex    = ref(0)
const letterPool      = ref<LetterTile[]>([])
const slots           = ref<(LetterTile | null)[]>([])
const gameState       = ref<GameState>('playing')
const isShaking       = ref(false)
const imgError        = ref(false)
const dragInfo        = ref<DragInfo | null>(null)
const hoveredSlot     = ref<number | null>(null)
const poolHighlighted = ref(false)

const currentItem  = computed<VocabItem | undefined>(() => filteredVocabList.value[currentIndex.value])
// Resolved image URL: IndexedDB blob first → /public/images/ fallback → null
const currentImgSrc = ref<string | null>(null)

async function resolveImageSrc(item?: VocabItem) {
  if (!item?.image) { currentImgSrc.value = null; return }
  // Set public fallback immediately so the image card never stays blank
  currentImgSrc.value = `/images/${item.image}`
  try {
    // Then try IndexedDB (with 2s timeout guard)
    const localUrl = await Promise.race([
      getImageUrl(item.image),
      new Promise<null>(r => setTimeout(() => r(null), 2000)),
    ])
    if (localUrl) currentImgSrc.value = localUrl
  } catch {
    // Keep the public fallback already set above
  }
}

// ── Tile colors ───────────────────────────────────────────────────────────────
const COLORS = [
  'bg-purple-500','bg-blue-500','bg-emerald-500','bg-orange-500',
  'bg-pink-500','bg-yellow-500','bg-red-500','bg-teal-500',
  'bg-indigo-500','bg-rose-500','bg-cyan-500','bg-violet-500',
]
const tileColor = (l: string) => COLORS[l.charCodeAt(0) % COLORS.length]

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(a: T[]): T[] {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function loadWord(item: VocabItem) {
  letterPool.value  = shuffle(item.word.split('').map((l, i) => ({
    id: `${l}-${i}-${Date.now()}-${Math.random()}`, letter: l,
  })))
  slots.value       = Array<null>(item.word.length).fill(null)
  gameState.value   = 'playing'
  isShaking.value   = false
  imgError.value    = false
  feedbackText.value = ''
  dragInfo.value    = null
  hoveredSlot.value = null
  stop()
  resolveImageSrc(item)
}

// ── Tap ───────────────────────────────────────────────────────────────────────
function tapPool(tile: LetterTile, poolIdx: number) {
  if (gameState.value !== 'playing') return
  const empty = slots.value.findIndex(s => s === null)
  if (empty === -1) return
  sfxPickup()
  slots.value[empty] = tile
  letterPool.value.splice(poolIdx, 1)
  sfxDrop()
  checkComplete()
}

function tapSlot(slotIdx: number) {
  if (gameState.value !== 'playing') return
  const tile = slots.value[slotIdx]
  if (!tile) return
  sfxPickup()
  slots.value[slotIdx] = null
  letterPool.value.push(tile)
}

// ── Drag ──────────────────────────────────────────────────────────────────────
function startDrag(tile: LetterTile, source: 'pool' | 'slot', idx: number, e: DragEvent) {
  if (gameState.value !== 'playing') { e.preventDefault(); return }
  dragInfo.value = { tile, source, idx }
  e.dataTransfer!.effectAllowed = 'move'
  sfxPickup()
}

function dropOnSlot(slotIdx: number) {
  hoveredSlot.value = null
  const d = dragInfo.value
  if (!d || gameState.value !== 'playing') return
  const existing = slots.value[slotIdx]
  if (d.source === 'pool') {
    slots.value[slotIdx] = d.tile
    if (existing) letterPool.value.push(existing)
    const pi = letterPool.value.findIndex(t => t.id === d.tile.id)
    if (pi !== -1) letterPool.value.splice(pi, 1)
  } else {
    slots.value[slotIdx] = d.tile
    slots.value[d.idx]   = existing
  }
  sfxDrop()
  finishDrag()
  checkComplete()
}

function dropOnPool() {
  poolHighlighted.value = false
  hoveredSlot.value     = null
  const d = dragInfo.value
  if (!d) return
  if (d.source === 'slot') {
    slots.value[d.idx] = null
    letterPool.value.push(d.tile)
  }
  finishDrag()
}

function finishDrag() { dragInfo.value = null; hoveredSlot.value = null }

// ── Answer ────────────────────────────────────────────────────────────────────
function checkComplete() {
  if (slots.value.every(s => s !== null)) checkAnswer()
}

function checkAnswer() {
  const word = currentItem.value!.word
  if (slots.value.every((t, i) => t?.letter === word[i])) {
    const phrase = pickCorrect()
    feedbackText.value = phrase
    gameState.value = 'correct'
    sfxCorrect()
    fireConfetti()
    // Speak: phrase + word  (slight delay so SFX plays first)
    setTimeout(() => speak(`${phrase}  The word is ${word}!`, 0.90), 480)
  } else {
    const phrase = pickWrong()
    feedbackText.value = phrase
    gameState.value = 'incorrect'
    sfxWrong()
    triggerShake()
    setTimeout(() => speak(phrase, 0.92), 200)
    setTimeout(() => { if (gameState.value === 'incorrect') gameState.value = 'playing' }, 900)
  }
}

function triggerShake() {
  isShaking.value = false
  requestAnimationFrame(() => {
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 600)
  })
}

function fireConfetti() {
  const colors = ['#a855f7','#ec4899','#22c55e','#3b82f6','#f59e0b']
  const end = Date.now() + 1800
  ;(function frame() {
    confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

// ── Reveal ────────────────────────────────────────────────────────────────────
async function revealAnswer() {
  if (gameState.value === 'correct') return
  gameState.value = 'revealed'
  const word = currentItem.value!.word

  for (let i = 0; i < word.length; i++) {
    if (slots.value[i]?.letter === word[i]) continue
    const target = word[i]
    const pi = letterPool.value.findIndex(t => t.letter === target)
    if (pi !== -1) {
      const displaced = slots.value[i]
      slots.value[i]  = letterPool.value[pi]
      letterPool.value.splice(pi, 1)
      if (displaced) letterPool.value.push(displaced)
    } else {
      const si = slots.value.findIndex((t, idx) => idx !== i && t?.letter === target)
      if (si !== -1) {
        const displaced = slots.value[i]
        slots.value[i]  = slots.value[si]
        slots.value[si] = displaced
      }
    }
    sfxReveal(i)
    await new Promise<void>(r => setTimeout(r, 200))
  }
  gameState.value = 'correct'
  sfxCorrect()
  fireConfetti()
}

// ── Navigation ────────────────────────────────────────────────────────────────
function nextWord() {
  if (playMode.value === 'sequence') {
    currentIndex.value = (currentIndex.value + 1) % filteredVocabList.value.length
  } else {
    randomWord()
  }
}

function randomWord() {
  if (filteredVocabList.value.length <= 1) return
  let i: number
  do { i = Math.floor(Math.random() * filteredVocabList.value.length) }
  while (i === currentIndex.value)
  currentIndex.value = i
}

function clearWord() { if (currentItem.value) loadWord(currentItem.value) }

watch(currentIndex, () => { if (currentItem.value) { loadWord(currentItem.value); resolveImageSrc(currentItem.value) } })

// When the active category filter changes, clamp index to new list size
watch(filteredVocabList, (newList) => {
  if (newList.length === 0) return
  if (currentIndex.value >= newList.length) currentIndex.value = 0
  else if (currentItem.value) { loadWord(currentItem.value); resolveImageSrc(currentItem.value) }
}, { deep: false })

onMounted(() => { if (currentItem.value) { loadWord(currentItem.value); resolveImageSrc(currentItem.value) } })
</script>

<style>
.btn-game {
  @apply px-5 py-2.5 rounded-xl font-bold text-white shadow-md
         transition-all duration-150 active:scale-95
         disabled:opacity-40 disabled:cursor-not-allowed;
}

/* ── Pop (letter into slot) ── */
@keyframes popIn {
  0%  { transform: scale(0.1) rotate(-15deg); opacity:0 }
  70% { transform: scale(1.15) rotate(5deg) }
  100%{ transform: scale(1) rotate(0deg); opacity:1 }
}
.pop-enter-active { animation: popIn .35s cubic-bezier(.175,.885,.32,1.275) both }
.pop-leave-active { transition: all .15s ease-in }
.pop-leave-to     { transform: scale(0); opacity:0 }

/* ── Tile list ── */
@keyframes bounceIn {
  0%  { transform:scale(0.2); opacity:0 }
  50% { transform:scale(1.2) }
  75% { transform:scale(0.92) }
  100%{ transform:scale(1); opacity:1 }
}
.tile-enter-active { animation: bounceIn .4s cubic-bezier(.175,.885,.32,1.275) both }
.tile-leave-active { transition: all .15s ease-in; position:absolute }
.tile-leave-to     { transform:scale(0); opacity:0 }
.tile-move         { transition: transform .3s ease }

/* ── Image swap ── */
.img-swap-enter-active { transition: all .25s ease-out }
.img-swap-leave-active { transition: all .20s ease-in  }
.img-swap-enter-from,.img-swap-leave-to { opacity:0; transform:scale(.9) }

/* ── Slide (feedback) ── */
.slide-enter-active,.slide-leave-active { transition:all .25s ease }
.slide-enter-from,.slide-leave-to       { opacity:0; transform:translateY(-8px) }

/* ── Shake override (Tailwind keyframe may not load without a class use) ── */
@keyframes shake {
  0%,100% { transform:translateX(0) }
  15%     { transform:translateX(-10px) }
  30%     { transform:translateX(10px) }
  45%     { transform:translateX(-8px) }
  60%     { transform:translateX(8px) }
  75%     { transform:translateX(-4px) }
  90%     { transform:translateX(4px) }
}
.animate-shake  { animation: shake .55s ease-in-out }

@keyframes wiggle {
  0%,100% { transform:rotate(-4deg) scale(1.05) }
  50%     { transform:rotate(4deg)  scale(1.05) }
}
.animate-wiggle { animation: wiggle .45s ease-in-out 3 }

@keyframes float {
  0%,100% { transform:translateY(0) }
  50%     { transform:translateY(-12px) }
}
.animate-float  { animation: float 3s ease-in-out infinite }

/* ── Global particle animation (used by ParticleBackground) ── */
@keyframes particleRise {
  0%  { transform:translateY(0) rotate(0deg) scale(1);       opacity:0 }
  8%  { opacity:1 }
  90% { opacity:.8 }
  100%{ transform:translateY(-110vh) rotate(720deg) scale(.4); opacity:0 }
}
@keyframes bgShift {
  0%,100% { opacity:.4; transform:scale(1)    translate(0,0)    }
  33%     { opacity:.7; transform:scale(1.15) translate(3%,-3%) }
  66%     { opacity:.5; transform:scale(.95)  translate(-2%,4%) }
}
@keyframes twinkle {
  0%,100% { opacity:.2; transform:scale(.8) }
  50%     { opacity:1;  transform:scale(1.3) }
}
.animate-bgShift { animation: bgShift 12s ease-in-out infinite }
</style>
