import { supabase } from './supabase'
import type { Confluence, Trade } from './types'
import { computeStats, type Stats } from './stats'

export interface Trader {
  userId: string
  name: string
  trades: Trade[]
  stats: Stats
  score: number
}

/**
 * One number from three: how often they win, how much they make per trade,
 * and how many trades they have actually journaled.
 *
 * The sample factor is the important part — it stops someone with a single
 * lucky trade from topping a board full of people with real track records.
 * It reaches half credit at 10 trades and keeps climbing from there.
 */
export function scoreOf(stats: Stats): number {
  if (stats.count === 0) return 0

  const sample = stats.count / (stats.count + 10)
  const winPart = stats.winRate ?? 0

  // Average R is the fair way to compare traders on different account sizes.
  // Where nobody logged R, fall back to dollars earned per trade.
  let edge: number
  if (stats.avgR !== null) {
    edge = 50 + stats.avgR * 25
  } else if (stats.hasPnl) {
    edge = 50 + (stats.totalPnl / stats.count / 250) * 25
  } else {
    edge = 50
  }
  const edgePart = Math.max(0, Math.min(100, edge))

  return (winPart * 0.45 + edgePart * 0.55) * sample
}

interface Snapshot {
  traders: Trader[]
  /** Confluence labels from every account, so other people's tags render. */
  labels: Map<string, string>
}

/**
 * Everyone's journals in one pass. Fine for a community of this size; if it
 * ever grows, this is the thing to paginate.
 */
export async function fetchCommunity(): Promise<Snapshot> {
  const [tradesRes, profilesRes, confluencesRes] = await Promise.all([
    supabase.from('trades').select('*').order('trade_date', { ascending: false }),
    supabase.from('trader_profiles').select('user_id, display_name'),
    supabase.from('confluences').select('id, label'),
  ])

  if (tradesRes.error) throw new Error(tradesRes.error.message)

  const names = new Map<string, string>()
  for (const p of (profilesRes.data ?? []) as { user_id: string; display_name: string }[]) {
    names.set(p.user_id, p.display_name)
  }

  const labels = new Map<string, string>()
  for (const c of (confluencesRes.data ?? []) as Confluence[]) {
    labels.set(c.id, c.label)
  }

  const byUser = new Map<string, Trade[]>()
  for (const row of tradesRes.data as Record<string, unknown>[]) {
    const userId = String(row.user_id)
    const trade: Trade = {
      id: String(row.id),
      userId,
      strategyId: 's1',
      date: String(row.trade_date),
      instrument: row.instrument as Trade['instrument'],
      bias: row.bias as Trade['bias'],
      outcome: row.outcome as Trade['outcome'],
      grade: (row.grade as Trade['grade']) ?? null,
      rMultiple: row.r_multiple === null ? null : Number(row.r_multiple),
      pnl: row.pnl === null ? null : Number(row.pnl),
      confluences: (row.confluences as string[]) ?? [],
      emotions: (row.emotions as string[]) ?? [],
      reasoning: (row.reasoning as string) ?? '',
      screenshots: (row.screenshots as Trade['screenshots']) ?? {},
      createdAt: new Date(String(row.created_at)).getTime(),
    }
    const list = byUser.get(userId)
    if (list) list.push(trade)
    else byUser.set(userId, [trade])
  }

  const traders: Trader[] = [...byUser.entries()]
    .map(([userId, trades]) => ({
      userId,
      name: names.get(userId) ?? 'Trader',
      trades,
      stats: computeStats(trades),
      score: 0,
    }))
    .map((t) => ({ ...t, score: scoreOf(t.stats) }))
    .sort((a, b) => b.score - a.score)

  return { traders, labels }
}
