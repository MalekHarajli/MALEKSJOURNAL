export type Instrument = 'NQ' | 'ES'
export type Bias = 'long' | 'short'
export type Outcome = 'win' | 'loss' | 'be'
export type ShotPhase = 'before' | 'during' | 'after'
export type ChecklistKey = 'dol' | 'psl' | 'lrl'

export interface Strategy {
  id: string
  name: string
  order: number
}

export interface Trade {
  id: string
  strategyId: string
  date: string // yyyy-mm-dd
  instrument: Instrument
  bias: Bias
  outcome: Outcome
  rMultiple: number | null
  checklist: Record<ChecklistKey, boolean>
  emotions: string[]
  reasoning: string
  screenshots: Partial<Record<ShotPhase, Blob>>
  createdAt: number
}

export const CHECKLIST_ITEMS: { key: ChecklistKey; label: string; short: string }[] = [
  { key: 'dol', label: 'Draw on Liquidity', short: 'DOL' },
  { key: 'psl', label: 'Protected Stop Loss', short: 'PSL' },
  { key: 'lrl', label: 'LRL', short: 'LRL' },
]

export const EMOTIONS = [
  'Calm',
  'Confident',
  'Patient',
  'Neutral',
  'Anxious',
  'Hesitant',
  'FOMO',
  'Rushed',
  'Revenge',
] as const

export function checksCount(t: Trade): number {
  return CHECKLIST_ITEMS.filter((c) => t.checklist[c.key]).length
}
