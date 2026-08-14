import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteTrade, getAllTrades, getStrategies, putTrade, renameStrategy } from './lib/db'
import type { Strategy, Trade } from './lib/types'
import Home from './views/Home'
import StrategyView from './views/StrategyView'
import TradeForm from './views/TradeForm'
import TradeDetail from './views/TradeDetail'

export type Route =
  | { name: 'home' }
  | { name: 'strategy'; strategyId: string }
  | { name: 'new-trade'; strategyId: string }
  | { name: 'edit-trade'; strategyId: string; tradeId: string }
  | { name: 'trade'; strategyId: string; tradeId: string }

const FADE_OUT_MS = 200

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [leaving, setLeaving] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[] | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const pendingNav = useRef<number | null>(null)

  useEffect(() => {
    getStrategies().then(setStrategies)
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

  const handleRename = useCallback(async (id: string, name: string) => {
    await renameStrategy(id, name)
    setStrategies((prev) => prev?.map((s) => (s.id === id ? { ...s, name } : s)) ?? prev)
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

  if (!strategies) {
    return <div className="min-h-screen" />
  }

  const strategyOf = (id: string) => strategies.find((s) => s.id === id)!
  const tradesOf = (id: string) => trades.filter((t) => t.strategyId === id)

  let view: JSX.Element
  switch (route.name) {
    case 'home':
      view = (
        <Home
          strategies={strategies}
          trades={trades}
          onOpenStrategy={(id) => navigate({ name: 'strategy', strategyId: id })}
          onRename={handleRename}
        />
      )
      break
    case 'strategy':
      view = (
        <StrategyView
          strategy={strategyOf(route.strategyId)}
          trades={tradesOf(route.strategyId)}
          onBack={() => navigate({ name: 'home' })}
          onRename={handleRename}
          onNewTrade={() => navigate({ name: 'new-trade', strategyId: route.strategyId })}
          onOpenTrade={(tradeId) => navigate({ name: 'trade', strategyId: route.strategyId, tradeId })}
        />
      )
      break
    case 'new-trade':
    case 'edit-trade':
      view = (
        <TradeForm
          strategy={strategyOf(route.strategyId)}
          existing={route.name === 'edit-trade' ? trades.find((t) => t.id === route.tradeId) : undefined}
          onCancel={() =>
            route.name === 'edit-trade'
              ? navigate({ name: 'trade', strategyId: route.strategyId, tradeId: route.tradeId })
              : navigate({ name: 'strategy', strategyId: route.strategyId })
          }
          onSave={async (trade) => {
            await handleSaveTrade(trade)
            navigate({ name: 'strategy', strategyId: route.strategyId })
          }}
        />
      )
      break
    case 'trade': {
      const trade = trades.find((t) => t.id === route.tradeId)
      view = trade ? (
        <TradeDetail
          trade={trade}
          strategy={strategyOf(route.strategyId)}
          onBack={() => navigate({ name: 'strategy', strategyId: route.strategyId })}
          onEdit={() => navigate({ name: 'edit-trade', strategyId: route.strategyId, tradeId: trade.id })}
          onDelete={async () => {
            await handleDeleteTrade(trade.id)
            navigate({ name: 'strategy', strategyId: route.strategyId })
          }}
        />
      ) : (
        <div />
      )
      break
    }
  }

  return (
    <div
      key={JSON.stringify(route)}
      className={leaving ? 'animate-view-out' : 'animate-view-in'}
    >
      {view}
    </div>
  )
}
