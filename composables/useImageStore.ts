/**
 * useImageStore
 * Stores vocabulary images from the user's local folder into IndexedDB.
 * Images are keyed by their filename (e.g. "apple.png").
 * Works fully offline after the first folder selection.
 */
import { ref } from 'vue'

const DB_NAME    = 'winai-images-v1'
const STORE_NAME = 'imgs'

// ── Shared reactive state ─────────────────────────────────────────────────────
export const storedImageCount = ref(0)

// ── Internal cache: filename → blob URL ──────────────────────────────────────
const urlCache = new Map<string, string>()

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => { _db = req.result; resolve(_db) }
    req.onerror   = () => reject(req.error)
  })
}

function idbPut(key: string, buf: ArrayBuffer): Promise<void> {
  return openDB().then(db => new Promise((res, rej) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(buf, key)
    req.onsuccess = () => res()
    req.onerror   = () => rej(req.error)
  }))
}

function idbGet(key: string): Promise<ArrayBuffer | undefined> {
  return openDB().then(db => new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  }))
}

function idbCount(): Promise<number> {
  return openDB().then(db => new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).count()
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  }))
}

function idbClear(): Promise<void> {
  return openDB().then(db => new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear()
    req.onsuccess = () => res()
    req.onerror   = () => rej(req.error)
  }))
}

// ── Public helpers ────────────────────────────────────────────────────────────

/** Returns a blob URL for a stored image, or null if not found. */
export async function getImageUrl(filename: string): Promise<string | null> {
  if (!filename) return null
  if (urlCache.has(filename)) return urlCache.get(filename)!
  const buf = await idbGet(filename)
  if (!buf) return null
  const ext  = filename.split('.').pop()?.toLowerCase() ?? 'png'
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
             : ext === 'webp'                  ? 'image/webp'
             : ext === 'gif'                   ? 'image/gif'
             : 'image/png'
  const url = URL.createObjectURL(new Blob([buf], { type: mime }))
  urlCache.set(filename, url)
  return url
}

/** Sync the reactive count with what's actually in IndexedDB. */
export async function syncCount() {
  storedImageCount.value = await idbCount()
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useImageStore() {
  const isLoading    = ref(false)
  const loadedCount  = ref(0)
  const errorMsg     = ref('')

  const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])

  /** Read all images from a FileSystemDirectoryHandle and store in IndexedDB. */
  async function storeFromDirectory(dirHandle: FileSystemDirectoryHandle): Promise<number> {
    isLoading.value   = true
    loadedCount.value = 0
    errorMsg.value    = ''
    let stored = 0
    try {
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind !== 'file') continue
        const ext = name.split('.').pop()?.toLowerCase() ?? ''
        if (!IMAGE_EXTS.has(ext)) continue
        const file = await (handle as FileSystemFileHandle).getFile()
        const buf  = await file.arrayBuffer()
        await idbPut(name, buf)
        urlCache.delete(name) // invalidate cached blob URL
        stored++
        loadedCount.value = stored
      }
      await syncCount()
    } catch (e) {
      errorMsg.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
    return stored
  }

  /** Open OS directory picker (Chrome/Edge) with a webkitdirectory fallback. */
  async function pickFolder(): Promise<number> {
    if ('showDirectoryPicker' in window) {
      try {
        const dir = await (window as any).showDirectoryPicker({ mode: 'read' })
        return storeFromDirectory(dir)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return 0
        throw e
      }
    }
    // Fallback: return -1 so the caller shows <input webkitdirectory>
    return -1
  }

  /** Open OS file picker for Excel / CSV files. */
  async function pickExcelFile(): Promise<File | null> {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Excel / CSV',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'text/csv': ['.csv'],
            },
          }],
          multiple: false,
          excludeAcceptAllOption: false,
        })
        return (handle as FileSystemFileHandle).getFile()
      } catch (e) {
        if ((e as Error).name === 'AbortError') return null
        throw e
      }
    }
    // Fallback: caller must use <input type="file">
    return null
  }

  async function clearAll() {
    urlCache.forEach(url => URL.revokeObjectURL(url))
    urlCache.clear()
    await idbClear()
    storedImageCount.value = 0
  }

  /** Store an array of File objects directly (fallback for browsers without directory picker) */
  async function storeFiles(files: File[]): Promise<number> {
    isLoading.value   = true
    loadedCount.value = 0
    errorMsg.value    = ''
    let stored = 0
    const IMAGE_EXTS = new Set(['png','jpg','jpeg','gif','webp','svg'])
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
        if (!IMAGE_EXTS.has(ext)) continue
        const buf = await file.arrayBuffer()
        await idbPut(file.name, buf)
        urlCache.delete(file.name)
        stored++
        loadedCount.value = stored
      }
      await syncCount()
    } catch (e) {
      errorMsg.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
    return stored
  }

  return {
    isLoading, loadedCount, errorMsg, storedImageCount,
    pickFolder, pickExcelFile,
    storeFromDirectory, storeFiles, clearAll, syncCount,
  }
}
