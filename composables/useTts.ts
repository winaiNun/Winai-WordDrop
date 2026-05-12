/**
 * useTts — Web Speech API wrapper
 * Free, offline-capable, no API key needed.
 * Uses the best available English voice on the device.
 */
import { ref } from 'vue'

export const ttsSupported = ref(false)
export const isSpeaking   = ref(false)

let _voicesLoaded = false
let _bestVoice: SpeechSynthesisVoice | null = null

// Voice preference order (higher = better quality)
const PREFERRED_VOICES = [
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Google US English',
  'Samantha',        // macOS / iOS
  'Alex',            // macOS
  'Karen',           // macOS AU
  'Daniel',          // macOS UK
]

function pickBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  // 1. Try preferred list in order
  for (const name of PREFERRED_VOICES) {
    const v = voices.find(v => v.name === name)
    if (v) return v
  }
  // 2. Any en-US voice
  const enUS = voices.find(v => v.lang === 'en-US')
  if (enUS) return enUS
  // 3. Any English voice
  return voices.find(v => v.lang.startsWith('en')) ?? null
}

function ensureVoice() {
  if (_voicesLoaded) return
  _voicesLoaded = true
  _bestVoice = pickBestVoice()
  // Chrome loads voices async — retry once they're ready
  if (!_bestVoice && 'onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      _bestVoice = pickBestVoice()
    }
  }
}

export function useTts() {
  if (typeof window !== 'undefined') {
    ttsSupported.value = 'speechSynthesis' in window
  }

  /** Speak a word aloud in English */
  function speak(text: string, rate = 0.88) {
    if (!ttsSupported.value) return
    ensureVoice()

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utt      = new SpeechSynthesisUtterance(text.toLowerCase())
    utt.lang       = 'en-US'
    utt.rate       = rate
    utt.pitch      = 1.05
    utt.volume     = 1
    if (_bestVoice) utt.voice = _bestVoice

    utt.onstart = () => { isSpeaking.value = true }
    utt.onend   = () => { isSpeaking.value = false }
    utt.onerror = () => { isSpeaking.value = false }

    window.speechSynthesis.speak(utt)
  }

  function stop() {
    if (!ttsSupported.value) return
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }

  return { ttsSupported, isSpeaking, speak, stop }
}
