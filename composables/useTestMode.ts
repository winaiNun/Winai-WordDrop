import { ref, computed } from 'vue'
import type { VocabItem } from './useVocab'

export type TestPhase = 'entry' | 'playing' | 'results'

export interface TestAnswer {
  word: string
  translation: string
  emoji: string
  wasCorrect: boolean
}

// ── Module-level singleton ────────────────────────────────────────────────────
const phase        = ref<TestPhase>('entry')
const playerName   = ref('')
const testWords    = ref<VocabItem[]>([])
const wordIdx      = ref(0)
const correctCount = ref(0)
const answers      = ref<TestAnswer[]>([])
const timeLeft     = ref(0)
const timeUsed     = ref(0)
const isPaused     = ref(false)
let _timer: ReturnType<typeof setInterval> | null = null

function _startTick() {
  if (_timer) clearInterval(_timer)
  _timer = setInterval(() => {
    timeLeft.value--
    timeUsed.value++
    if (timeLeft.value <= 0) {
      clearInterval(_timer!); _timer = null
      phase.value = 'results'
    }
  }, 1000)
}

function _shuffle<T>(a: T[]): T[] {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function useTestMode() {
  const currentWord = computed<VocabItem | undefined>(() => testWords.value[wordIdx.value])

  const progress = computed(() => ({
    current: Math.min(wordIdx.value + 1, testWords.value.length),
    total:   testWords.value.length,
  }))

  // Always use total words as denominator, not just attempted
  const totalWords    = computed(() => testWords.value.length)
  const wrongCount    = computed(() => answers.value.filter(a => !a.wasCorrect).length)
  const notAttempted  = computed(() => testWords.value.length - answers.value.length)
  const scorePercent  = computed(() =>
    testWords.value.length > 0 ? Math.round(correctCount.value / testWords.value.length * 100) : 0
  )

  // ── Start ──────────────────────────────────────────────────────────────────
  function begin(words: VocabItem[], durationSec: number, name: string) {
    if (_timer) clearInterval(_timer)
    playerName.value   = name.trim() || 'ผู้เล่น'
    testWords.value    = _shuffle([...words])
    wordIdx.value      = 0
    correctCount.value = 0
    answers.value      = []
    timeLeft.value     = durationSec
    timeUsed.value     = 0
    isPaused.value     = false
    phase.value        = 'playing'
    _startTick()
  }

  function pause() {
    if (_timer) { clearInterval(_timer); _timer = null }
    isPaused.value = true
  }

  function resume() {
    if (phase.value !== 'playing') return
    isPaused.value = false
    _startTick()
  }

  // ── Record answer & auto-advance ──────────────────────────────────────────
  function recordAnswer(wasCorrect: boolean) {
    const w = testWords.value[wordIdx.value]
    if (!w) return
    if (wasCorrect) correctCount.value++
    answers.value.push({
      word:        w.word,
      translation: w.translation ?? '',
      emoji:       w.emoji ?? '',
      wasCorrect,
    })
    wordIdx.value++
    if (wordIdx.value >= testWords.value.length) finish()
  }

  // ── End ───────────────────────────────────────────────────────────────────
  function finish() {
    if (_timer) { clearInterval(_timer); _timer = null }
    isPaused.value = false
    phase.value    = 'results'
  }

  function reset() {
    if (_timer) { clearInterval(_timer); _timer = null }
    phase.value        = 'entry'
    playerName.value   = ''
    answers.value      = []
    wordIdx.value      = 0
    correctCount.value = 0
    isPaused.value     = false
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function formatTime(s: number) {
    const m   = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  /** Download a PNG results card via Canvas API */
  async function captureResultsImage() {
    const W = 600, H = 480
    const canvas = document.createElement('canvas')
    canvas.width  = W * 2   // retina
    canvas.height = H * 2
    const c = canvas.getContext('2d')!
    c.scale(2, 2)

    // Background
    const bg = c.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#ede9fe')
    bg.addColorStop(1, '#fce7f3')
    c.fillStyle = bg
    c.fillRect(0, 0, W, H)

    // Card
    c.fillStyle = 'rgba(255,255,255,0.88)'
    _roundRect(c, 20, 20, W - 40, H - 40, 20)
    c.fill()

    c.textAlign = 'center'

    // Title
    c.fillStyle = '#7c3aed'
    c.font = 'bold 20px Mali,cursive'
    c.fillText('🏆  WinaiWordDrop — Test Results', W / 2, 64)

    // Name
    c.fillStyle = '#1f2937'
    c.font = 'bold 17px Mali,cursive'
    c.fillText(playerName.value, W / 2, 96)

    // Score
    const pct = scorePercent.value
    c.font = 'bold 46px Mali,cursive'
    c.fillStyle = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
    c.fillText(`${correctCount.value} / ${testWords.value.length}`, W / 2, 168)

    c.font = '16px Mali,cursive'
    c.fillStyle = '#6b7280'
    const notDone = testWords.value.length - answers.value.length
    const wrong   = answers.value.filter(a => !a.wasCorrect).length
    const breakdown = `✅ ${correctCount.value}  ❌ ${wrong}${notDone > 0 ? `  ⏭ ${notDone}` : ''}`
    c.fillText(`${pct}%   ·   Time: ${formatTime(timeUsed.value)}`, W / 2, 196)
    c.font = '13px Mali,cursive'
    c.fillText(breakdown, W / 2, 216)

    // Divider
    c.strokeStyle = '#e5e7eb'
    c.lineWidth = 1
    c.beginPath(); c.moveTo(40, 216); c.lineTo(W - 40, 216); c.stroke()

    // Answer list (max 10 rows)
    const visAnswers = answers.value.slice(0, 10)
    c.font = '13px Mali,cursive'
    c.textAlign = 'left'
    visAnswers.forEach((a, idx) => {
      const y  = 240 + idx * 20
      const x  = 50
      c.fillStyle = a.wasCorrect ? '#16a34a' : '#dc2626'
      c.fillText(a.wasCorrect ? '✅' : '❌', x, y)
      c.fillStyle = '#1f2937'
      c.fillText(`${a.word}  ${a.translation ? '— ' + a.translation : ''}`, x + 26, y)
    })
    if (answers.value.length > 10) {
      c.fillStyle = '#9ca3af'
      c.font = '11px Mali,cursive'
      c.textAlign = 'center'
      c.fillText(`... and ${answers.value.length - 10} more`, W / 2, 240 + 10 * 20 + 4)
    }

    // Footer
    c.font = '10px Mali,cursive'
    c.fillStyle = '#9ca3af'
    c.textAlign = 'center'
    c.fillText('© 2026 Winai Nunkratok · Educational Supervisor', W / 2, H - 28)

    // Download
    const link = document.createElement('a')
    const date  = new Date().toLocaleDateString('th-TH').replace(/\//g, '-')
    link.download = `WinaiWordDrop-${playerName.value}-${date}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return {
    phase, playerName, testWords, wordIdx, correctCount,
    answers, timeLeft, timeUsed,
    currentWord, progress,
    totalWords, wrongCount, notAttempted, scorePercent, isPaused,
    begin, recordAnswer, pause, resume, finish, reset,
    formatTime, captureResultsImage,
  }
}

// ── Internal helper ───────────────────────────────────────────────────────────
function _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
