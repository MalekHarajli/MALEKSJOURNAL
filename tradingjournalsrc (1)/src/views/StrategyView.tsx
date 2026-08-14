import { useState, type ReactNode } from 'react'
import { ArrowLeft, Camera, Check, Pencil, Plus } from 'lucide-react'
import type { Strategy, Trade } from '../lib/types'
import { CHECKLIST_ITEMS, checksCount } from '../lib/types'
import { computeStats } from '../lib/stats'
import { fmtDateShort, fmtR } from '../lib/format'
import { OUTCOME_META, strategyColor } from '../lib/colors'

interface Props {
  strategy: Strategy
  trades: Trade[]
  onBack: () => void
  onRename: (id: string, name: string) => void
  onNewTrade: () => void
  onOpenTrade: (tradeId: string) => void
}

export default function StrategyView({ strategy, trades, onBack, onRename, onNewTrade, onOpenTrade }: Props) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(strategy.name)
  const stats = computeStats(trades)
  const color = strategyColor(strategy.id)

  const commitName = () => {
    const name = draftName.trim()
    if (name && name !== strategy.name) onRename(strategy.id, name)
    else setDraftName(strategy.name)
    setEditing(false)
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-bone"
      >
        <ArrowLeft size={16} />
        Strategies
      </button>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full" style={{ background: color }} />
          {editing ? (
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
                  setEditing(true)
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
          style={{ background: color, boxShadow: `0 8px 24px -8px ${color}80` }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Log Trade
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Trades" value={String(stats.count)} />
        <StatBlock
          label="Win Rate"
          value={
            stats.winRate !== null ? (
              <span style={{ color }}>{Math.round(stats.winRate)}%</span>
            ) : (
              '—'
            )
          }
          sub={stats.count > 0 ? `${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE` : undefined}
        />
        <StatBlock
          label="Total R"
          value={
            stats.hasR ? (
              <span className={stats.totalR > 0 ? 'text-win' : stats.totalR < 0 ? 'text-loss' : 'text-even'}>
                {fmtR(stats.totalR)}
              </span>
            ) : (
              '—'
            )
          }
          sub={stats.avgR !== null ? `${fmtR(stats.avgR)} avg` : undefined}
        />
        <StatBlock
          label="A+ Setups"
          value={stats.aPlusRate !== null ? `${Math.round(stats.aPlusRate)}%` : '—'}
          sub={stats.count > 0 ? 'full checklist' : undefined}
        />
      </div>

      {trades.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge bg-card/40 px-6 py-16 text-center">
          <p className="font-display text-lg text-bone/80">No trades logged yet.</p>
          <p className="mt-2 text-sm text-mist">
            Hit <span style={{ color }}>Log Trade</span> after your next setup.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-edge bg-card">
          <div className="hidden grid-cols-[90px_60px_70px_110px_70px_1fr_70px] gap-3 border-b border-edge px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70 sm:grid">
            <span>Date</span>
            <span>Symbol</span>
            <span>Bias</span>
            <span>Outcome</span>
            <span className="text-right">R</span>
            <span className="text-right">Checklist</span>
            <span className="text-right">Shots</span>
          </div>
          <ul>
            {trades.map((t) => {
              const meta = OUTCOME_META[t.outcome]
              const checks = checksCount(t)
              const shots = ['before', 'during', 'after'].filter(
                (k) => t.screenshots[k as keyof typeof t.screenshots],
              ).length
              return (
                <li key={t.id} className="border-b border-edge/60 last:border-b-0">
                  <button
                    onClick={() => onOpenTrade(t.id)}
                    className="grid w-full grid-cols-2 items-center gap-3 px-5 py-3.5 text-left text-sm transition-colors
                      hover:bg-raise sm:grid-cols-[90px_60px_70px_110px_70px_1fr_70px]"
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
                    <span className="hidden items-center justify-end gap-1.5 sm:flex">
                      {CHECKLIST_ITEMS.map((c) => (
                        <span
                          key={c.key}
                          title={c.label}
                          className={`inline-block h-2 w-2 rounded-full ${
                            t.checklist[c.key] ? '' : 'bg-edge'
                          }`}
                          style={t.checklist[c.key] ? { background: color } : undefined}
                        />
                      ))}
                      <span className="ml-1 text-xs tabular-nums text-mist/60">{checks}/3</span>
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
