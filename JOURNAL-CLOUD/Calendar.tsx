import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, NotebookPen, Plus } from 'lucide-react'
import type { Trade } from './types'
import { buildCalendar, computeStats } from './stats'
import { fmtMoney, fmtR, todayIso } from './format'
import { ACCENT } from './colors'

interface Props {
  trades: Trade[]
  onOpenJournal: () => void
  onOpenDay: (iso: string) => void
  onNewTrade: () => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar({ trades, onOpenJournal, onOpenDay, onNewTrade }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const iso = todayIso()

  const weeks = useMemo(() => buildCalendar(year, month, trades, iso), [year, month, trades, iso])
  const monthTrades = useMemo(
    () => trades.filter((t) => t.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)),
    [trades, year, month],
  )
  const stats = computeStats(monthTrades)
  const allTime = computeStats(trades)

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }
  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-5 py-9">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="mb-2 bg-gradient-to-r from-[#22d9ff] via-[#a78bff] to-[#ff6ec7] bg-clip-text text-[11px] font-bold uppercase tracking-[0.3em] text-transparent">
            Malek&rsquo;s Trading Journal
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-bone sm:text-4xl">
            Malek, you are{' '}
            <span className="bg-gradient-to-r from-[#22d9ff] via-[#34f5a8] to-[#31f2a9] bg-clip-text text-transparent">
              profitable!
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenJournal}
            className="inline-flex items-center gap-2 rounded-xl border border-edge px-4 py-2.5 text-sm font-semibold text-mist transition-colors hover:border-edge-lit hover:text-bone"
          >
            <NotebookPen size={15} />
            Journal
          </button>
          <button
            onClick={onNewTrade}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-base transition-all hover:-translate-y-0.5"
            style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}cc` }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Log Trade
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-rise" style={{ animationDelay: '70ms' }}>
        <Stat
          label="Month P&L"
          value={stats.hasPnl ? fmtMoney(stats.totalPnl) : '—'}
          tone={stats.hasPnl ? (stats.totalPnl > 0 ? 'win' : stats.totalPnl < 0 ? 'loss' : 'flat') : 'flat'}
          big
        />
        <Stat
          label="Month Win Rate"
          value={stats.winRate !== null ? `${Math.round(stats.winRate)}%` : '—'}
          sub={stats.count > 0 ? `${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE` : undefined}
          accent
        />
        <Stat
          label="Month Trades"
          value={String(stats.count)}
          sub={stats.hasR ? `${fmtR(stats.totalR)} total` : undefined}
        />
        <Stat
          label="All-Time P&L"
          value={allTime.hasPnl ? fmtMoney(allTime.totalPnl) : '—'}
          tone={allTime.hasPnl ? (allTime.totalPnl > 0 ? 'win' : allTime.totalPnl < 0 ? 'loss' : 'flat') : 'flat'}
          sub={allTime.winRate !== null ? `${Math.round(allTime.winRate)}% win · ${allTime.count} trades` : undefined}
        />
      </div>

      <div className="mb-4 flex items-center justify-between animate-rise" style={{ animationDelay: '120ms' }}>
        <h2 className="font-display text-xl font-semibold tracking-tight text-bone">{monthLabel}</h2>
        <div className="flex items-center gap-1.5">
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-mist transition-colors hover:border-edge-lit hover:text-bone"
            >
              Today
            </button>
          )}
          <button
            onClick={() => shift(-1)}
            className="rounded-lg border border-edge p-2 text-mist transition-colors hover:border-edge-lit hover:text-bone"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => shift(1)}
            className="rounded-lg border border-edge p-2 text-mist transition-colors hover:border-edge-lit hover:text-bone"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        className="overflow-x-auto rounded-2xl border border-edge bg-card p-3 animate-rise"
        style={{ animationDelay: '170ms' }}
      >
        <div className="min-w-[680px]">
          <div className="mb-2 grid grid-cols-[repeat(7,1fr)_104px] gap-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">
                {d}
              </div>
            ))}
            <div className="px-1 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">
              Week
            </div>
          </div>

          <div className="space-y-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-[repeat(7,1fr)_104px] gap-2">
                {week.days.map((cell) => {
                  const positive = cell.hasPnl && cell.pnl > 0
                  const negative = cell.hasPnl && cell.pnl < 0
                  const has = cell.trades.length > 0
                  return (
                    <button
                      key={cell.iso}
                      onClick={() => has && onOpenDay(cell.iso)}
                      disabled={!has}
                      className={`flex h-[84px] flex-col justify-between rounded-xl border p-2 text-left transition-all ${
                        !cell.inMonth
                          ? 'border-edge/30 bg-raise/20 opacity-40'
                          : positive
                            ? 'border-win/55 bg-win/[0.19] hover:border-win/90'
                            : negative
                              ? 'border-loss/55 bg-loss/[0.19] hover:border-loss/90'
                              : has
                                ? 'border-edge-lit bg-raise/70 hover:border-glow'
                                : 'border-edge/60 bg-raise/30'
                      } ${has ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
                    >
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          cell.isToday
                            ? 'inline-flex h-5 w-5 items-center justify-center rounded-full text-base'
                            : cell.inMonth
                              ? 'text-mist'
                              : 'text-mist/50'
                        }`}
                        style={cell.isToday ? { background: ACCENT } : undefined}
                      >
                        {cell.day}
                      </span>
                      {has && (
                        <span className="block">
                          {cell.hasPnl && (
                            <span
                              className={`block font-display text-sm font-bold tabular-nums ${
                                positive ? 'text-win' : negative ? 'text-loss' : 'text-even'
                              }`}
                            >
                              {fmtMoney(cell.pnl)}
                            </span>
                          )}
                          <span className="block text-[11px] text-mist/70">
                            {cell.trades.length} {cell.trades.length === 1 ? 'trade' : 'trades'}
                          </span>
                        </span>
                      )}
                    </button>
                  )
                })}
                <div
                  className={`flex h-[84px] flex-col justify-center rounded-xl border px-2.5 text-right ${
                    week.hasPnl && week.pnl > 0
                      ? 'border-win/35 bg-win/[0.11]'
                      : week.hasPnl && week.pnl < 0
                        ? 'border-loss/35 bg-loss/[0.11]'
                        : 'border-edge/60 bg-raise/30'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist/60">
                    Week {wi + 1}
                  </span>
                  <span
                    className={`font-display text-sm font-bold tabular-nums ${
                      week.hasPnl && week.pnl > 0
                        ? 'text-win'
                        : week.hasPnl && week.pnl < 0
                          ? 'text-loss'
                          : 'text-mist/50'
                    }`}
                  >
                    {week.hasPnl ? fmtMoney(week.pnl) : '—'}
                  </span>
                  <span className="text-[10px] tabular-nums text-mist/50">
                    {week.tradeCount > 0 ? `${week.tradeCount} trades` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-mist/40 animate-rise" style={{ animationDelay: '240ms' }}>
        Private journal · everything stays on this device
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  tone,
  accent,
  big,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'win' | 'loss' | 'flat'
  accent?: boolean
  big?: boolean
}) {
  const color =
    tone === 'win' ? 'text-win' : tone === 'loss' ? 'text-loss' : accent ? '' : 'text-bone'
  return (
    <div className="rounded-2xl border border-edge bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">{label}</p>
      <p
        className={`mt-1 font-display font-semibold tabular-nums ${big ? 'text-2xl' : 'text-xl'} ${color}`}
        style={accent ? { color: ACCENT } : undefined}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs tabular-nums text-mist/60">{sub}</p>}
    </div>
  )
}
