const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** ₹12,345 (Indian digit grouping). Negative values keep their sign. */
export function rupees(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}₹${inr.format(Math.round(Math.abs(n)))}`
}

/** ₹1.2k style for chart axes. */
export function rupeesShort(n: number): string {
  const a = Math.abs(n)
  if (a >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (a >= 1000) return `₹${(n / 1000).toFixed(a >= 10000 ? 0 : 1)}k`
  return `₹${Math.round(n)}`
}

export function pct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}

/** Round to the nearest multiple of `step`. */
export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
