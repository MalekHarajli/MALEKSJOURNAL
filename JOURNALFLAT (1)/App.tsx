import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteConfluence,
  deleteTrade,
  getAllTrades,
  getConfluences,
  getStrategy,
  newId,
  putConfluence,
  putTrade,
  renameStrategy,
} from './db'
import type { Confluence, Strategy, Trade } from './types'
import { normalizeConfluenceLabel } from './types'
import Calendar from './Calendar'
import Journal from './Journal'
import TradeForm from './TradeForm'
import TradeDetail from './TradeDetail'

export type Route =
  | { name: 'home' }
  | { name: 'journal'; date?: string }
  | { name: 'new-trade' }
  | { name: 'edit-trade'; tradeId: string }
  | { name: 'trade'; tradeId: string }

const FADE_OUT_MS = 200

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [leaving, setLeaving] = useState(false)
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [confluences, setConfluences] = useState<Confluence[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const pendingNav = useRef<number | null>(null)

  useEffect(() => {
    getStrategy().then(setStrategy)
    getConfluences().then(setConfluences)
    getAllTrades().then(setTrades)
    return () => {
      if (pendingNav.current !== null) window.clearTimeout(pendingNav.current)
    }
  }, [])

  const navigate = useCallback((next: Route) => {
    if (pendingNav.current !== null) window.clearTimeout(pendingNav.current)
    setLeaving(true)
    pendingNav.current = window.setTimeout(() => {
      pendingNav.current = null
      setRoute(next)
      setLeaving(false)
      window.scrollTo(0, 0)
    }, FADE_OUT_MS)
  }, [])

  const handleRename = useCallback(async (name: string) => {
    await renameStrategy(name)
    setStrategy((prev) => (prev ? { ...prev, name } : prev))
  }, [])

  const handleAddConfluence = useCallback(
    async (raw: string) => {
      const label = normalizeConfluenceLabel(raw)
      if (!label) return
      const added: Confluence = { id: newId(), label, order: confluences.length }
      await putConfluence(added)
      setConfluences((prev) => [...prev, added])
    },
    [confluences.length],
  )

  const handleRenameConfluence = useCallback(
    async (id: string, raw: string) => {
      const label = normalizeConfluenceLabel(raw)
      const current = confluences.find((c) => c.id === id)
      if (!label || !current) return
      const updated: Confluence = { ...current, label }
      await putConfluence(updated)
      setConfluences((prev) => prev.map((c) => (c.id === id ? updated : c)))
    },
    [confluences],
  )

  const handleDeleteConfluence = useCallback(async (id: string) => {
    await deleteConfluence(id)
    setConfluences((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const handleSaveTrade = useCallback(async (trade: Trade) => {
    await putTrade(trade)
    setTrades((prev) => {
      const rest = prev.filter((t) => t.id !== trade.id)
      return [...rest, trade].sort((a, b) =>
        a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date),
      )
    })
  }, [])

  const handleDeleteTrade = useCallback(async (id: string) => {
    await deleteTrade(id)
    setTrades((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (!strategy) {
    return <div className="min-h-screen" />
  }

  let view: JSX.Element
  switch (route.name) {
    case 'home':
      view = (
        <Calendar
          trades={trades}
          onOpenJournal={() => navigate({ name: 'journal' })}
          onOpenDay={(date) => navigate({ name: 'journal', date })}
          onNewTrade={() => navigate({ name: 'new-trade' })}
        />
      )
      break
    case 'journal':
      view = (
        <Journal
          strategy={strategy}
          trades={trades}
          confluences={confluences}
          onBack={() => navigate({ name: 'home' })}
          onRename={handleRename}
          onNewTrade={() => navigate({ name: 'new-trade' })}
          onOpenTrade={(tradeId) => navigate({ name: 'trade', tradeId })}
          onAddConfluence={handleAddConfluence}
          onRenameConfluence={handleRenameConfluence}
          onDeleteConfluence={handleDeleteConfluence}
          dateFilter={route.date}
          onClearFilter={() => navigate({ name: 'journal' })}
        />
      )
      break
    case 'new-trade':
    case 'edit-trade':
      view = (
        <TradeForm
          strategy={strategy}
          confluences={confluences}
          existing={route.name === 'edit-trade' ? trades.find((t) => t.id === route.tradeId) : undefined}
          onCancel={() =>
            route.name === 'edit-trade'
              ? navigate({ name: 'trade', tradeId: route.tradeId })
              : navigate({ name: 'journal' })
          }
          onSave={async (trade) => {
            await handleSaveTrade(trade)
            navigate({ name: 'journal' })
          }}
        />
      )
      break
    case 'trade': {
      const trade = trades.find((t) => t.id === route.tradeId)
      view = trade ? (
        <TradeDetail
          trade={trade}
          strategy={strategy}
          confluences={confluences}
          onBack={() => navigate({ name: 'journal' })}
          onEdit={() => navigate({ name: 'edit-trade', tradeId: trade.id })}
          onDelete={async () => {
            await handleDeleteTrade(trade.id)
            navigate({ name: 'journal' })
          }}
        />
      ) : (
        <div />
      )
      break
    }
  }

  return (
    <div key={JSON.stringify(route)} className={leaving ? 'animate-view-out' : 'animate-view-in'}>
      {view}
    </div>
  )
}
