import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Camera, Trophy } from 'lucide-react'
import { fetchCommunity, type Trader } from './community'
import type { Trade } from './types'
import { fmtDateShort, fmtMoney, fmtR } from './format'
import { ACCENT, GRADE_CHIP, OUTCOME_META } from './colors'

interface Props {
  myUserId: string
  onBack: () => void
  onOpenTrade: (trade: Trade, labels: Map<string, string>, traderName: string) => void
}

export default function Community({ myUserId, onBack, onOpenTrade }: Props) {
  const [traders, setTraders] = useState<Trader[] | null>(null)
  const [labels, setLabels] = useState<Map<string, string>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCommunity()
      .then((snapshot) => {
        if (cancelled) return
        setTraders(snapshot.traders)
        setLabels(snapshot.labels)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load the community.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const open = useMemo(
    () => traders?.find((t) => t.userId === openId) ?? null,
    [traders, openId],
  )

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10">
      <button
        onClick={() => (open ? setOpenId(null) : onBack())}
        className="mb-8 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-bone"
      >
        <ArrowLeft size={16} />
        {open ? 'All traders' : 'Home'}
      </button>

      {!open && (
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Trophy size={22} style={{ color: ACCENT }} />
            <h1 className="font-display text-3xl font-semibold tracking-tight text-bone">Leaderboard</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist/80">
            Ranked on win rate and profit per trade, scaled by how many trades you&rsquo;ve
            actually journaled — so a long honest record beats one lucky screenshot. Tap anyone
            to study their trades.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-loss/30 bg-loss/[0.07] px-5 py-4 text-sm text-loss">{error}</p>
      )}

      {!error && traders === null && <p className="text-sm text-mist">Loading journals…</p>}

      {!error && traders !== null && !open && (
        traders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-edge bg-card/40 px-6 py-16 text-center">
            <p className="font-display text-lg text-bone/80">No journals yet.</p>
            <p className="mt-2 text-sm text-mist">Log a trade and yours shows up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-edge bg-card">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-edge text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-3 py-3 text-left font-semibold">Trader</th>
                  <th className="px-3 py-3 text-right font-semibold">Score</th>
                  <th className="px-3 py-3 text-right font-semibold">Trades</th>
                  <th className="px-3 py-3 text-right font-semibold">Win</th>
                  <th className="px-3 py-3 text-right font-semibold">Avg R</th>
                  <th className="px-4 py-3 text-right font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody>
                {traders.map((t, i) => (
                  <tr
                    key={t.userId}
                    onClick={() => setOpenId(t.userId)}
                    className={`cursor-pointer border-b border-edge/40 transition-colors last:border-b-0 hover:bg-raise ${
                      t.userId === myUserId ? 'bg-glow/[0.06]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-bold tabular-nums ${
                          i === 0
                            ? 'bg-[#ffb636]/20 text-[#ffb636]'
                            : i === 1
                              ? 'bg-mist/15 text-mist'
                              : i === 2
                                ? 'bg-[#c88a4a]/20 text-[#c88a4a]'
                                : 'text-mist/50'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-bone">
                      {t.name}
                      {t.userId === myUserId && (
                        <span className="ml-2 rounded-md bg-glow/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-glow-soft">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-display font-bold tabular-nums" style={{ color: ACCENT }}>
                      {t.score.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-mist">{t.stats.count}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-bone">
                      {t.stats.winRate !== null ? `${Math.round(t.stats.winRate)}%` : '—'}
                    </td>
                    <td
                      className={`px-3 py-3 text-right tabular-nums ${
                        t.stats.avgR === null
                          ? 'text-mist/40'
                          : t.stats.avgR > 0
                            ? 'text-win'
                            : t.stats.avgR < 0
                              ? 'text-loss'
                              : 'text-even'
                      }`}
                    >
                      {t.stats.avgR !== null ? fmtR(t.stats.avgR) : '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-display font-semibold tabular-nums ${
                        !t.stats.hasPnl
                          ? 'text-mist/40'
                          : t.stats.totalPnl > 0
                            ? 'text-win'
                            : t.stats.totalPnl < 0
                              ? 'text-loss'
                              : 'text-even'
                      }`}
                    >
                      {t.stats.hasPnl ? fmtMoney(t.stats.totalPnl) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {open && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="h-8 w-1.5 rounded-full" style={{ background: ACCENT }} />
            <h1 className="font-display text-3xl font-semibold tracking-tight text-bone">
              {open.name}
              {open.userId === myUserId && <span className="text-mist/60"> (you)</span>}
            </h1>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Block label="Trades" value={String(open.stats.count)} />
            <Block
              label="Win Rate"
              value={open.stats.winRate !== null ? `${Math.round(open.stats.winRate)}%` : '—'}
              sub={`${open.stats.wins}W · ${open.stats.losses}L · ${open.stats.breakevens}BE`}
              accent
            />
            <Block
              label="Total R"
              value={open.stats.hasR ? fmtR(open.stats.totalR) : '—'}
              sub={open.stats.avgR !== null ? `${fmtR(open.stats.avgR)} avg` : undefined}
              tone={open.stats.totalR > 0 ? 'win' : open.stats.totalR < 0 ? 'loss' : undefined}
            />
            <Block label="Avg Grade" value={open.stats.avgGrade ?? '—'} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-edge bg-card">
            <ul>
              {open.trades.map((t) => {
                const meta = OUTCOME_META[t.outcome]
                const names = t.confluences.map((id) => labels.get(id)).filter(Boolean) as string[]
                const shots = ['before', 'during', 'after'].filter(
                  (k) => t.screenshots[k as keyof typeof t.screenshots],
                ).length
                return (
                  <li key={t.id} className="border-b border-edge/60 last:border-b-0">
                    <button
                      onClick={() => onOpenTrade(t, labels, open.name)}
                      className="flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left text-sm transition-colors hover:bg-raise"
                    >
                      <span className="w-20 shrink-0 tabular-nums text-mist">{fmtDateShort(t.date)}</span>
                      <span className="w-10 shrink-0 font-display font-semibold text-bone">{t.instrument}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${meta.chip}`}>{meta.label}</span>
                      {t.grade && (
                        <span className={`rounded-md px-1.5 py-0.5 font-display text-xs font-bold ${GRADE_CHIP[t.grade]}`}>
                          {t.grade}
                        </span>
                      )}
                      {t.rMultiple !== null && (
                        <span
                          className={`tabular-nums ${
                            t.rMultiple > 0 ? 'text-win' : t.rMultiple < 0 ? 'text-loss' : 'text-even'
                          }`}
                        >
                          {fmtR(t.rMultiple)}
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-2">
                        {names.slice(0, 3).map((n) => (
                          <span
                            key={n}
                            className="hidden whitespace-nowrap rounded-md border border-edge bg-raise px-1.5 py-0.5 text-[11px] text-mist sm:inline"
                          >
                            {n}
                          </span>
                        ))}
                        {shots > 0 && (
                          <span className="flex items-center gap-1 text-mist/60">
                            <Camera size={13} />
                            <span className="text-xs tabular-nums">{shots}</span>
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function Block({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  tone?: 'win' | 'loss'
}) {
  return (
    <div className="rounded-2xl border border-edge bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-semibold tabular-nums ${
          tone === 'win' ? 'text-win' : tone === 'loss' ? 'text-loss' : 'text-bone'
        }`}
        style={accent ? { color: ACCENT } : undefined}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs tabular-nums text-mist/60">{sub}</p>}
    </div>
  )
}
