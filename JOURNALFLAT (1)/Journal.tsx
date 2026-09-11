import { useState, type ReactNode } from 'react'
import { ArrowLeft, Camera, Check, ChevronDown, Pencil, Plus, Settings2, Trash2, X } from 'lucide-react'
import type { Confluence, Strategy, Trade } from './types'
import { computeStats, confluenceBreakdown } from './stats'
import { fmtDate, fmtDateShort, fmtMoney, fmtR } from './format'
import { ACCENT, GRADE_CHIP, OUTCOME_META } from './colors'

interface Props {
  strategy: Strategy
  trades: Trade[]
  confluences: Confluence[]
  onBack: () => void
  onRename: (name: string) => void
  onNewTrade: () => void
  onOpenTrade: (tradeId: string) => void
  onAddConfluence: (label: string) => void
  onRenameConfluence: (id: string, label: string) => void
  onDeleteConfluence: (id: string) => void
  dateFilter?: string
  onClearFilter?: () => void
}

export default function Journal({
  strategy,
  trades,
  confluences,
  onBack,
  onRename,
  onNewTrade,
  onOpenTrade,
  onAddConfluence,
  onRenameConfluence,
  onDeleteConfluence,
  dateFilter,
  onClearFilter,
}: Props) {
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(strategy.name)
  const [managing, setManaging] = useState(false)
  const shown = dateFilter ? trades.filter((t) => t.date === dateFilter) : trades
  const stats = computeStats(shown)
  const rows = confluenceBreakdown(trades, confluences)
  const labelOf = new Map(confluences.map((c) => [c.id, c.label]))

  const commitName = () => {
    const name = draftName.trim()
    if (name && name !== strategy.name) onRename(name)
    else setDraftName(strategy.name)
    setEditingName(false)
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-bone"
      >
        <ArrowLeft size={16} />
        Home
      </button>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full" style={{ background: ACCENT }} />
          {editingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                commitName()
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitName}
                className="field w-72 font-display text-2xl font-semibold"
                maxLength={40}
              />
              <button type="submit" className="rounded-lg border border-edge p-2 text-glow hover:border-glow">
                <Check size={16} />
              </button>
            </form>
          ) : (
            <>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-bone">{strategy.name}</h1>
              <button
                onClick={() => {
                  setDraftName(strategy.name)
                  setEditingName(true)
                }}
                className="rounded-lg p-1.5 text-mist/50 transition-colors hover:text-bone"
                title="Rename strategy"
              >
                <Pencil size={15} />
              </button>
            </>
          )}
        </div>
        <button
          onClick={onNewTrade}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-base transition-all hover:-translate-y-0.5"
          style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}cc` }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Log Trade
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Trades" value={String(stats.count)} />
        <StatBlock
          label="Win Rate"
          value={stats.winRate !== null ? <span style={{ color: ACCENT }}>{Math.round(stats.winRate)}%</span> : '—'}
          sub={stats.count > 0 ? `${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE` : undefined}
        />
        <StatBlock
          label="P&L"
          value={
            stats.hasPnl ? (
              <span
                className={stats.totalPnl > 0 ? 'text-win' : stats.totalPnl < 0 ? 'text-loss' : 'text-even'}
              >
                {fmtMoney(stats.totalPnl)}
              </span>
            ) : (
              '—'
            )
          }
          sub={stats.hasR ? `${fmtR(stats.totalR)} · ${fmtR(stats.avgR ?? 0)} avg` : undefined}
        />
        <StatBlock
          label="Avg Grade"
          value={stats.avgGrade ?? '—'}
          sub={
            stats.gradeCounts.length > 0
              ? stats.gradeCounts.map((g) => `${g.count}×${g.grade}`).join('  ')
              : undefined
          }
        />
      </div>

      {dateFilter && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-edge bg-raise/60 px-4 py-2.5">
          <span className="text-sm text-mist">
            Showing <span className="font-semibold text-bone">{fmtDate(dateFilter)}</span>
          </span>
          <button
            onClick={onClearFilter}
            className="text-xs font-semibold text-mist transition-colors hover:text-bone"
          >
            Show all trades
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge bg-card/40 px-6 py-16 text-center">
          <p className="font-display text-lg text-bone/80">No trades logged yet.</p>
          <p className="mt-2 text-sm text-mist">
            Hit <span style={{ color: ACCENT }}>Log Trade</span> after your next setup.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-edge bg-card">
            <div className="hidden grid-cols-[86px_52px_58px_92px_74px_50px_66px_1fr_54px] gap-3 border-b border-edge px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70 sm:grid">
              <span>Date</span>
              <span>Sym</span>
              <span>Bias</span>
              <span>Outcome</span>
              <span className="text-right">P&L</span>
              <span className="text-right">R</span>
              <span className="text-center">Grade</span>
              <span className="text-right">Confluences</span>
              <span className="text-right">Shots</span>
            </div>
            <ul>
              {shown.map((t) => {
                const meta = OUTCOME_META[t.outcome]
                const shots = ['before', 'during', 'after'].filter(
                  (k) => t.screenshots[k as keyof typeof t.screenshots],
                ).length
                const names = t.confluences.map((id) => labelOf.get(id)).filter(Boolean) as string[]
                return (
                  <li key={t.id} className="border-b border-edge/60 last:border-b-0">
                    <button
                      onClick={() => onOpenTrade(t.id)}
                      className="grid w-full grid-cols-2 items-center gap-3 px-5 py-3.5 text-left text-sm transition-colors
                        hover:bg-raise sm:grid-cols-[86px_52px_58px_92px_74px_50px_66px_1fr_54px]"
                    >
                      <span className="tabular-nums text-mist">{fmtDateShort(t.date)}</span>
                      <span className="font-display font-semibold text-bone">{t.instrument}</span>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          t.bias === 'long' ? 'text-win/90' : 'text-loss/90'
                        }`}
                      >
                        {t.bias}
                      </span>
                      <span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${meta.chip}`}>{meta.label}</span>
                      </span>
                      <span
                        className={`hidden tabular-nums sm:block sm:text-right ${
                          t.pnl === null
                            ? 'text-mist/40'
                            : t.pnl > 0
                              ? 'text-win'
                              : t.pnl < 0
                                ? 'text-loss'
                                : 'text-even'
                        }`}
                      >
                        {t.pnl !== null ? fmtMoney(t.pnl) : '—'}
                      </span>
                      <span
                        className={`hidden tabular-nums sm:block sm:text-right ${
                          t.rMultiple === null
                            ? 'text-mist/40'
                            : t.rMultiple > 0
                              ? 'text-win'
                              : t.rMultiple < 0
                                ? 'text-loss'
                                : 'text-even'
                        }`}
                      >
                        {t.rMultiple !== null ? fmtR(t.rMultiple) : '—'}
                      </span>
                      <span className="hidden text-center sm:block">
                        {t.grade ? (
                          <span className={`rounded-md px-1.5 py-0.5 font-display text-xs font-bold ${GRADE_CHIP[t.grade]}`}>
                            {t.grade}
                          </span>
                        ) : (
                          <span className="text-mist/40">—</span>
                        )}
                      </span>
                      <span className="hidden justify-end gap-1 overflow-hidden sm:flex">
                        {names.length === 0 ? (
                          <span className="text-xs text-mist/40">none</span>
                        ) : (
                          <>
                            {names.slice(0, 2).map((n) => (
                              <span
                                key={n}
                                className="whitespace-nowrap rounded-md border border-edge bg-raise px-1.5 py-0.5 text-[11px] text-mist"
                              >
                                {n}
                              </span>
                            ))}
                            {names.length > 2 && (
                              <span className="whitespace-nowrap text-[11px] text-mist/60">
                                +{names.length - 2}
                              </span>
                            )}
                          </>
                        )}
                      </span>
                      <span className="hidden items-center justify-end gap-1.5 text-mist/60 sm:flex">
                        {shots > 0 && (
                          <>
                            <Camera size={13} />
                            <span className="tabular-nums text-xs">{shots}/3</span>
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {rows.some((r) => r.withCount > 0) && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-edge bg-card">
              <div className="border-b border-edge px-5 py-3.5">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone/90">
                  Confluence Performance
                </h2>
                <p className="mt-1 text-xs text-mist/70">
                  Win rate when you had it, versus when you didn&rsquo;t.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-sm">
                  <thead>
                    <tr className="border-b border-edge/60 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">
                      <th className="px-5 py-2.5 text-left font-semibold">Confluence</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Trades</th>
                      <th className="px-3 py-2.5 text-right font-semibold">With</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Without</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Avg R</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-edge/40 last:border-b-0">
                        <td className="px-5 py-2.5 font-medium text-bone">{r.label}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-mist">{r.withCount}</td>
                        <td className="px-3 py-2.5 text-right font-display font-semibold tabular-nums">
                          {r.withWinRate !== null ? (
                            <span style={{ color: ACCENT }}>{Math.round(r.withWinRate)}%</span>
                          ) : (
                            <span className="text-mist/40">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-mist">
                          {r.withoutWinRate !== null ? `${Math.round(r.withoutWinRate)}%` : '—'}
                        </td>
                        <td
                          className={`px-5 py-2.5 text-right tabular-nums ${
                            r.withAvgR === null
                              ? 'text-mist/40'
                              : r.withAvgR > 0
                                ? 'text-win'
                                : r.withAvgR < 0
                                  ? 'text-loss'
                                  : 'text-even'
                          }`}
                        >
                          {r.withAvgR !== null ? fmtR(r.withAvgR) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8">
        <button
          onClick={() => setManaging((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-bone"
        >
          <Settings2 size={15} />
          Edit confluences
          <ChevronDown size={15} className={`transition-transform ${managing ? 'rotate-180' : ''}`} />
        </button>
        {managing && (
          <ConfluenceManager
            confluences={confluences}
            onAdd={onAddConfluence}
            onRename={onRenameConfluence}
            onDelete={onDeleteConfluence}
          />
        )}
      </div>
    </div>
  )
}

function ConfluenceManager({
  confluences,
  onAdd,
  onRename,
  onDelete,
}: {
  confluences: Confluence[]
  onAdd: (label: string) => void
  onRename: (id: string, label: string) => void
  onDelete: (id: string) => void
}) {
  const [adding, setAdding] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const commitEdit = (id: string) => {
    const label = draft.trim()
    if (label) onRename(id, label)
    setEditingId(null)
  }

  return (
    <div className="mt-4 rounded-2xl border border-edge bg-card p-5 animate-view-in">
      <ul className="mb-4 space-y-2">
        {confluences.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            {editingId === c.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  commitEdit(c.id)
                }}
                className="flex flex-1 items-center gap-2"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitEdit(c.id)}
                  className="field flex-1 py-2"
                  maxLength={30}
                />
                <button type="submit" className="rounded-lg border border-edge p-2 text-glow hover:border-glow">
                  <Check size={15} />
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1 rounded-xl border border-edge bg-raise px-3.5 py-2 text-sm font-medium text-bone">
                  {c.label}
                </span>
                <button
                  onClick={() => {
                    setDraft(c.label)
                    setEditingId(c.id)
                  }}
                  className="rounded-lg border border-edge p-2 text-mist transition-colors hover:border-edge-lit hover:text-bone"
                  title="Rename"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="rounded-lg border border-edge p-2 text-mist transition-colors hover:border-loss/50 hover:text-loss"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const label = adding.trim()
          if (!label) return
          onAdd(label)
          setAdding('')
        }}
        className="flex items-center gap-2"
      >
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          placeholder="Add a confluence — short ones stay capitalized (SMT, BPR)"
          className="field flex-1 py-2"
          maxLength={30}
        />
        <button
          type="submit"
          disabled={!adding.trim()}
          className="rounded-xl px-4 py-2 text-sm font-bold text-base transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: ACCENT }}
        >
          Add
        </button>
      </form>
      {confluences.length === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-mist/60">
          <X size={12} /> No confluences yet — add the ones you look for.
        </p>
      )}
    </div>
  )
}

function StatBlock({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-edge bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-bone">{value}</p>
      {sub && <p className="mt-0.5 text-xs tabular-nums text-mist/60">{sub}</p>}
    </div>
  )
}
