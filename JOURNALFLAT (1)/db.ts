import type { Confluence, Strategy, Trade } from './types'
import { DEFAULT_CONFLUENCES } from './types'

const DB_NAME = 'malek-journal'
const DB_VERSION = 2

export const STRATEGY_ID = 's1'
const DEFAULT_STRATEGY: Strategy = { id: STRATEGY_ID, name: 'Malek Strategy', order: 0 }

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('trades')) {
        const trades = db.createObjectStore('trades', { keyPath: 'id' })
        trades.createIndex('strategyId', 'strategyId')
      }
      if (!db.objectStoreNames.contains('strategies')) {
        db.createObjectStore('strategies', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('confluences')) {
        db.createObjectStore('confluences', { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function reqResult<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** The journal tracks a single strategy; older saves with several are collapsed into it. */
export async function getStrategy(): Promise<Strategy> {
  const db = await openDb()
  const existing = await reqResult(
    db.transaction('strategies').objectStore('strategies').getAll() as IDBRequest<Strategy[]>,
  )
  const kept = existing.find((s) => s.id === STRATEGY_ID)
  if (kept && existing.length === 1) return kept

  const strategy: Strategy = kept ?? DEFAULT_STRATEGY
  const tx = db.transaction('strategies', 'readwrite')
  const store = tx.objectStore('strategies')
  for (const s of existing) {
    if (s.id !== STRATEGY_ID) store.delete(s.id)
  }
  store.put(strategy)
  await txDone(tx)
  return strategy
}

export async function renameStrategy(name: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('strategies', 'readwrite')
  const store = tx.objectStore('strategies')
  const current = await reqResult(store.get(STRATEGY_ID) as IDBRequest<Strategy | undefined>)
  store.put({ ...(current ?? DEFAULT_STRATEGY), name })
  await txDone(tx)
}

export async function getConfluences(): Promise<Confluence[]> {
  const db = await openDb()
  const existing = await reqResult(
    db.transaction('confluences').objectStore('confluences').getAll() as IDBRequest<Confluence[]>,
  )
  if (existing.length === 0) {
    const tx = db.transaction('confluences', 'readwrite')
    for (const c of DEFAULT_CONFLUENCES) tx.objectStore('confluences').put(c)
    await txDone(tx)
    return [...DEFAULT_CONFLUENCES]
  }
  return existing.sort((a, b) => a.order - b.order)
}

export async function putConfluence(confluence: Confluence): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('confluences', 'readwrite')
  tx.objectStore('confluences').put(confluence)
  await txDone(tx)
}

export async function deleteConfluence(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('confluences', 'readwrite')
  tx.objectStore('confluences').delete(id)
  await txDone(tx)
}

export async function getAllTrades(): Promise<Trade[]> {
  const db = await openDb()
  const trades = await reqResult(
    db.transaction('trades').objectStore('trades').getAll() as IDBRequest<Trade[]>,
  )

  // Trades saved before the app collapsed to one strategy, or before confluences
  // and grades existed, are brought forward so nothing logged is ever lost.
  const migrated = trades.filter((t) => t.strategyId !== STRATEGY_ID || !Array.isArray(t.confluences) || t.pnl === undefined)
  if (migrated.length > 0) {
    const tx = db.transaction('trades', 'readwrite')
    const store = tx.objectStore('trades')
    for (const t of migrated) {
      t.strategyId = STRATEGY_ID
      if (!Array.isArray(t.confluences)) t.confluences = []
      if (t.grade === undefined) t.grade = null
      if (t.pnl === undefined) t.pnl = null
      store.put(t)
    }
    await txDone(tx)
  }

  return trades.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date)))
}

export async function putTrade(trade: Trade): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('trades', 'readwrite')
  tx.objectStore('trades').put(trade)
  await txDone(tx)
}

export async function deleteTrade(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('trades', 'readwrite')
  tx.objectStore('trades').delete(id)
  await txDone(tx)
}

export function newId(): string {
  return crypto.randomUUID()
}
