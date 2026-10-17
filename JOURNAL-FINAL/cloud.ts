import { SHOTS_BUCKET, supabase } from './supabase'
import type { Bias, Confluence, Grade, Instrument, Outcome, ShotPhase, Strategy, Trade } from './types'
import { DEFAULT_CONFLUENCES } from './types'

const PHASES: ShotPhase[] = ['before', 'during', 'after']
const DEFAULT_STRATEGY_NAME = 'My Strategy'

interface TradeRow {
  id: string
  user_id: string
  trade_date: string
  instrument: string
  bias: string
  outcome: string
  grade: string | null
  r_multiple: number | string | null
  pnl: number | string | null
  confluences: string[] | null
  emotions: string[] | null
  reasoning: string | null
  screenshots: Partial<Record<ShotPhase, string>> | null
  created_at: string
}

function num(v: number | string | null): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : null
}

function rowToTrade(r: TradeRow): Trade {
  return {
    id: r.id,
    strategyId: 's1',
    date: r.trade_date,
    instrument: r.instrument as Instrument,
    bias: r.bias as Bias,
    outcome: r.outcome as Outcome,
    grade: (r.grade as Grade) ?? null,
    rMultiple: num(r.r_multiple),
    pnl: num(r.pnl),
    confluences: r.confluences ?? [],
    emotions: r.emotions ?? [],
    reasoning: r.reasoning ?? '',
    screenshots: r.screenshots ?? {},
    createdAt: new Date(r.created_at).getTime(),
  }
}

export async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not signed in.')
  return data.user.id
}

/** "malek.harajli@gmail.com" -> "Malek", used until someone sets a real name. */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const first = local.split(/[._+\-0-9]/).filter(Boolean)[0] ?? local
  if (!first) return 'Trader'
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

// ------------------------------------------------------------------ trades

export async function fetchTrades(): Promise<Trade[]> {
  // Everyone can read every trade so the leaderboard works, which means this
  // has to ask for its own rows explicitly rather than leaning on the policy.
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as TradeRow[]).map(rowToTrade)
}

/**
 * Upload any newly-picked screenshots, then insert or update the trade.
 * `pending` holds Files for slots the user just chose; existing slots already
 * hold a storage path and are left alone.
 */
export async function saveTrade(
  trade: Trade,
  pending: Partial<Record<ShotPhase, File>>,
): Promise<Trade> {
  const userId = await currentUserId()
  const screenshots: Partial<Record<ShotPhase, string>> = { ...trade.screenshots }

  for (const phase of PHASES) {
    const file = pending[phase]
    if (!file) continue
    const ext = file.type === 'image/jpeg' ? 'jpg' : 'png'
    const path = `${userId}/${trade.id}/${phase}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from(SHOTS_BUCKET)
      .upload(path, file, { contentType: file.type || 'image/png', upsert: true })
    if (error) throw new Error(`Screenshot upload failed: ${error.message}`)
    const previous = trade.screenshots[phase]
    if (previous) await supabase.storage.from(SHOTS_BUCKET).remove([previous])
    screenshots[phase] = path
  }

  const row = {
    id: trade.id,
    user_id: userId,
    trade_date: trade.date,
    instrument: trade.instrument,
    bias: trade.bias,
    outcome: trade.outcome,
    grade: trade.grade,
    r_multiple: trade.rMultiple,
    pnl: trade.pnl,
    confluences: trade.confluences,
    emotions: trade.emotions,
    reasoning: trade.reasoning,
    screenshots,
  }

  const { data, error } = await supabase.from('trades').upsert(row).select().single()
  if (error) throw new Error(error.message)
  return rowToTrade(data as TradeRow)
}

export async function removeTrade(trade: Trade): Promise<void> {
  const paths = PHASES.map((p) => trade.screenshots[p]).filter(Boolean) as string[]
  if (paths.length > 0) await supabase.storage.from(SHOTS_BUCKET).remove(paths)
  const { error } = await supabase.from('trades').delete().eq('id', trade.id)
  if (error) throw new Error(error.message)
}

export async function removeAllTrades(trades: Trade[]): Promise<void> {
  const paths = trades.flatMap((t) => PHASES.map((p) => t.screenshots[p]).filter(Boolean) as string[])
  if (paths.length > 0) await supabase.storage.from(SHOTS_BUCKET).remove(paths)
  const userId = await currentUserId()
  const { error } = await supabase.from('trades').delete().eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/** Download a screenshot for display. Returns null if it is missing. */
export async function fetchShot(path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage.from(SHOTS_BUCKET).download(path)
  if (error) return null
  return data
}

// ------------------------------------------------------------ confluences

export async function fetchConfluences(): Promise<Confluence[]> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('confluences')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)

  const rows = data as { id: string; label: string; sort_order: number }[]
  if (rows.length === 0) return seedConfluences()
  return rows.map((r) => ({ id: r.id, label: r.label, order: r.sort_order }))
}

/** A brand-new account starts with Malek's usual list rather than nothing. */
async function seedConfluences(): Promise<Confluence[]> {
  const userId = await currentUserId()
  const rows = DEFAULT_CONFLUENCES.map((c) => ({
    user_id: userId,
    label: c.label,
    sort_order: c.order,
  }))
  const { error } = await supabase
    .from('confluences')
    .upsert(rows, { onConflict: 'user_id,label', ignoreDuplicates: true })
  if (error) throw new Error(error.message)

  // Read them back rather than trusting the insert's return: a concurrent
  // first load may have seeded some of these already.
  const { data, error: readError } = await supabase
    .from('confluences')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  if (readError) throw new Error(readError.message)
  return (data as { id: string; label: string; sort_order: number }[]).map((r) => ({
    id: r.id,
    label: r.label,
    order: r.sort_order,
  }))
}

export async function addConfluence(label: string, order: number): Promise<Confluence> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('confluences')
    .insert({ user_id: userId, label, sort_order: order })
    .select()
    .single()
  if (error) throw new Error(error.message)
  const r = data as { id: string; label: string; sort_order: number }
  return { id: r.id, label: r.label, order: r.sort_order }
}

export async function renameConfluence(id: string, label: string): Promise<void> {
  const { error } = await supabase.from('confluences').update({ label }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteConfluence(id: string): Promise<void> {
  const { error } = await supabase.from('confluences').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --------------------------------------------------------------- settings

export interface Settings {
  strategy: Strategy
  displayName: string
  /** False when settings holds no name yet, so App can save one. */
  hasStoredName: boolean
  discordTag: string | null
}

export async function fetchSettings(): Promise<Settings> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Not signed in.')

  const { data, error } = await supabase
    .from('settings')
    .select('strategy_name, display_name, discord_tag')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)

  // Sign-up puts the chosen name on the account itself, which is the only
  // copy that survives confirming the email on a different device.
  const stored = data?.display_name?.trim() ?? ''
  const meta = String(user.user_metadata?.display_name ?? '').trim()
  const metaDiscord = user.user_metadata?.discord_tag
  return {
    strategy: { id: 's1', name: data?.strategy_name ?? DEFAULT_STRATEGY_NAME, order: 0 },
    displayName: stored || meta || nameFromEmail(user.email ?? ''),
    hasStoredName: stored.length > 0,
    discordTag: data?.discord_tag ?? (metaDiscord ? String(metaDiscord) : null),
  }
}

export async function saveDisplayName(name: string): Promise<void> {
  const userId = await currentUserId()
  const { error } = await supabase.from('settings').upsert({ user_id: userId, display_name: name })
  if (error) throw new Error(error.message)
}

/**
 * Store the details taken at sign-up. Called once the session is live, so
 * the row-level security check on settings cannot reject it.
 */
export async function saveProfile(name: string, discord: string | null): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Not signed in.')
  const { error } = await supabase.from('settings').upsert({
    user_id: user.id,
    email: user.email ?? null,
    display_name: name,
    discord_tag: discord,
  })
  if (error) throw new Error(error.message)
}

export async function saveStrategyName(name: string): Promise<void> {
  const userId = await currentUserId()
  const { error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, strategy_name: name })
  if (error) throw new Error(error.message)
}

// ------------------------------------------------------------- migration

/** Move trades exported from the old browser-only journal into the account. */
export async function importTrades(
  trades: Trade[],
  blobs: Map<string, Partial<Record<ShotPhase, Blob>>>,
): Promise<number> {
  let saved = 0
  for (const trade of trades) {
    const pending: Partial<Record<ShotPhase, File>> = {}
    const shots = blobs.get(trade.id)
    if (shots) {
      for (const phase of PHASES) {
        const blob = shots[phase]
        if (blob) pending[phase] = new File([blob], `${phase}.png`, { type: blob.type || 'image/png' })
      }
    }
    await saveTrade({ ...trade, screenshots: {} }, pending)
    saved++
  }
  return saved
}
