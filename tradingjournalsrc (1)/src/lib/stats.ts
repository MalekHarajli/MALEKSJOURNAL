import type { Trade } from './types'
import { checksCount, CHECKLIST_ITEMS } from './types'

export interface StrategyStats {
  count: number
  wins: number
  losses: number
  breakevens: number
  winRate: number | null
  totalR: number
  hasR: boolean
  avgR: number | null
  aPlusRate: number | null // % of trades with the full checklist
}

export function computeStats(trades: Trade[]): StrategyStats {
  let wins = 0
  let losses = 0
  let breakevens = 0
  let rSum = 0
  let rCount = 0
  let aPlus = 0
  for (const t of trades) {
    if (t.outcome === 'win') wins++
    else if (t.outcome === 'loss') losses++
    else breakevens++
    if (t.rMultiple !== null && !Number.isNaN(t.rMultiple)) {
      rSum += t.rMultiple
      rCount++
    }
    if (checksCount(t) === CHECKLIST_ITEMS.length) aPlus++
  }
  const decided = wins + losses
  return {
    count: trades.length,
    wins,
    losses,
    breakevens,
    winRate: decided > 0 ? (wins / decided) * 100 : null,
    totalR: rSum,
    hasR: rCount > 0,
    avgR: rCount > 0 ? rSum / rCount : null,
    aPlusRate: trades.length > 0 ? (aPlus / trades.length) * 100 : null,
  }
}
