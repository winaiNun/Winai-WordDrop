import { ref } from 'vue'

// ── Shared state ──────────────────────────────────────────────────────────────
export const isMusicOn = ref(false)
export const isSfxOn   = ref(true)

// ── Note table (Hz) ───────────────────────────────────────────────────────────
const F: Record<string, number> = {
  A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
}

// ── Upbeat pentatonic melody (C major, 30 notes, loops seamlessly) ─────────────
const MELODY: [string, number][] = [
  ['C5',0.5],['E5',0.5],['G5',0.5],['E5',0.5],
  ['C5',0.5],['A4',0.5],['G4',1.0],
  ['G4',0.5],['A4',0.5],['C5',0.5],['A4',0.5],
  ['G4',0.5],['E4',0.5],['D4',1.0],
  ['E4',0.5],['G4',0.5],['A4',0.5],['G4',0.5],
  ['E4',0.5],['C5',0.5],['G4',1.0],
  ['A4',0.5],['G4',0.5],['E4',0.5],['D4',0.5],
  ['C4',0.5],['D4',0.5],['E4',0.5],['G4',0.5],
  ['A4',1.0],['G4',0.5],['E4',0.5],
  ['C4',2.0],
]

const BPM  = 126
const BEAT = 60 / BPM

// ── Internal audio state ──────────────────────────────────────────────────────
let _ctx: AudioContext | null = null
let sfxGain: GainNode  | null = null
let bgGain:  GainNode  | null = null
let schedulerTimer: ReturnType<typeof setInterval> | null = null
let nextNoteTime = 0
let noteIdx = 0

function ctx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    sfxGain = _ctx.createGain(); sfxGain.gain.value = 0.70; sfxGain.connect(_ctx.destination)
    bgGain  = _ctx.createGain(); bgGain.gain.value  = 0.22; bgGain.connect(_ctx.destination)
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// Generic oscillator burst
function osc(
  freq: number, dur: number, type: OscillatorType = 'sine',
  vol = 0.28, delay = 0, dest?: AudioNode,
) {
  const c   = ctx()
  const osc = c.createOscillator()
  const g   = c.createGain()
  osc.connect(g); g.connect(dest ?? sfxGain!)
  osc.type = type; osc.frequency.value = freq
  const t = c.currentTime + delay
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.start(t); osc.stop(t + dur + 0.02)
}

// ── SFX ───────────────────────────────────────────────────────────────────────

export function sfxPickup() {
  if (!isSfxOn.value) return
  osc(880,   0.07, 'sine', 0.22)
  osc(1046.5,0.05, 'sine', 0.10, 0.04)
}

export function sfxDrop() {
  if (!isSfxOn.value) return
  osc(659,  0.09, 'sine', 0.28)
  osc(880,  0.11, 'sine', 0.16, 0.05)
}

export function sfxCorrect() {
  if (!isSfxOn.value) return
  // Ascending arpeggio C-E-G-C-E + upper shimmer
  const run: [number, number][] = [[261.63,0],[329.63,.10],[392,.20],[523.25,.30],[659.25,.42],[1046.5,.58]]
  run.forEach(([f, d]) => osc(f, 0.38, 'sine', 0.30, d))
  // Sparkle layer
  setTimeout(() => {
    [1046.5, 1318.5, 1567.98].forEach((f, i) => osc(f, 0.18, 'triangle', 0.18, i * 0.06))
  }, 620)
}

export function sfxWrong() {
  if (!isSfxOn.value) return
  osc(220,    0.12, 'sawtooth', 0.28)
  osc(207.65, 0.12, 'sawtooth', 0.22, 0.10)
  osc(196,    0.22, 'sawtooth', 0.16, 0.22)
}

export function sfxReveal(step: number) {
  if (!isSfxOn.value) return
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]
  const f = PENTA[step % PENTA.length]
  osc(f,     0.20, 'triangle', 0.30)
  osc(f * 2, 0.13, 'sine',     0.12, 0.06)
}

export function sfxClick() {
  if (!isSfxOn.value) return
  osc(1320, 0.035, 'sine', 0.13)
}

// ── Background music (Web Audio lookahead scheduler) ─────────────────────────

function scheduleBg() {
  const c      = ctx()
  const AHEAD  = 0.25 // seconds to schedule ahead

  while (nextNoteTime < c.currentTime + AHEAD) {
    const [noteName, beats] = MELODY[noteIdx % MELODY.length]
    const dur  = (beats as number) * BEAT
    const freq = F[noteName as string]

    if (freq) {
      // Main triangle tone
      const o1 = c.createOscillator()
      const g1 = c.createGain()
      o1.type = 'triangle'; o1.frequency.value = freq
      o1.connect(g1); g1.connect(bgGain!)
      const t = nextNoteTime
      g1.gain.setValueAtTime(0, t)
      g1.gain.linearRampToValueAtTime(0.55, t + 0.020)
      g1.gain.setValueAtTime(0.55, t + dur * 0.70)
      g1.gain.linearRampToValueAtTime(0, t + dur * 0.96)
      o1.start(t); o1.stop(t + dur)

      // Shimmer overtone (sine, octave up)
      const o2 = c.createOscillator()
      const g2 = c.createGain()
      o2.type = 'sine'; o2.frequency.value = freq * 2
      o2.connect(g2); g2.connect(bgGain!)
      g2.gain.setValueAtTime(0, t)
      g2.gain.linearRampToValueAtTime(0.10, t + 0.015)
      g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.65)
      o2.start(t); o2.stop(t + dur)
    }

    nextNoteTime += (beats as number) * BEAT
    noteIdx++
  }
}

export function startMusic() {
  if (schedulerTimer) return
  const c = ctx()
  nextNoteTime = c.currentTime + 0.1
  noteIdx = 0
  isMusicOn.value = true
  schedulerTimer = setInterval(scheduleBg, 80)
}

export function stopMusic() {
  if (schedulerTimer) { clearInterval(schedulerTimer); schedulerTimer = null }
  isMusicOn.value = false
}

export function toggleMusic() { isMusicOn.value ? stopMusic() : startMusic() }
export function toggleSfx()   { isSfxOn.value = !isSfxOn.value }

// ── Composable export ─────────────────────────────────────────────────────────
export function useSound() {
  return {
    isMusicOn, isSfxOn,
    sfxPickup, sfxDrop, sfxCorrect, sfxWrong, sfxReveal, sfxClick,
    startMusic, stopMusic, toggleMusic, toggleSfx,
  }
}
