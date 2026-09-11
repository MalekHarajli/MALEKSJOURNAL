import { useEffect, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import type { Bias, Confluence, Grade, Instrument, Outcome, ShotPhase, Strategy, Trade } from './types'
import { EMOTIONS, GRADES } from './types'
import { newId } from './db'
import { todayIso } from './format'
import { ACCENT, GRADE_CHIP } from './colors'
import ShotSlot from './ShotSlot'

interface Props {
  strategy: Strategy
  confluences: Confluence[]
  existing?: Trade
  onCancel: () => void
  onSave: (trade: Trade) => void | Promise<void>
}

const PHASES: { key: ShotPhase; label: string; hint: string }[] = [
  { key: 'before', label: 'Before', hint: 'Setup forming' },
  { key: 'during', label: 'During', hint: 'In the trade' },
  { key: 'after', label: 'After', hint: 'Result / close' },
]

export default function TradeForm({ strategy, confluences, existing, onCancel, onSave }: Props) {
  const [date, setDate] = useState(existing?.date ?? todayIso())
  const [instrument, setInstrument] = useState<Instrument>(existing?.instrument ?? 'NQ')
  const [bias, setBias] = useState<Bias>(existing?.bias ?? 'long')
  const [outcome, setOutcome] = useState<Outcome | null>(existing?.outcome ?? null)
  const [grade, setGrade] = useState<Grade | null>(existing?.grade ?? null)
  const [rMultiple, setRMultiple] = useState(
    existing?.rMultiple !== null && existing?.rMultiple !== undefined ? String(existing.rMultiple) : '',
  )
  const [pnl, setPnl] = useState(
    existing?.pnl !== null && existing?.pnl !== undefined ? String(existing.pnl) : '',
  )
  const [picked, setPicked] = useState<string[]>(existing?.confluences ?? [])
  const [emotions, setEmotions] = useState<string[]>(existing?.emotions ?? [])
  const [reasoning, setReasoning] = useState(existing?.reasoning ?? '')
  const [shots, setShots] = useState<Partial<Record<ShotPhase, Blob>>>({ ...existing?.screenshots })
  const [saving, setSaving] = useState(false)

  // Paste a screenshot anywhere on the page — it lands in the first empty slot.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      if (!item) return
      const file = item.getAsFile()
      if (!file) return
      e.preventDefault()
      setShots((prev) => {
        const empty = PHASES.find((p) => !prev[p.key])
        if (!empty) return prev
        return { ...prev, [empty.key]: file }
      })
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value]

  const valid = outcome !== null

  const save = async () => {
    if (!valid || saving) return
    setSaving(true)
    const rNum = parseFloat(rMultiple)
    const pnlNum = parseFloat(pnl)
    await onSave({
      id: existing?.id ?? newId(),
      strategyId: strategy.id,
      date,
      instrument,
      bias,
      outcome: outcome!,
      grade,
      rMultiple: Number.isFinite(rNum) ? rNum : null,
      pnl: Number.isFinite(pnlNum) ? pnlNum : null,
      confluences: picked,
      emotions,
      reasoning: reasoning.trim(),
      screenshots: shots,
      createdAt: existing?.createdAt ?? Date.now(),
    })
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10">
      <button
        onClick={onCancel}
        className="mb-8 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-bone"
      >
        <ArrowLeft size={16} />
        {strategy.name}
      </button>

      <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-bone">
        {existing ? 'Edit Trade' : 'Log Trade'}
      </h1>
      <p className="mb-8 text-sm" style={{ color: ACCENT }}>
        {strategy.name}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="field-label">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
        </div>
        <div>
          <label className="field-label">Symbol</label>
          <div className="flex gap-1 rounded-xl border border-edge bg-raise p-1">
            {(['NQ', 'ES'] as const).map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setInstrument(sym)}
                className={`seg-btn ${instrument === sym ? 'text-base' : 'text-mist hover:text-bone'}`}
                style={instrument === sym ? { background: ACCENT } : undefined}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">Bias</label>
          <div className="flex gap-1 rounded-xl border border-edge bg-raise p-1">
            {(['long', 'short'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBias(b)}
                className={`seg-btn capitalize ${
                  bias === b
                    ? b === 'long'
                      ? 'bg-win/15 text-win'
                      : 'bg-loss/15 text-loss'
                    : 'text-mist hover:text-bone'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone/90">
            Confluences
          </h2>
          <span className="text-xs text-mist/60">
            {picked.length} selected
          </span>
        </div>
        {confluences.length === 0 ? (
          <p className="rounded-xl border border-dashed border-edge bg-raise/40 px-4 py-6 text-center text-sm text-mist/60">
            No confluences yet — add them from the journal page.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {confluences.map((c) => {
              const on = picked.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPicked((prev) => toggle(prev, c.id))}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all ${
                    on ? 'bg-card' : 'border-edge bg-raise/50 hover:border-edge-lit'
                  }`}
                  style={
                    on
                      ? {
                          borderColor: `${ACCENT}88`,
                          boxShadow: `0 6px 20px -10px ${ACCENT}99`,
                          background: `linear-gradient(135deg, ${ACCENT}1c, ${ACCENT}08)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      on ? 'text-base' : 'border-edge-lit text-transparent'
                    }`}
                    style={on ? { background: ACCENT, borderColor: ACCENT } : undefined}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <span className={`text-sm font-semibold ${on ? 'text-bone' : 'text-mist'}`}>{c.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone/90">
          Emotions
        </h2>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => {
            const on = emotions.includes(e)
            return (
              <button
                key={e}
                type="button"
                onClick={() => setEmotions((prev) => toggle(prev, e))}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                  on
                    ? 'border-glow/60 bg-glow/15 text-glow-soft'
                    : 'border-edge bg-raise/50 text-mist hover:border-edge-lit hover:text-bone'
                }`}
              >
                {e}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <label className="field-label">Bias &amp; Reasoning</label>
        <textarea
          rows={4}
          placeholder="What was the draw? Why this direction, why here? Write it like you're explaining the trade to yourself next month."
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          className="field resize-y leading-relaxed"
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone/90">
          Result
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <div className="flex gap-1 rounded-xl border border-edge bg-raise p-1">
              {(
                [
                  { key: 'win', label: 'Win', cls: 'bg-win/15 text-win' },
                  { key: 'be', label: 'Break Even', cls: 'bg-even/15 text-even' },
                  { key: 'loss', label: 'Loss', cls: 'bg-loss/15 text-loss' },
                ] as const
              ).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setOutcome(o.key)}
                  className={`seg-btn py-2.5 ${outcome === o.key ? o.cls : 'text-mist hover:text-bone'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <input
              type="number"
              step="1"
              placeholder="P&L $"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              className="field h-full tabular-nums"
            />
          </div>
          <div>
            <input
              type="number"
              step="0.1"
              placeholder="R (optional)"
              value={rMultiple}
              onChange={(e) => setRMultiple(e.target.value)}
              className="field h-full tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone/90">
            Your Grade
          </h2>
          {grade && (
            <button
              type="button"
              onClick={() => setGrade(null)}
              className="text-xs text-mist/60 transition-colors hover:text-bone"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => {
            const on = grade === g
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`min-w-[58px] rounded-xl border px-4 py-2.5 font-display text-base font-bold transition-all ${
                  on ? `border-transparent ${GRADE_CHIP[g]}` : 'border-edge bg-raise/50 text-mist hover:border-edge-lit hover:text-bone'
                }`}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone/90">
            Screenshots
          </h2>
          <span className="text-xs text-mist/60">Paste (Ctrl+V), drag in, or click</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PHASES.map((p) => (
            <ShotSlot
              key={p.key}
              label={p.label}
              hint={p.hint}
              blob={shots[p.key]}
              onChange={(blob) =>
                setShots((prev) => {
                  const next = { ...prev }
                  if (blob) next[p.key] = blob
                  else delete next[p.key]
                  return next
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-edge pt-6">
        <p className="text-xs text-mist/60">{valid ? '' : 'Pick a result to save.'}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-edge px-5 py-2.5 text-sm font-semibold text-mist transition-colors hover:border-edge-lit hover:text-bone"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!valid || saving}
            className="rounded-xl px-6 py-2.5 text-sm font-bold text-base transition-all hover:-translate-y-0.5
              disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}cc` }}
          >
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Save Trade'}
          </button>
        </div>
      </div>
    </div>
  )
}
