import { addDaysISO, dayOf, daysInMonthOf, type ISODate } from '@/lib/date'
import { sum } from '@/lib/format'
import { JAR_META } from '@/data/catalog'
import type { ProfileState } from '@/data/types'
import { monthStats } from './money'

/** Consecutive days (ending at the demo date) where variable spend stayed within the daily budget. */
export function spendStreak(p: ProfileState, date: ISODate = p.demoDate): number {
  const variableBudget = sum(p.jars.filter((j) => j.type === 'variable').map((j) => j.budget))
  const daily = variableBudget / daysInMonthOf(date)
  const byDay = new Map<string, number>()
  for (const t of p.transactions) {
    if (t.kind === 'expense' && JAR_META[t.jarId].type === 'variable' && t.date <= date) byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount)
  }
  let streak = 0
  let d = date
  for (let i = 0; i < 60; i++) {
    if ((byDay.get(d) ?? 0) <= daily) streak++
    else break
    d = addDaysISO(d, -1)
  }
  return streak
}

export interface Badge {
  id: string
  emoji: string
  name: string
  description: string
  earned: boolean
  progress?: string
}

export function badges(p: ProfileState, date: ISODate = p.demoDate): Badge[] {
  const streak = spendStreak(p, date)
  const s = monthStats(p, date)
  const settled = p.splits.filter((e) => e.shares.every((x) => x.settled)).length
  const goalsStarted = p.goals.length
  const goalDone = p.goals.some((g) => g.saved >= g.target)
  const lessons = p.completedLessons.length
  return [
    { id: 'first-goal', emoji: '🎯', name: 'Dream Starter', description: 'Created your first savings goal', earned: goalsStarted > 0 },
    { id: 'streak-3', emoji: '🔥', name: 'On a Roll', description: '3-day within-budget streak', earned: streak >= 3, progress: `${Math.min(streak, 3)}/3 days` },
    { id: 'streak-7', emoji: '⚡', name: 'Perfect Week', description: '7-day within-budget streak', earned: streak >= 7, progress: `${Math.min(streak, 7)}/7 days` },
    { id: 'saver-10', emoji: '🐷', name: 'Smart Saver', description: 'Saved 10%+ of income this month', earned: s.savingsRate >= 0.1, progress: `${Math.round(s.savingsRate * 100)}%/10%` },
    { id: 'auto-tracker', emoji: '📲', name: 'Auto Tracker', description: 'Categorised 3 auto-detected expenses', earned: p.smsCategorised >= 3, progress: `${Math.min(p.smsCategorised, 3)}/3` },
    { id: 'split-pro', emoji: '🤝', name: 'Split Pro', description: 'Fully settled a shared bill', earned: settled > 0 },
    { id: 'learner', emoji: '📚', name: 'Money Nerd', description: 'Completed a Smart Money lesson', earned: lessons > 0 },
    { id: 'goal-done', emoji: '🏆', name: 'Dream Achieved', description: 'Completed a savings goal', earned: goalDone },
  ]
}

export function monthProgress(date: ISODate) {
  return dayOf(date) / daysInMonthOf(date)
}
