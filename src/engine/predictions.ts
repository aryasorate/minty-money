import { dayOf, daysInMonthOf, withDay, type ISODate } from '@/lib/date'
import { clamp, sum } from '@/lib/format'
import { VARIABLE_JARS } from '@/data/catalog'
import type { JarId, ProfileState } from '@/data/types'
import { dailyVariableSpend, jarStatuses, monthStats } from './money'

/**
 * "Smart predictions" — a transparent run-rate forecast, not an ML model.
 *
 * projected month-end = spent so far / days elapsed × days in month
 * confidence grows with days of data and shrinks with day-to-day volatility (coefficient of variation).
 */
export interface JarPrediction {
  jarId: JarId
  name: string
  spent: number
  budget: number
  projected: number
  runOutDate?: ISODate // when the jar is projected to hit zero (if before month-end)
  overBy: number
  confidence: number // 0..1
  status: 'over' | 'at-risk' | 'on-track'
}

function confidenceFor(series: number[], dim: number): number {
  const n = series.length
  if (n === 0) return 0.5
  const mean = sum(series) / n
  const variance = sum(series.map((x) => (x - mean) ** 2)) / n
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1
  const dataWeight = n / dim // share of month observed
  return clamp(0.62 + dataWeight * 0.45 - Math.min(cv, 2) * 0.08, 0.55, 0.96)
}

export function jarPredictions(p: ProfileState, date: ISODate = p.demoDate): JarPrediction[] {
  const dim = daysInMonthOf(date)
  const day = dayOf(date)
  return jarStatuses(p, date)
    .filter((s) => VARIABLE_JARS.includes(s.jar.id) && s.budget > 0)
    .map((s) => {
      const series = dailyVariableSpend(p, date, s.jar.id)
      const rate = s.spent / Math.max(day, 1)
      const projected = Math.round(rate * dim)
      let runOutDate: ISODate | undefined
      if (s.spent >= s.budget) runOutDate = date
      else if (projected > s.budget && rate > 0) runOutDate = withDay(date, Math.min(dim, Math.ceil(s.budget / rate)))
      const status: JarPrediction['status'] = s.spent >= s.budget ? 'over' : projected > s.budget * 1.02 ? 'at-risk' : 'on-track'
      return {
        jarId: s.jar.id,
        name: s.jar.name,
        spent: s.spent,
        budget: s.budget,
        projected,
        runOutDate,
        overBy: Math.max(0, projected - s.budget),
        confidence: confidenceFor(series, dim),
        status,
      }
    })
}

/** Projected money left at month end if current pace continues. */
export function monthEndForecast(p: ProfileState, date: ISODate = p.demoDate) {
  const s = monthStats(p, date)
  const dim = daysInMonthOf(date)
  const day = dayOf(date)
  const variableProjected = (s.variableSpent / Math.max(day, 1)) * dim
  const fixedRemaining = p.bills
    .filter((b) => !b.paidMonths.includes(date.slice(0, 7)))
    .reduce((a, b) => a + b.amount, 0)
  const projectedLeft = s.income - s.saved - s.fixedSpent - fixedRemaining - variableProjected
  return {
    variableProjected: Math.round(variableProjected),
    projectedLeft: Math.round(projectedLeft),
    confidence: confidenceFor(dailyVariableSpend(p, date), dim),
  }
}
