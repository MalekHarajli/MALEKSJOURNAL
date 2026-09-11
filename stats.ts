import type { Confluence, Grade, Trade } from './types'
import { GRADES, GRADE_POINTS } from './types'

export interface Stats {
  count: number
  wins: number
  losses: number
  breakevens: number
  winRate: number | null
  totalR: number
  hasR: boolean
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
