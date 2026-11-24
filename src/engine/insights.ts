import { fmtMonth, monthKey, shiftMonth, withDay, type ISODate } from '@/lib/date'
import { sum } from '@/lib/format'
import { JAR_META, SPEND_JARS, TYPICAL_MONTHLY } from '@/data/catalog'
import type { JarId, ProfileState, Transaction } from '@/data/types'
import { inRange, monthToDate } from './money'

function byTag(txns: Transaction[]): Map<string, { amount: number; jarId: JarId }> {
  const m = new Map<string, { amount: number; jarId: JarId }>()
  for (const t of txns) {
    if (t.kind !== 'expense') continue
    const cur = m.get(t.tag) ?? { amount: 0, jarId: t.jarId }
    cur.amount += t.amount
    m.set(t.tag, cur)
  }
  return m
}

const TIPS_UP: Record<string, string> = {
  'Food Delivery': 'Consider cooking more meals at home',
  'Eating Out': 'Try a potluck instead of one café visit',
  'Snacks & Chai': 'Small spends add up — set a weekly snack cap',
  'Cabs & Autos': 'Metro or bus could save a lot here',
  'Parties & Outings': 'Plan outings in advance and set a limit',
  Shopping: 'Try the 30-day rule before buying',
  Subscriptions: 'Share a family plan or pause one',
  'Movies & Events': 'Look for student discounts and weekday shows',
}

export interface CategoryChange {
  tag: string
  jarId: JarId
  thisMonth: number
  lastMonth: number
  change: number // fraction, +0.33 = +33%
  note: string
}

/** Month-to-date vs the same days of last month, per sub-category. */
export function categoryPerformance(p: ProfileState, date: ISODate = p.demoDate): CategoryChange[] {
  const lastDate = shiftMonth(date, -1)
  const cur = byTag(monthToDate(p, date))
  const prev = byTag(monthToDate(p, lastDate))
  const tags = new Set([...cur.keys(), ...prev.keys()])
  const rows: CategoryChange[] = []
  for (const tag of tags) {
    const a = cur.get(tag)?.amount ?? 0
    const b = prev.get(tag)?.amount ?? 0
    const jarId = (cur.get(tag) ?? prev.get(tag))!.jarId
    if (JAR_META[jarId].type === 'fixed') continue
    if (Math.max(a, b) < 150 || b === 0) continue
    const change = (a - b) / b
    if (Math.abs(change) < 0.1) continue
    rows.push({
      tag,
      jarId,
      thisMonth: a,
      lastMonth: b,
      change,
      note: change > 0 ? TIPS_UP[tag] ?? 'Higher than usual — keep an eye on it' : change < -0.25 ? 'Great job — well below last month!' : "You're staying on budget",
    })
  }
  return rows.sort((x, y) => Math.abs(y.change) * Math.max(y.thisMonth, y.lastMonth) - Math.abs(x.change) * Math.max(x.thisMonth, x.lastMonth)).slice(0, 6)
}

export interface TrendPoint {
  month: string
  label: string
  income: number
  saved: number
  partial: boolean
  [jar: string]: number | string | boolean
}

/** Six months of spending per jar (current month is month-to-date). */
export function trends(p: ProfileState, date: ISODate = p.demoDate): TrendPoint[] {
  const out: TrendPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const d = shiftMonth(date, -i)
    const mk = monthKey(d)
    const end = i === 0 ? date : withDay(d, 31)
    const txns = p.transactions.filter((t) => t.date.startsWith(mk) && t.date <= end)
    const point: TrendPoint = {
      month: mk,
      label: fmtMonth(d),
      income: sum(txns.filter((t) => t.kind === 'income').map((t) => t.amount)),
      saved: sum(txns.filter((t) => t.kind === 'saving').map((t) => t.amount)),
      partial: i === 0,
    }
    for (const j of SPEND_JARS) point[j] = sum(txns.filter((t) => t.kind === 'expense' && t.jarId === j).map((t) => t.amount))
    out.push(point)
  }
  return out
}

export interface Benchmark {
  tag: string
  jarId: JarId
  yours: number // projected monthly
  typical: number
  diff: number // fraction vs typical
}

/**
 * "You vs typical students": the user's average month (last 3 full months) against
 * synthetic peer reference values (see TYPICAL_MONTHLY).
 */
export function benchmarks(p: ProfileState, date: ISODate = p.demoDate): Benchmark[] {
  const m = avgMonthlyByTag(p, date)
  const rows: Benchmark[] = []
  for (const [tag, v] of m) {
    const typical = TYPICAL_MONTHLY[tag]
    if (!typical) continue
    rows.push({ tag, jarId: v.jarId, yours: Math.round(v.amount), typical, diff: (v.amount - typical) / typical })
  }
  return rows.sort((a, b) => b.diff - a.diff)
}

/** Average monthly spend per tag over the last 3 full months. */
export function avgMonthlyByTag(p: ProfileState, date: ISODate = p.demoDate): Map<string, { amount: number; jarId: JarId }> {
  const from = `${monthKey(shiftMonth(date, -3))}-01`
  const to = `${monthKey(shiftMonth(date, -1))}-31`
  const m = byTag(inRange(p, from, to))
  for (const v of m.values()) v.amount = v.amount / 3
  return m
}

export function transactionCount(p: ProfileState): number {
  return p.transactions.length
}
