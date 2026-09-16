import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import {
  addConfluence,
  deleteConfluence as deleteConfluenceRow,
  fetchConfluences,
  fetchStrategy,
  fetchTrades,
  removeAllTrades,
  removeTrade,
  renameConfluence,
  saveStrategyName,
  saveTrade,
} from './cloud'
import type { Confluence, ShotPhase, Strategy, Trade } from './types'
import { normalizeConfluenceLabel } from './types'
import Auth from './Auth'
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
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [leaving, setLeaving] = useState(false)
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [confluences, setConfluences] = useState<Confluence[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const pendingNav = useRef<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => {
      sub.subscription.unsubscribe()
      if (pendingNav.current !== null) window.clearTimeout(pendingNav.current)
    }
  }, [])

  // Load the account's journal once signed in.
  useEffect(() => {
    if (!session) {
      setStrategy(null)
      setConfluences([])
      setTrades([])
      return
    }
    let cancelled = false
    setLoadError(null)
    Promise.all([fetchStrategy(), fetchConfluences(), fetchTrades()])
      .then(([s, c, t]) => {
        if (cancelled) return
        setStrategy(s)
        setConfluences(c)
        setTrades(t)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Could not load your journal.')
      })
    return () => {
      cancelled = true
    }
  }, [session])

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
    await saveStrategyName(name)
    setStrategy((prev) => (prev ? { ...prev, name } : prev))
  }, [])

  const handleAddConfluence = useCallback(
    async (raw: string) => {
      const label = normalizeConfluenceLabel(raw)
      if (!label) return
      const added = await addConfluence(label, confluences.length)
      setConfluences((prev) => [...prev, added])
    },
    [confluences.length],
  )

  const handleRenameConfluence = useCallback(async (id: string, raw: string) => {
    const label = normalizeConfluenceLabel(raw)
    if (!label) return
    await renameConfluence(id, label)
    setConfluences((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)))
  }, [])

  const handleDeleteConfluence = useCallback(async (id: string) => {
    await deleteConfluenceRow(id)
    setConfluences((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const handleSaveTrade = useCallback(
    async (trade: Trade, pending: Partial<Record<ShotPhase, File>>) => {
      const saved = await saveTrade(trade, pending)
      setTrades((prev) => {
        const rest = prev.filter((t) => t.id !== saved.id)
        return [...rest, saved].sort((a, b) =>
          a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date),
        )
      })
    },
    [],
  )

  const handleDeleteTrade = useCallback(async (trade: Trade) => {
    await removeTrade(trade)
    setTrades((prev) => prev.filter((t) => t.id !== trade.id))
  }, [])

  const handleClearTrades = useCallback(async () => {
    await removeAllTrades(trades)
    setTrades([])
  }, [trades])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setRoute({ name: 'home' })
  }, [])

  if (!authReady) return <div className="min-h-screen" />
  if (!session) return <Auth />

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <p className="font-display text-lg text-bone">Could not load your journal.</p>
        <p className="mt-2 max-w-md text-sm text-mist">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl border border-edge px-5 py-2.5 text-sm font-semibold text-mist transition-colors hover:border-edge-lit hover:text-bone"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!strategy) return <div className="min-h-screen" />

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
          onClearTrades={handleClearTrades}
          email={session.user.email ?? ''}
          onSignOut={handleSignOut}
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
          onSave={async (trade, pending) => {
            await handleSaveTrade(trade, pending)
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
            await handleDeleteTrade(trade)
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
