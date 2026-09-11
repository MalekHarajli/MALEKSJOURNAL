import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react'
import type { Confluence, ShotPhase, Strategy, Trade } from './types'
import { fmtDate, fmtMoney, fmtR } from './format'
import { ACCENT, GRADE_CHIP, OUTCOME_META } from './colors'
import { useObjectUrl } from './useObjectUrl'

interface Props {
  trade: Trade
  strategy: Strategy
  confluences: Confluence[]
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

const PHASES: { key: ShotPhase; label: string }[] = [
  { key: 'before', label: 'Before' },
  { key: 'during', label: 'During' },
  { key: 'after', label: 'After' },
]

export default function TradeDetail({ trade, strategy, confluences, onBack, onEdit, onDelete }: Props) {
  const [lightbox, setLightbox] = useState<ShotPhase | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const meta = OUTCOME_META[trade.outcome]
  const labelOf = new Map(confluences.map((c) => [c.id, c.label]))
  const picked = trade.confluences.map((id) => labelOf.get(id)).filter(Boolean) as string[]

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-bone"
      >
        <ArrowLeft size={16} />
        {strategy.name}
      </button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <span className={`rounded-md px-2.5 py-1 text-sm font-bold ${meta.chip}`}>{meta.label}</span>
            {trade.grade && (
              <span className={`rounded-md px-2.5 py-1 font-display text-sm font-bold ${GRADE_CHIP[trade.grade]}`}>
                {trade.grade}
              </span>
            )}
            {trade.pnl !== null && (
              <span
                className={`rounded-md px-2.5 py-1 font-display text-sm font-bold tabular-nums ${
                  trade.pnl > 0
                    ? 'bg-win/15 text-win'
                    : trade.pnl < 0
                      ? 'bg-loss/15 text-loss'
                      : 'bg-even/15 text-even'
                }`}
              >
                {fmtMoney(trade.pnl)}
              </span>
            )}
            {trade.rMultiple !== null && (
              <span
                className={`rounded-md px-2 py-1 font-display text-sm font-bold tabular-nums ${
                  trade.rMultiple > 0
                    ? 'bg-win/10 text-win'
                    : trade.rMultiple < 0
                      ? 'bg-loss/10 text-loss'
                      : 'bg-even/10 text-even'
                }`}
              >
                {fmtR(trade.rMultiple)}
              </span>
            )}
            <span className="rounded-md border border-edge bg-raise px-2 py-0.5 font-display text-sm font-semibold text-bone">
              {trade.instrument}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                trade.bias === 'long' ? 'bg-win/10 text-win' : 'bg-loss/10 text-loss'
              }`}
            >
              {trade.bias} bias
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-bone">{fmtDate(trade.date)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-edge px-4 py-2 text-sm font-semibold text-mist transition-colors hover:border-edge-lit hover:text-bone"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            onBlur={() => setConfirmDelete(false)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              confirmDelete
                ? 'border-loss/50 bg-loss/10 text-loss'
                : 'border-edge text-mist hover:border-loss/40 hover:text-loss'
            }`}
          >
            <Trash2 size={14} />
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel label="Confluences">
          {picked.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {picked.map((label) => (
                <span
                  key={label}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold"
                  style={{
                    color: ACCENT,
                    background: `${ACCENT}1f`,
                    border: `1px solid ${ACCENT}4d`,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-mist/50">None checked.</p>
          )}
        </Panel>
        <Panel label="Emotions">
          {trade.emotions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trade.emotions.map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-glow/40 bg-glow/10 px-3 py-1 text-sm font-medium text-glow-soft"
                >
                  {e}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-mist/50">None logged.</p>
          )}
        </Panel>
      </div>

      {trade.reasoning && (
        <div className="mb-8">
          <Panel label="Bias & Reasoning">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-bone/90">{trade.reasoning}</p>
          </Panel>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PHASES.map((p) => (
          <Shot key={p.key} label={p.label} blob={trade.screenshots[p.key]} onOpen={() => setLightbox(p.key)} />
        ))}
      </div>

      {lightbox && trade.screenshots[lightbox] && (
        <Lightbox
          blob={trade.screenshots[lightbox]!}
          label={PHASES.find((p) => p.key === lightbox)!.label}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="h-full rounded-2xl border border-edge bg-card px-5 py-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">{label}</p>
      {children}
    </div>
  )
}

function Shot({ label, blob, onOpen }: { label: string; blob: Blob | undefined; onOpen: () => void }) {
  const url = useObjectUrl(blob)
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">{label}</p>
      {url ? (
        <button
          onClick={onOpen}
          className="block w-full overflow-hidden rounded-xl border border-edge transition-all hover:-translate-y-0.5"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${ACCENT}88`
            e.currentTarget.style.boxShadow = `0 12px 32px -12px ${ACCENT}73`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = ''
            e.currentTarget.style.boxShadow = ''
          }}
        >
          <img src={url} alt={`${label} screenshot`} className="aspect-video w-full object-cover" />
        </button>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-edge bg-raise/40 text-xs text-mist/40">
          No screenshot
        </div>
      )}
    </div>
  )
}

function Lightbox({ blob, label, onClose }: { blob: Blob; label: string; onClose: () => void }) {
  const url = useObjectUrl(blob)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/95 p-6 backdrop-blur-sm animate-view-in"
      onClick={onClose}
    >
      <button
        className="absolute right-5 top-5 rounded-full border border-edge bg-card p-2.5 text-mist transition-colors hover:text-bone"
        onClick={onClose}
      >
        <X size={18} />
      </button>
      <div className="max-h-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
          {label}
        </p>
        {url && (
          <img
            src={url}
            alt={`${label} screenshot`}
            className="max-h-[85vh] w-auto rounded-xl border border-edge object-contain"
          />
        )}
      </div>
    </div>
  )
}
