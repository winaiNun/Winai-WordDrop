import { ref, computed } from 'vue'
import defaultData from '~/assets/data/vocab.json'

export interface VocabItem {
  id: number
  word: string
  image: string
  emoji?: string
  category: string
  translation?: string   // คำแปลภาษาไทย
}

const STORAGE_KEY  = 'winai-vocab-v1'
const TOPIC_KEY    = 'winai-topic'
const PLAYMODE_KEY = 'winai-playmode'
const CASEMODE_KEY = 'winai-case-mode'
const CATS_KEY     = 'winai-active-cats'
const APPMODE_KEY  = 'winai-app-mode'
const TEST_DUR_KEY = 'winai-test-duration'

// ── Module-level singletons ───────────────────────────────────────────────────
const list         = ref<VocabItem[]>([])
const topic        = ref('')
const playMode     = ref<'random' | 'sequence'>('sequence')
const caseMode     = ref<'upper' | 'lower'>('upper')
const appMode      = ref<'learn' | 'test'>('learn')
const testDuration = ref(60) // seconds
const activeCats   = ref<string[] | null>(null)
let _ready = false

// ── Derived state ─────────────────────────────────────────────────────────────
const categories = computed(() => [...new Set(list.value.map(i => i.category))])

const filteredVocabList = computed(() => {
  if (activeCats.value === null) return list.value
  if (activeCats.value.length === 0) return []
  return list.value.filter(i => activeCats.value!.includes(i.category))
})

const categoryCounts = computed(() => {
  const map: Record<string, number> = {}
  list.value.forEach(i => { map[i.category] = (map[i.category] ?? 0) + 1 })
  return map
})

// ── Export ────────────────────────────────────────────────────────────────────
export function useVocab() {
  function init() {
    if (_ready) return
    _ready = true
    if (typeof window === 'undefined') {
      list.value = [...(defaultData as VocabItem[])]
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      list.value = raw ? JSON.parse(raw) : [...(defaultData as VocabItem[])]
    } catch {
      list.value = [...(defaultData as VocabItem[])]
    }
    topic.value    = localStorage.getItem(TOPIC_KEY)    ?? ''
    playMode.value = (localStorage.getItem(PLAYMODE_KEY) as 'random' | 'sequence') ?? 'sequence'
    caseMode.value  = (localStorage.getItem(CASEMODE_KEY) as 'upper' | 'lower') ?? 'upper'
    appMode.value   = (localStorage.getItem(APPMODE_KEY)  as 'learn' | 'test')  ?? 'learn'
    testDuration.value = parseInt(localStorage.getItem(TEST_DUR_KEY) ?? '60') || 60
    try {
      const rawCats = localStorage.getItem(CATS_KEY)
      activeCats.value = (rawCats === null || rawCats === 'null') ? null : JSON.parse(rawCats)
    } catch {
      activeCats.value = null
    }
  }

  function persist() {
    if (typeof window !== 'undefined')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.value))
  }

  function setTopic(t: string) {
    topic.value = t
    if (typeof window !== 'undefined') localStorage.setItem(TOPIC_KEY, t)
  }
  function setPlayMode(m: 'random' | 'sequence') {
    playMode.value = m
    if (typeof window !== 'undefined') localStorage.setItem(PLAYMODE_KEY, m)
  }
  function setCaseMode(m: 'upper' | 'lower') {
    caseMode.value = m
    if (typeof window !== 'undefined') localStorage.setItem(CASEMODE_KEY, m)
  }
  function setAppMode(m: 'learn' | 'test') {
    appMode.value = m
    if (typeof window !== 'undefined') localStorage.setItem(APPMODE_KEY, m)
  }
  function setTestDuration(s: number) {
    testDuration.value = s
    if (typeof window !== 'undefined') localStorage.setItem(TEST_DUR_KEY, String(s))
  }

  function isCatActive(cat: string) {
    if (activeCats.value === null) return true
    return activeCats.value.includes(cat)
  }
  function persistCats() {
    if (typeof window === 'undefined') return
    if (activeCats.value === null) localStorage.removeItem(CATS_KEY)
    else localStorage.setItem(CATS_KEY, JSON.stringify(activeCats.value))
  }
  function toggleCategory(cat: string) {
    const allCats = categories.value
    const current = activeCats.value === null ? [...allCats] : [...activeCats.value]
    const idx = current.indexOf(cat)
    if (idx !== -1) {
      activeCats.value = current.filter(c => c !== cat)
    } else {
      const next = [...current, cat]
      activeCats.value = next.length === allCats.length ? null : next
    }
    persistCats()
  }
  function selectAllCategories()   { activeCats.value = null; persistCats() }
  function deselectAllCategories() { activeCats.value = [];   persistCats() }

  function add(item: Omit<VocabItem, 'id'>) {
    list.value.push({ ...item, id: Date.now() }); persist()
  }
  function update(id: number, patch: Partial<Omit<VocabItem, 'id'>>) {
    const i = list.value.findIndex(x => x.id === id)
    if (i !== -1) { list.value[i] = { ...list.value[i], ...patch }; persist() }
  }
  function remove(id: number) {
    list.value = list.value.filter(x => x.id !== id); persist()
  }
  function reset() {
    list.value = [...(defaultData as VocabItem[])]; persist()
  }
  function replaceAll(items: Omit<VocabItem, 'id'>[]) {
    list.value = items.map((x, i) => ({ ...x, id: Date.now() + i })); persist()
  }

  return {
    vocabList: list, filteredVocabList, categories, categoryCounts, activeCats,
    topic, playMode, caseMode, appMode, testDuration,
    init, setTopic, setPlayMode, setCaseMode, setAppMode, setTestDuration,
    isCatActive, toggleCategory, selectAllCategories, deselectAllCategories,
    add, update, remove, reset, replaceAll,
  }
}
