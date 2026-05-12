import { ref, computed } from 'vue'
import defaultData from '~/assets/data/vocab.json'

export interface VocabItem {
  id: number
  word: string
  image: string
  emoji?: string
  category: string
}

const STORAGE_KEY  = 'winai-vocab-v1'
const TOPIC_KEY    = 'winai-topic'
const PLAYMODE_KEY = 'winai-playmode'
const CATS_KEY     = 'winai-active-cats'

// ── Module-level singletons ───────────────────────────────────────────────────
const list        = ref<VocabItem[]>([])
const topic       = ref('')
const playMode    = ref<'random' | 'sequence'>('sequence')
// null  = all categories active (no filter)
// []    = none selected → game shows warning
// [...] = specific categories selected
const activeCats  = ref<string[] | null>(null)
let _ready = false

// ── Derived state ─────────────────────────────────────────────────────────────
const categories = computed(() => [...new Set(list.value.map(i => i.category))])

/** Vocab filtered by selected categories */
const filteredVocabList = computed(() => {
  if (activeCats.value === null) return list.value
  if (activeCats.value.length === 0) return []
  return list.value.filter(i => activeCats.value!.includes(i.category))
})

/** Per-category word count */
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
    try {
      const rawCats = localStorage.getItem(CATS_KEY)
      // stored 'null' string or missing key → all selected (null)
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

  /** True when a category is included in the active set (null = all active) */
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
    // Expand null → all cats before toggling
    const current = activeCats.value === null ? [...allCats] : [...activeCats.value]
    const idx = current.indexOf(cat)

    if (idx !== -1) {
      // Deselect — allow going to empty (shows warning in game)
      activeCats.value = current.filter(c => c !== cat)
    } else {
      const next = [...current, cat]
      // All categories selected → simplify back to null
      activeCats.value = next.length === allCats.length ? null : next
    }
    persistCats()
  }

  /** Select all categories (null = no filter) */
  function selectAllCategories() {
    activeCats.value = null
    persistCats()
  }

  /** Deselect all — game will show a warning */
  function deselectAllCategories() {
    activeCats.value = []
    persistCats()
  }

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
    vocabList: list,
    filteredVocabList,
    categories,
    categoryCounts,
    activeCats,
    topic,
    playMode,
    init,
    setTopic,
    setPlayMode,
    isCatActive,
    toggleCategory,
    selectAllCategories,
    deselectAllCategories,
    add, update, remove, reset, replaceAll,
  }
}
