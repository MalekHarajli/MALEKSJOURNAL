import type { Strategy, Trade } from './types'

const DB_NAME = 'malek-journal'
const DB_VERSION = 1

const DEFAULT_STRATEGIES: Strategy[] = [
  { id: 's1', name: 'NYAM Judas Swing', order: 0 },
  { id: 's2', name: 'Rejection Block Reversals', order: 1 },
  { id: 's3', name: 'First Continuation After Reversal', order: 2 },
  { id: 's4', name: 'Rebalance to Unfilled Gaps (LR)', order: 3 },
]

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

export async function getStrategies(): Promise<Strategy[]> {
  const db = await openDb()
  const existing = await reqResult(
    db.transaction('strategies').objectStore('strategies').getAll() as IDBRequest<Strategy[]>,
  )
  if (existing.length === 0) {
    const tx = db.transaction('strategies', 'readwrite')
    for (const s of DEFAULT_STRATEGIES) tx.objectStore('strategies').put(s)
    await txDone(tx)
    return [...DEFAULT_STRATEGIES]
  }
  return existing.sort((a, b) => a.order - b.order)
}

export async function renameStrategy(id: string, name: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('strategies', 'readwrite')
  const store = tx.objectStore('strategies')
  const current = await reqResult(store.get(id) as IDBRequest<Strategy | undefined>)
  if (current) store.put({ ...current, name })
  await txDone(tx)
}

export async function getAllTrades(): Promise<Trade[]> {
  const db = await openDb()
  const trades = await reqResult(
    db.transaction('trades').objectStore('trades').getAll() as IDBRequest<Trade[]>,
  )
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
