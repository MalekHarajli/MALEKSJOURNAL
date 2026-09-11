import { ArrowRight } from 'lucide-react'
import type { Trade } from './types'
import { computeStats } from './stats'
import { fmtR } from './format'
import { ACCENT } from './colors'

interface Props {
  trades: Trade[]
  onOpen: () => void
}

export default function Home({ trades, onOpen }: Props) {
  const stats = computeStats(trades)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
      <p className="mb-3 bg-gradient-to-r from-[#22d9ff] via-[#a78bff] to-[#ff6ec7] bg-clip-text text-[11px] font-bold uppercase tracking-[0.3em] text-transparent animate-rise">
        Malek&rsquo;s Trading Journal
      </p>
      <h1
        className="font-display text-4xl font-bold uppercase tracking-tight text-bone animate-rise sm:text-5xl"
        style={{ animationDelay: '70ms' }}
      >
        Malek, you are{' '}
        <span className="bg-gradient-to-r from-[#22d9ff] via-[#34f5a8] to-[#31f2a9] bg-clip-text text-transparent">
          profitable!
        </span>
      </h1>
      <p className="mt-3 text-sm text-mist animate-rise" style={{ animationDelay: '140ms' }}>
        {today} &nbsp;·&nbsp; NQ / ES Futures
      </p>

      <button
        onClick={onOpen}
        className="group mt-10 inline-flex items-center gap-3 rounded-2xl px-8 py-4 font-display text-base font-bold
          text-base transition-all hover:-translate-y-1 focus:outline-none animate-rise"
        style={{
          animationDelay: '210ms',
          background: `linear-gradient(120deg, ${ACCENT}, #34f5a8)`,
          boxShadow: `0 18px 44px -16px ${ACCENT}b3`,
        }}
      >
        Open Journal
        <ArrowRight size={18} strokeWidth={2.6} className="transition-transform group-hover:translate-x-1" />
      </button>

      {stats.count > 0 && (
        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm animate-rise"
          style={{ animationDelay: '280ms' }}
        >
          <Quick label="Trades" value={String(stats.count)} />
          {stats.winRate !== null && (
            <Quick label="Win Rate" value={`${Math.round(stats.winRate)}%`} accent />
          )}
          {stats.hasR && (
            <Quick
              label="Total R"
              value={fmtR(stats.totalR)}
              className={stats.totalR > 0 ? 'text-win' : stats.totalR < 0 ? 'text-loss' : 'text-even'}
            />
          )}
          {stats.avgGrade && <Quick label="Avg Grade" value={stats.avgGrade} />}
        </div>
      )}

      <p className="mt-14 text-xs text-mist/40 animate-rise" style={{ animationDelay: '360ms' }}>
        Private journal · everything stays on this device
      </p>
    </div>
  )
}

function Quick({
  label,
  value,
  accent,
  className,
}: {
  label: string
  value: string
  accent?: boolean
  className?: string
}) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">{label}</span>
      <span
        className={`font-display text-lg font-semibold tabular-nums ${className ?? 'text-bone'}`}
        style={accent ? { color: ACCENT } : undefined}
      >
        {value}
      </span>
    </span>
  )
}
