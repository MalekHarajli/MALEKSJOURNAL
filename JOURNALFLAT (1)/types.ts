export type Instrument = 'NQ' | 'ES'
export type Bias = 'long' | 'short'
export type Outcome = 'win' | 'loss' | 'be'
export type ShotPhase = 'before' | 'during' | 'after'

export interface Strategy {
  id: string
  name: string
  order: number
}

export interface Confluence {
  id: string
  label: string
  order: number
}

export const GRADES = ['A+', 'A', 'B+', 'B', 'B-', 'C', 'F'] as const
export type Grade = (typeof GRADES)[number]

export const GRADE_POINTS: Record<Grade, number> = {
  'A+': 4.3,
  A: 4.0,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  C: 2.0,
  F: 0,
}

export interface Trade {
  id: string
  strategyId: string
  date: string // yyyy-mm-dd
  instrument: Instrument
  bias: Bias
  outcome: Outcome
  grade: Grade | null
  rMultiple: number | null
  pnl: number | null
  confluences: string[] // Confluence ids
  emotions: string[]
  reasoning: string
  screenshots: Partial<Record<ShotPhase, Blob>>
  createdAt: number
}

export const DEFAULT_CONFLUENCES: Confluence[] = [
  { id: 'c1', label: 'CISD', order: 0 },
  { id: 'c2', label: 'OTE', order: 1 },
  { id: 'c3', label: 'Rejection Block', order: 2 },
  { id: 'c4', label: '10AM', order: 3 },
  { id: 'c5', label: 'True Day Open', order: 4 },
  { id: 'c6', label: 'Midnight Open', order: 5 },
  { id: 'c7', label: 'HTF FVG', order: 6 },
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

// Short words are abbreviations and stay fully capitalized (CISD, OTE, HTF FVG,
// 10AM); longer words get title case (Rejection Block, True Day Open).
export function normalizeConfluenceLabel(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) =>
      word.length <= 4 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ')
}
