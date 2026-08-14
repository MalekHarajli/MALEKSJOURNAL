import { useEffect, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import type { Bias, ChecklistKey, Instrument, Outcome, ShotPhase, Strategy, Trade } from '../lib/types'
import { CHECKLIST_ITEMS, EMOTIONS } from '../lib/types'
import { newId } from '../lib/db'
import { todayIso } from '../lib/format'
import { strategyColor } from '../lib/colors'
import ShotSlot from '../components/ShotSlot'

interface Props {
  strategy: Strategy
  existing?: Trade
  onCancel: () => void
  onSave: (trade: Trade) => void | Promise<void>
}

const PHASES: { key: ShotPhase; label: string; hint: string }[] = [
  { key: 'before', label: 'Before', hint: 'Setup forming' },
  { key: 'during', label: 'During', hint: 'In the trade' },
  { key: 'after', label: 'After', hint: 'Result / close' },
]

const EMPTY_CHECKLIST: Record<ChecklistKey, boolean> = { dol: false, psl: false, lrl: false }

export default function TradeForm({ strategy, existing, onCancel, onSave }: Props) {
  const color = strategyColor(strategy.id)
  const [date, setDate] = useState(existing?.date ?? todayIso())
  const [instrument, setInstrument] = useState<Instrument>(existing?.instrument ?? 'NQ')
  const [bias, setBias] = useState<Bias>(existing?.bias ?? 'long')
  const [outcome, setOutcome] = useState<Outcome | null>(existing?.outcome ?? null)
  const [rMultiple, setRMultiple] = useState(
    existing?.rMultiple !== null && existing?.rMultiple !== undefined ? String(existing.rMultiple) : '',
  )
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    ...EMPTY_CHECKLIST,
    ...existing?.checklist,
  })
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

  const toggleEmotion = (e: string) =>
    setEmotions((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))

  const valid = outcome !== null

  const save = async () => {
    if (!valid || saving) return
    setSaving(true)
    const rNum = parseFloat(rMultiple)
    await onSave({
      id: existing?.id ?? newId(),
      strategyId: strategy.id,
      date,
      instrument,
      bias,
      outcome: outcome!,
      rMultiple: Number.isFinite(rNum) ? rNum : null,
      checklist,
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
      <p className="mb-8 text-sm" style={{ color }}>
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
                style={instrument === sym ? { background: color } : undefined}
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
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone/90">
          Checklist
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CHECKLIST_ITEMS.map((c) => {
            const on = checklist[c.key]
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setChecklist((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                  on ? 'bg-card' : 'border-edge bg-raise/50 hover:border-edge-lit'
                }`}
                style={
                  on
                    ? {
                        borderColor: `${color}88`,
                        boxShadow: `0 6px 20px -10px ${color}66`,
                        background: `linear-gradient(135deg, ${color}1c, ${color}08)`,
                      }
                    : undefined
                }
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all ${
                    on ? 'text-base' : 'border-edge-lit text-transparent'
                  }`}
                  style={on ? { background: color, borderColor: color } : undefined}
                >
                  <Check size={15} strokeWidth={3} />
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${on ? 'text-bone' : 'text-mist'}`}>
                    {c.label}
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-mist/50">{c.short}</span>
                </span>
              </button>
            )
          })}
        </div>
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
                onClick={() => toggleEmotion(e)}
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
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          <div className="col-span-3">
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
          <div className="col-span-3 sm:col-span-1">
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
            style={{ background: color, boxShadow: `0 8px 24px -8px ${color}80` }}
          >
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Save Trade'}
          </button>
        </div>
      </div>
    </div>
  )
}
