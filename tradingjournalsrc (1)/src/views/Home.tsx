import type { Strategy, Trade } from '../lib/types'
import { computeStats } from '../lib/stats'
import { greeting, fmtR } from '../lib/format'
import { strategyColor } from '../lib/colors'

interface Props {
  strategies: Strategy[]
  trades: Trade[]
  onOpenStrategy: (id: string) => void
  onRename: (id: string, name: string) => void
}

export default function Home({ strategies, trades, onOpenStrategy }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14">
      <header className="mb-12 text-center animate-rise">
        <p className="mb-3 bg-gradient-to-r from-[#22d9ff] via-[#a78bff] to-[#ff6ec7] bg-clip-text text-[11px] font-bold uppercase tracking-[0.3em] text-transparent">
          Malek&rsquo;s Trading Journal
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-bone sm:text-5xl">
          {greeting()}, Malek.
        </h1>
        <p className="mt-3 text-sm text-mist">
          {today} &nbsp;·&nbsp; NQ / ES Futures
        </p>
      </header>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {strategies.map((s, i) => {
          const stats = computeStats(trades.filter((t) => t.strategyId === s.id))
          const color = strategyColor(s.id)
          return (
            <button
              key={s.id}
              onClick={() => onOpenStrategy(s.id)}
              className="group relative overflow-hidden rounded-2xl border p-6 text-left
                transition-all duration-300 hover:-translate-y-1 focus:outline-none animate-rise"
              style={{
                animationDelay: `${90 + i * 70}ms`,
                borderColor: `${color}40`,
                background: `linear-gradient(140deg, ${color}1f 0%, ${color}0a 34%, #1b1f40 72%)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${color}90`
                e.currentTarget.style.boxShadow = `0 20px 52px -18px ${color}73`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${color}40`
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />
              <div className="mb-7 flex items-start justify-between">
                <span className="font-display text-xs font-bold tracking-[0.2em]" style={{ color }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-xs text-mist/70">
                  {stats.count === 0 ? 'No trades yet' : `${stats.count} trade${stats.count === 1 ? '' : 's'}`}
                </span>
              </div>
              <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-bone">
                {s.name}
              </h2>
              <div className="mt-4 flex items-baseline gap-4 text-sm">
                {stats.count > 0 ? (
                  <>
                    {stats.winRate !== null && (
                      <span className="font-display text-base font-semibold tabular-nums" style={{ color }}>
                        {Math.round(stats.winRate)}% win
                      </span>
                    )}
                    {stats.hasR && (
                      <span
                        className={`font-display font-semibold tabular-nums ${
                          stats.totalR > 0 ? 'text-win' : stats.totalR < 0 ? 'text-loss' : 'text-even'
                        }`}
                      >
                        {fmtR(stats.totalR)}
                      </span>
                    )}
                    <span className="tabular-nums text-mist/80">
                      {stats.wins}W · {stats.losses}L
                    </span>
                  </>
                ) : (
                  <span className="text-mist/50">Open to start logging</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-14 text-xs text-mist/40 animate-rise" style={{ animationDelay: '440ms' }}>
        Private journal · everything stays on this device
      </p>
    </div>
  )
}
