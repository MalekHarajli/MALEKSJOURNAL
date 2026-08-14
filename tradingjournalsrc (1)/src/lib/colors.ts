import type { Outcome } from './types'

// Per-strategy accent colors — bright, distinct, used for tints, glows, and buttons.
const STRATEGY_COLORS: Record<string, string> = {
  s1: '#22d9ff', // cyan
  s2: '#a78bff', // violet
  s3: '#ffb636', // amber
  s4: '#34f5a8', // mint
}

export function strategyColor(id: string): string {
  return STRATEGY_COLORS[id] ?? '#8b96ff'
}

export const OUTCOME_META: Record<Outcome, { label: string; text: string; chip: string }> = {
  win: { label: 'Win', text: 'text-win', chip: 'bg-win/15 text-win' },
  loss: { label: 'Loss', text: 'text-loss', chip: 'bg-loss/15 text-loss' },
  be: { label: 'Break Even', text: 'text-even', chip: 'bg-even/15 text-even' },
}
