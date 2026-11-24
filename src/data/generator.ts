import { addDaysISO, dayOf, diffDays, firstOfMonth, monthKey, shiftMonth, toISO, weekdayIdx, withDay, type ISODate } from '@/lib/date'
import { between, pick, rngFor } from '@/lib/rng'
import { uid } from '@/lib/id'
import { JAR_META, ALL_JARS } from './catalog'
import { PERSONA_SPECS, type PersonaSpec, type SpendPattern } from './personas'
import type { Bill, Goal, PersonaId, ProfileState, SharedExpense, Transaction } from './types'

/**
 * Synthetic-but-consistent demo data.
 *
 * Every day's transactions are derived from a PRNG seeded with (persona, date), so the data is
 * identical across resets and "jump ahead" produces the same days whenever it's pressed.
 */

const HISTORY_MONTHS = 5 // full past months + the current month = 6 months of trends

/** The demo always starts on the 10th of the real current month. */
export function defaultStartDate(): ISODate {
  return withDay(toISO(new Date()), 10)
}

/** Past months vary randomly (so trends look real); the current month follows the persona's story exactly. */
function monthFactor(spec: PersonaSpec, month: string, currentMonth: string): number {
  if (month >= currentMonth) return 1
  const r = rngFor(`${spec.meta.id}|mf|${month}`)
  return 0.88 + r() * 0.24
}

function tagFactor(spec: PersonaSpec, tag: string, month: string, currentMonth: string): number {
  if (month >= currentMonth) return spec.currentMonthTagFactor?.[tag] ?? 1
  const r = rngFor(`${spec.meta.id}|tf|${tag}|${month}`)
  return 0.8 + r() * 0.4
}

const txnId = (date: ISODate) => uid(`t${date.replace(/-/g, '')}`)

function expectedOn(spec: PersonaSpec, p: SpendPattern, d: ISODate, currentMonth: string): number {
  const day = dayOf(d)
  const month = monthKey(d)
  const weekend = weekdayIdx(d) >= 5
  const front = spec.frontLoad ? (day <= 10 ? spec.frontLoad : 0.85) : 1
  return p.perDay * monthFactor(spec, month, currentMonth) * front * (weekend ? p.weekendMult ?? 1.15 : 1) * tagFactor(spec, p.tag, month, currentMonth)
}

/**
 * Number of transactions of a pattern on a given day. Uses a cumulative "expected count" with a
 * random phase per month, so monthly totals track the expected rate closely (low variance) while
 * the exact days stay irregular — and any single day can be computed without generating the rest.
 */
function countOn(spec: PersonaSpec, p: SpendPattern, d: ISODate, currentMonth: string): number {
  const month = monthKey(d)
  const phase = rngFor(`${spec.meta.id}|ph|${p.tag}|${p.jarId}|${month}`)()
  let before = 0
  for (let i = 1; i < dayOf(d); i++) before += expectedOn(spec, p, withDay(d, i), currentMonth)
  const upto = before + expectedOn(spec, p, d, currentMonth)
  return Math.floor(phase + upto) - Math.floor(phase + before)
}

/** Generate all transactions for the inclusive day range [from, to]. */
export function generateDays(spec: PersonaSpec, from: ISODate, to: ISODate, currentMonth: string): Transaction[] {
  const out: Transaction[] = []
  for (let d = from; diffDays(to, d) >= 0; d = addDaysISO(d, 1)) {
    const day = dayOf(d)
    const month = monthKey(d)
    const rng = rngFor(`${spec.meta.id}|${d}`)
    const isPast = month !== currentMonth

    // Income credits
    for (const inc of spec.incomes) {
      if (inc.creditDay === day) {
        out.push({ id: txnId(d), date: d, kind: 'income', amount: inc.amount, jarId: 'other', tag: inc.name, merchant: inc.name, source: 'history' })
      }
    }
    // Irregular freelance income (past months only — the current month's credit is the demo SMS)
    if (spec.freelance && isPast) {
      const fr = rngFor(`${spec.meta.id}|free|${month}`)
      const count = Math.floor(spec.freelance.perMonth) + (fr() < spec.freelance.perMonth % 1 ? 1 : 0)
      for (let i = 0; i < count; i++) {
        const fday = 11 + Math.floor(fr() * 15)
        const amt = between(fr, spec.freelance.min, spec.freelance.max, 500)
        if (fday === day) {
          out.push({ id: txnId(d), date: d, kind: 'income', amount: amt, jarId: 'other', tag: 'Freelance design gigs', merchant: spec.freelance.merchant, source: 'history' })
        }
      }
    }
    // Monthly "pay yourself first" savings transfer
    if (day === spec.savingsDay) {
      const sr = rngFor(`${spec.meta.id}|save|${month}`)
      if (sr() < spec.savingsReliability) {
        out.push({ id: txnId(d), date: d, kind: 'saving', amount: spec.budgets.savings, jarId: 'savings', tag: 'Savings', merchant: 'Moved to Savings jar', source: 'auto' })
      }
    }
    // Bills
    for (const b of spec.bills) {
      if (b.dueDay === day) {
        out.push({ id: txnId(d), date: d, kind: 'expense', amount: b.amount, jarId: b.jarId, tag: b.tag, merchant: b.name, source: 'bill' })
      }
    }
    // Fixed charges (subscriptions)
    for (const f of spec.fixed) {
      if (f.day === day) {
        out.push({ id: txnId(d), date: d, kind: 'expense', amount: f.amount, jarId: f.jarId, tag: f.tag, merchant: f.merchant, source: 'history' })
      }
    }
    // Variable spending patterns
    for (const p of spec.patterns) {
      const n = countOn(spec, p, d, currentMonth)
      for (let i = 0; i < n; i++) {
        out.push({
          id: txnId(d),
          date: d,
          kind: 'expense',
          amount: between(rng, p.min, p.max, p.step ?? 5),
          jarId: p.jarId,
          tag: p.tag,
          merchant: pick(rng, p.merchants),
          source: 'history',
        })
      }
    }
  }
  return out
}

/** Which bills are already paid for the given months, based on their due day. */
function paidMonthsFor(bill: Omit<Bill, 'paidMonths'>, start: ISODate): string[] {
  const months: string[] = []
  for (let i = HISTORY_MONTHS; i >= 1; i--) months.push(monthKey(shiftMonth(start, -i)))
  if (bill.dueDay <= dayOf(start)) months.push(monthKey(start))
  return months
}

export function buildProfile(id: PersonaId, start: ISODate = defaultStartDate()): ProfileState {
  const spec = PERSONA_SPECS[id]
  const currentMonth = monthKey(start)
  const from = firstOfMonth(shiftMonth(start, -HISTORY_MONTHS))
  const transactions = generateDays(spec, from, start, currentMonth).sort((a, b) => (a.date < b.date ? 1 : -1))

  const goals: Goal[] = spec.goals.map((g, i) => {
    const p = g.saved / g.target
    return {
      id: `goal_${i}`,
      name: g.name,
      emoji: g.emoji,
      category: g.category,
      target: g.target,
      saved: g.saved,
      deadline: withDay(shiftMonth(start, g.monthsAhead), 28),
      createdAt: shiftMonth(start, -3),
      priority: !!g.priority,
      celebrated: [25, 50, 75, 100].filter((m) => p * 100 >= m),
    }
  })

  const splits: SharedExpense[] = spec.splits.map((s, i) => {
    const each = Math.round(s.amount / s.shares.length)
    return {
      id: `split_${i}`,
      title: s.title,
      emoji: s.emoji,
      date: withDay(start, s.day),
      amount: s.amount,
      paidBy: s.paidBy,
      groupId: s.groupId,
      jarId: s.jarId,
      shares: s.shares.map((sh) => ({ ...sh, amount: each })),
    }
  })

  return {
    persona: spec.meta,
    onboarded: false,
    smsLinked: false,
    bankLinked: false,
    demoDate: start,
    startDate: start,
    incomes: spec.incomes.map((x) => ({ ...x })),
    jars: ALL_JARS.map((j) => ({
      id: j,
      name: JAR_META[j].name,
      description: JAR_META[j].description,
      type: JAR_META[j].type,
      budget: spec.budgets[j],
    })),
    transactions,
    bills: spec.bills.map((b) => ({ ...b, paidMonths: paidMonthsFor(b, start) })),
    goals,
    friends: spec.friends.map((f) => ({ ...f })),
    groups: spec.groups.map((g) => ({ ...g, memberIds: [...g.memberIds] })),
    splits,
    eventAlerts: [],
    readAlertIds: [],
    dismissedAlertIds: [],
    pendingDetections: [],
    completedLessons: [],
    smsCategorised: 0,
  }
}

/**
 * Advance the demo clock from `profile.demoDate` to `to`, generating the persona's typical
 * spending for the days in between and auto-paying bills that fall due.
 */
export function simulateUntil(profile: ProfileState, to: ISODate): { transactions: Transaction[]; bills: Bill[] } {
  const spec = PERSONA_SPECS[profile.persona.id]
  const from = addDaysISO(profile.demoDate, 1)
  if (diffDays(to, from) < 0) return { transactions: profile.transactions, bills: profile.bills }
  const currentMonth = monthKey(profile.startDate)
  // Bills are handled below from the profile's own bill list (the user may have paid them already).
  const generated = generateDays({ ...spec, bills: [] }, from, to, currentMonth)

  const bills = profile.bills.map((b) => ({ ...b, paidMonths: [...b.paidMonths] }))
  for (let d = from; diffDays(to, d) >= 0; d = addDaysISO(d, 1)) {
    for (const b of bills) {
      const mk = monthKey(d)
      if (b.dueDay === dayOf(d) && !b.paidMonths.includes(mk)) {
        b.paidMonths.push(mk)
        generated.push({ id: txnId(d), date: d, kind: 'expense', amount: b.amount, jarId: b.jarId, tag: b.tag, merchant: b.name, source: 'bill' })
      }
    }
  }
  const transactions = [...generated, ...profile.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return { transactions, bills }
}
