import { addDays, differenceInCalendarDays, format, getDaysInMonth, parseISO } from 'date-fns'

/** All dates in app state are ISO calendar dates: "2026-11-10". */
export type ISODate = string

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd')
export const fromISO = (s: ISODate): Date => parseISO(s)

export const monthKey = (s: ISODate): string => s.slice(0, 7) // "2026-11"
export const dayOf = (s: ISODate): number => Number(s.slice(8, 10))

export function daysInMonthOf(s: ISODate): number {
  return getDaysInMonth(fromISO(s))
}

export function addDaysISO(s: ISODate, n: number): ISODate {
  return toISO(addDays(fromISO(s), n))
}

export function diffDays(a: ISODate, b: ISODate): number {
  return differenceInCalendarDays(fromISO(a), fromISO(b))
}

/** Same calendar day in the month `offset` months away (clamped to month length). */
export function shiftMonth(s: ISODate, offset: number): ISODate {
  const d = fromISO(s)
  const target = new Date(d.getFullYear(), d.getMonth() + offset, 1)
  const day = Math.min(d.getDate(), getDaysInMonth(target))
  return toISO(new Date(target.getFullYear(), target.getMonth(), day))
}

export function firstOfMonth(s: ISODate): ISODate {
  return `${monthKey(s)}-01`
}

export function withDay(s: ISODate, day: number): ISODate {
  const d = Math.min(day, daysInMonthOf(s))
  return `${monthKey(s)}-${String(d).padStart(2, '0')}`
}

export const fmtDate = (s: ISODate) => format(fromISO(s), 'd MMM')
export const fmtDateLong = (s: ISODate) => format(fromISO(s), 'EEE, d MMM yyyy')
export const fmtMonth = (s: ISODate) => format(fromISO(s), 'MMM')
export const fmtMonthYear = (s: ISODate) => format(fromISO(s), 'MMM yyyy')
export const weekdayIdx = (s: ISODate) => (fromISO(s).getDay() + 6) % 7 // Mon=0

export function relativeDay(s: ISODate, today: ISODate): string {
  const d = diffDays(today, s)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d > 1 && d < 7) return `${d} days ago`
  if (d === -1) return 'Tomorrow'
  if (d < -1) return `In ${-d} days`
  return fmtDate(s)
}

/** Months (rounded up, min 1) from `from` until `to`. */
export function monthsUntil(from: ISODate, to: ISODate): number {
  return Math.max(1, Math.ceil(diffDays(to, from) / 30.4))
}
