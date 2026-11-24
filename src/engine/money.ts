import { addDaysISO, dayOf, daysInMonthOf, diffDays, monthKey, shiftMonth, weekdayIdx, type ISODate } from '@/lib/date'
import { sum } from '@/lib/format'
import { JAR_META, SPEND_JARS, VARIABLE_JARS } from '@/data/catalog'
import type { Jar, JarId, ProfileState, Transaction } from '@/data/types'

/** Transactions in the calendar month of `date`, up to and including `date`. */
export function monthToDate(p: ProfileState, date: ISODate = p.demoDate): Transaction[] {
  const mk = monthKey(date)
  return p.transactions.filter((t) => t.date.startsWith(mk) && t.date <= date)
}

export function inRange(p: ProfileState, from: ISODate, to: ISODate): Transaction[] {
  return p.transactions.filter((t) => t.date >= from && t.date <= to)
}

export function expectedMonthlyIncome(p: ProfileState): number {
  return sum(p.incomes.filter((i) => i.creditDay > 0).map((i) => i.amount))
}

export function totalAllocated(p: ProfileState): number {
  return sum(p.jars.map((j) => j.budget))
}

export interface JarStatus {
  jar: Jar
  spent: number // for the savings jar: amount saved
  budget: number
  left: number
  pct: number // 0..n
}

export function jarStatuses(p: ProfileState, date: ISODate = p.demoDate): JarStatus[] {
  const txns = monthToDate(p, date)
  return p.jars.map((jar) => {
    const spent = sum(
      txns
        .filter((t) => (jar.id === 'savings' ? t.kind === 'saving' : t.kind === 'expense' && t.jarId === jar.id))
        .map((t) => t.amount),
    )
    return { jar, spent, budget: jar.budget, left: jar.budget - spent, pct: jar.budget > 0 ? spent / jar.budget : 0 }
  })
}

export function jarStatus(p: ProfileState, id: JarId, date?: ISODate): JarStatus {
  return jarStatuses(p, date).find((s) => s.jar.id === id)!
}

export interface MonthStats {
  income: number
  expenses: number
  saved: number
  left: number
  fixedSpent: number
  fixedBudget: number
  variableSpent: number
  variableBudget: number
  savingsRate: number
  savingsTarget: number
  daysLeft: number
  safePerDay: number
  byJar: Record<JarId, number>
  lastMonthExpensesSamePeriod: number
}

export function monthStats(p: ProfileState, date: ISODate = p.demoDate): MonthStats {
  const txns = monthToDate(p, date)
  const income = sum(txns.filter((t) => t.kind === 'income').map((t) => t.amount))
  const expenses = sum(txns.filter((t) => t.kind === 'expense').map((t) => t.amount))
  const saved = sum(txns.filter((t) => t.kind === 'saving').map((t) => t.amount))
  const byJar = Object.fromEntries(SPEND_JARS.map((j) => [j, 0])) as Record<JarId, number>
  byJar.savings = saved
  for (const t of txns) if (t.kind === 'expense') byJar[t.jarId] = (byJar[t.jarId] ?? 0) + t.amount
  const fixedSpent = byJar.rent
  const fixedBudget = p.jars.find((j) => j.id === 'rent')?.budget ?? 0
  const variableSpent = sum(VARIABLE_JARS.map((j) => byJar[j]))
  const variableBudget = sum(p.jars.filter((j) => j.type === 'variable').map((j) => j.budget))
  const daysLeft = daysInMonthOf(date) - dayOf(date) + 1
  const variableLeft = Math.max(0, variableBudget - variableSpent)

  // Same period last month, for a "vs last month" comparison
  const lastDate = shiftMonth(date, -1)
  const lastExp = sum(monthToDate(p, lastDate).filter((t) => t.kind === 'expense').map((t) => t.amount))

  const incomeBase = Math.max(income, expectedMonthlyIncome(p))
  return {
    income,
    expenses,
    saved,
    left: income - expenses - saved,
    fixedSpent,
    fixedBudget,
    variableSpent,
    variableBudget,
    savingsRate: incomeBase > 0 ? saved / incomeBase : 0,
    savingsTarget: 0.2,
    daysLeft,
    safePerDay: daysLeft > 0 ? variableLeft / daysLeft : 0,
    byJar,
    lastMonthExpensesSamePeriod: lastExp,
  }
}

/** Average variable spend per weekday (Mon..Sun) over the last 4 weeks. */
export function weeklyPattern(p: ProfileState, date: ISODate = p.demoDate): { day: string; amount: number }[] {
  const from = addDaysISO(date, -27)
  const totals = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (let d = from; diffDays(date, d) >= 0; d = addDaysISO(d, 1)) counts[weekdayIdx(d)]++
  for (const t of inRange(p, from, date)) {
    if (t.kind === 'expense' && JAR_META[t.jarId].type === 'variable') totals[weekdayIdx(t.date)] += t.amount
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    amount: Math.round(counts[i] ? totals[i] / counts[i] : 0),
  }))
}

/** Daily variable spend for each day of the current month up to `date`. */
export function dailyVariableSpend(p: ProfileState, date: ISODate = p.demoDate, jarId?: JarId): number[] {
  const days = dayOf(date)
  const arr = new Array(days).fill(0)
  for (const t of monthToDate(p, date)) {
    if (t.kind !== 'expense') continue
    if (jarId ? t.jarId !== jarId : JAR_META[t.jarId].type !== 'variable') continue
    arr[dayOf(t.date) - 1] += t.amount
  }
  return arr
}
