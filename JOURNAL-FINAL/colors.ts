import type { Grade, Outcome } from './types'

/** The journal's single accent color. */
export const ACCENT = '#22d9ff'

export const OUTCOME_META: Record<Outcome, { label: string; text: string; chip: string }> = {
  win: { label: 'Win', text: 'text-win', chip: 'bg-win/15 text-win' },
  loss: { label: 'Loss', text: 'text-loss', chip: 'bg-loss/15 text-loss' },
  be: { label: 'Break Even', text: 'text-even', chip: 'bg-even/15 text-even' },
}

export const GRADE_CHIP: Record<Grade, string> = {
  'A+': 'bg-win/20 text-win',
  A: 'bg-win/15 text-win',
  'B+': 'bg-[#22d9ff]/15 text-[#22d9ff]',
  B: 'bg-[#22d9ff]/12 text-[#7fe6ff]',
  'B-': 'bg-glow/15 text-glow-soft',
  C: 'bg-[#ffb636]/15 text-[#ffb636]',
  F: 'bg-loss/15 text-loss',
}
