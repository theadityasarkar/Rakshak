import type { IncidentReport } from "@/src/types/incident"

const DB_NAME = "ner-rakshak-idb"
const DB_VERSION = 1
const STORE = "offline-queue"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"))
  })
}

const LS_BACKUP_KEY = "ner-rakshak-offline-queue-backup"

export async function loadOfflineQueue(): Promise<IncidentReport[]> {
  try {
    const db = await openDb()
    const idbItems = await new Promise<IncidentReport[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly")
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => resolve((req.result as IncidentReport[]) ?? [])
      req.onerror = () => reject(req.error)
    })
    if (idbItems && idbItems.length > 0) return idbItems
  } catch {
    // Fallback to localStorage
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(LS_BACKUP_KEY)
      if (raw) return JSON.parse(raw) as IncidentReport[]
    }
  } catch {
    // Ignore storage parsing errors
  }
  return []
}

export async function persistOfflineQueue(items: IncidentReport[]): Promise<void> {
  // Mirror to localStorage first for instant synchronous persistence
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(items))
    }
  } catch {
    // quota exceeded or private mode
  }

  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      const store = tx.objectStore(STORE)
      store.clear()
      for (const item of items) store.put(item)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // local memory and localStorage remain source of truth if IDB is blocked
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(LS_BACKUP_KEY)
    }
  } catch {
    // ignore
  }
  await persistOfflineQueue([])
}
