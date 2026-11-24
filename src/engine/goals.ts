import { addDaysISO, monthsUntil, type ISODate } from '@/lib/date'
import { roundTo } from '@/lib/format'
import type { Goal } from '@/data/types'

export interface GoalStatus {
  pct: number
  remaining: number
  monthsLeft: number
  monthlyTarget: number // how much to save each month to hit the deadline
  done: boolean
}

export function goalStatus(g: Goal, today: ISODate): GoalStatus {
  const remaining = Math.max(0, g.target - g.saved)
  const monthsLeft = monthsUntil(today, g.deadline)
  return {
    pct: g.target > 0 ? Math.min(1, g.saved / g.target) : 0,
    remaining,
    monthsLeft,
    monthlyTarget: remaining === 0 ? 0 : Math.max(50, roundTo(remaining / monthsLeft, 50)),
    done: remaining === 0,
  }
}

/** Months to reach a goal at a given monthly contribution. */
export function monthsToReach(g: Goal, monthly: number): number {
  const remaining = Math.max(0, g.target - g.saved)
  if (monthly <= 0) return Infinity
  return Math.ceil(remaining / monthly)
}

export function newMilestones(g: Goal): number[] {
  const p = (g.saved / g.target) * 100
  return [25, 50, 75, 100].filter((m) => p >= m && !g.celebrated.includes(m))
}

export function defaultDeadline(today: ISODate, months: number): ISODate {
  return addDaysISO(today, Math.round(months * 30.4))
}

export function priorityGoal(goals: Goal[]): Goal | undefined {
  return goals.find((g) => g.priority && g.saved < g.target) ?? goals.find((g) => g.saved < g.target)
}
