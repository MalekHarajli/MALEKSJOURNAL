export function fmtR(n: number): string {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(Math.abs(n * 10) % 1 > 0 ? 2 : 1)
  return n > 0 ? `+${s}R` : `${s}R`
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtDateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function fmtMoney(n: number): string {
  const body = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(Math.abs(n))
  return n < 0 ? `-${body}` : n > 0 ? `+${body}` : body
}

export function isoOf(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month + 1)}-${pad(day)}`
}
