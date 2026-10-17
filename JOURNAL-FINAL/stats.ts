import type { Confluence, Grade, Trade } from './types'
import { GRADES, GRADE_POINTS } from './types'
import { isoOf } from './format'

export interface Stats {
  count: number
  wins: number
  losses: number
  breakevens: number
  winRate: number | null
  totalR: number
  hasR: boolean
  totalPnl: number
  hasPnl: boolean
  avgR: number | null
  avgGrade: Grade | null
  gradeCounts: { grade: Grade; count: number }[]
}

export function computeStats(trades: Trade[]): Stats {
  let wins = 0
  let losses = 0
  let breakevens = 0
  let rSum = 0
  let rCount = 0
  let pnlSum = 0
  let pnlCount = 0
  let gradePoints = 0
  let gradeCount = 0
  const byGrade = new Map<Grade, number>()

  for (const t of trades) {
    if (t.outcome === 'win') wins++
    else if (t.outcome === 'loss') losses++
    else breakevens++

    if (t.rMultiple !== null && !Number.isNaN(t.rMultiple)) {
      rSum += t.rMultiple
      rCount++
    }
    if (t.pnl !== null && !Number.isNaN(t.pnl)) {
      pnlSum += t.pnl
      pnlCount++
    }
    if (t.grade) {
      gradePoints += GRADE_POINTS[t.grade]
      gradeCount++
      byGrade.set(t.grade, (byGrade.get(t.grade) ?? 0) + 1)
    }
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
    totalPnl: pnlSum,
    hasPnl: pnlCount > 0,
    avgR: rCount > 0 ? rSum / rCount : null,
    avgGrade: gradeCount > 0 ? nearestGrade(gradePoints / gradeCount) : null,
    gradeCounts: GRADES.filter((g) => byGrade.has(g)).map((g) => ({ grade: g, count: byGrade.get(g)! })),
  }
}

function nearestGrade(points: number): Grade {
  let best: Grade = GRADES[0]
  let bestGap = Infinity
  for (const g of GRADES) {
    const gap = Math.abs(GRADE_POINTS[g] - points)
    if (gap < bestGap) {
      bestGap = gap
      best = g
    }
  }
  return best
}

export interface ConfluenceRow {
  id: string
  label: string
  withCount: number
  withWinRate: number | null
  withAvgR: number | null
  withoutCount: number
  withoutWinRate: number | null
}

/** Win rate when a confluence was present vs. when it was missing. */
export function confluenceBreakdown(trades: Trade[], confluences: Confluence[]): ConfluenceRow[] {
  return confluences.map((c) => {
    const withIt = trades.filter((t) => t.confluences.includes(c.id))
    const without = trades.filter((t) => !t.confluences.includes(c.id))
    const a = computeStats(withIt)
    const b = computeStats(without)
    return {
      id: c.id,
      label: c.label,
      withCount: withIt.length,
      withWinRate: a.winRate,
      withAvgR: a.avgR,
      withoutCount: without.length,
      withoutWinRate: b.winRate,
    }
  })
}

export interface DayCell {
  iso: string
  day: number
  inMonth: boolean
  isToday: boolean
  trades: Trade[]
  pnl: number
  hasPnl: boolean
}

export interface WeekRow {
  days: DayCell[]
  pnl: number
  hasPnl: boolean
  tradeCount: number
}

/** Six-week grid for a month, Sunday-first, with each week's P&L totalled. */
export function buildCalendar(year: number, month: number, trades: Trade[], todayIsoStr: string): WeekRow[] {
  const byDate = new Map<string, Trade[]>()
  for (const t of trades) {
    const list = byDate.get(t.date)
    if (list) list.push(t)
    else byDate.set(t.date, [t])
  }

  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const weeks: WeekRow[] = []

  for (let w = 0; w < 6; w++) {
    const days: DayCell[] = []
    let pnl = 0
    let hasPnl = false
    let tradeCount = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)
      const iso = isoOf(date.getFullYear(), date.getMonth(), date.getDate())
      const dayTrades = byDate.get(iso) ?? []
      const withPnl = dayTrades.filter((t) => t.pnl !== null && !Number.isNaN(t.pnl))
      const dayPnl = withPnl.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
      const inMonth = date.getMonth() === month
      if (inMonth) {
        tradeCount += dayTrades.length
        if (withPnl.length > 0) {
          pnl += dayPnl
          hasPnl = true
        }
      }
      days.push({
        iso,
        day: date.getDate(),
        inMonth,
        isToday: iso === todayIsoStr,
        trades: dayTrades,
        pnl: dayPnl,
        hasPnl: withPnl.length > 0,
      })
    }
    weeks.push({ days, pnl, hasPnl, tradeCount })
  }

  // Drop a trailing week that belongs entirely to the next month.
  while (weeks.length > 4 && weeks[weeks.length - 1].days.every((d) => !d.inMonth)) weeks.pop()
  return weeks
}
