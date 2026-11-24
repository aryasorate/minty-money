import { addDaysISO, dayOf, diffDays, fmtDate, monthKey, withDay } from '@/lib/date'
import { ordinal, rupees } from '@/lib/format'
import { SOCIAL_TAGS, JAR_META } from '@/data/catalog'
import type { AppAlert, JarId, ProfileState } from '@/data/types'
import { inRange, jarStatuses, monthToDate } from './money'
import { jarPredictions } from './predictions'
import { goalStatus } from './goals'
import { benchmarks } from './insights'
import { friendBalances, friendName } from './split'
import { spendStreak } from './gamification'

const JAR_TIPS: Partial<Record<JarId, string>> = {
  food: 'Consider cooking at home this week',
  fun: 'Pick one plan this weekend instead of three',
  travel: 'Metro or bus for the next few trips?',
  academics: 'Check the library before buying new books',
  other: 'Pause non-essential buys until the 1st',
}

/**
 * Rule-based alert engine ("Smart Alerts"). Every alert has a stable id so read/dismissed
 * state survives re-computation.
 */
export function deriveAlerts(p: ProfileState): AppAlert[] {
  const today = p.demoDate
  const mk = monthKey(today)
  const out: AppAlert[] = []

  // 1. Uncategorised auto-detected expenses
  if (p.pendingDetections.length) {
    out.push({
      id: `pending-${p.pendingDetections.map((d) => d.id).join(',')}`,
      severity: 'urgent',
      category: 'budget',
      title: `${p.pendingDetections.length} detected expense${p.pendingDetections.length > 1 ? 's' : ''} need a category`,
      body: 'One tap to log it — keeps your jars accurate.',
      date: today,
      action: { kind: 'categorize', label: 'Categorise' },
      icon: 'smartphone',
    })
  }

  // 2. Budget thresholds + Peer Pressure Protector
  const last7 = inRange(p, addDaysISO(today, -6), today)
  const socialLast7 = last7.filter((t) => t.kind === 'expense' && SOCIAL_TAGS.includes(t.tag)).reduce((a, t) => a + t.amount, 0)
  for (const s of jarStatuses(p)) {
    if (s.jar.type !== 'variable' || s.budget <= 0) continue
    const pctUsed = Math.round(s.pct * 100)
    if (s.pct >= 1) {
      out.push({
        id: `over-${s.jar.id}-${mk}`,
        severity: 'urgent',
        category: 'budget',
        title: `You've crossed your ${s.jar.name} budget`,
        body: `${rupees(s.spent)} spent of ${rupees(s.budget)}. Rebalance from another jar to stay on track.`,
        date: today,
        action: { kind: 'route', label: 'Rebalance', to: '/jars' },
      })
    } else if (s.pct >= 0.8) {
      const social = (s.jar.id === 'food' || s.jar.id === 'fun') && socialLast7 > 0.15 * s.budget
      out.push({
        id: `80-${s.jar.id}-${mk}`,
        severity: 'warning',
        category: social ? 'social' : 'budget',
        title: social ? `Peer Pressure Protector: ${pctUsed}% of ${s.jar.name} used` : `You're ${pctUsed}% through your ${s.jar.name} budget`,
        body: social
          ? `You've spent ${rupees(socialLast7)} on outings & orders this week. ${JAR_TIPS[s.jar.id]} — or suggest a potluck with friends!`
          : `${JAR_TIPS[s.jar.id] ?? 'Slow down a little'} · ${rupees(s.left)} left for ${daysLeftText(today)}.`,
        date: today,
        action: { kind: 'route', label: 'View budget', to: '/jars' },
        icon: social ? 'shield' : undefined,
      })
    }
  }

  // 3. Predicted run-outs
  for (const pr of jarPredictions(p)) {
    if (pr.status !== 'at-risk' || !pr.runOutDate) continue
    out.push({
      id: `predict-${pr.jarId}-${mk}-${dayOf(pr.runOutDate)}`,
      severity: 'warning',
      category: 'budget',
      title: `At this pace, ${pr.name} runs out by the ${ordinal(dayOf(pr.runOutDate))}`,
      body: `Projected ${rupees(pr.projected)} vs budget ${rupees(pr.budget)} · ${Math.round(pr.confidence * 100)}% confidence`,
      date: today,
      action: { kind: 'route', label: 'See insights', to: '/insights' },
      icon: 'sparkles',
    })
  }

  // 4. Bills due soon / overdue
  for (const b of p.bills) {
    if (b.paidMonths.includes(mk)) continue
    const due = withDay(today, b.dueDay)
    const inDays = diffDays(due, today)
    if (inDays < 0) {
      out.push({
        id: `bill-overdue-${b.id}-${mk}`,
        severity: 'urgent',
        category: 'bills',
        title: `${b.name} is overdue`,
        body: `${rupees(b.amount)} was due on ${fmtDate(due)}.`,
        date: today,
        action: { kind: 'payBill', label: 'Pay now', billId: b.id },
      })
    } else if (inDays <= 3) {
      out.push({
        id: `bill-due-${b.id}-${mk}`,
        severity: inDays <= 1 ? 'urgent' : 'info',
        category: 'bills',
        title: `${b.name} due ${inDays === 0 ? 'today' : inDays === 1 ? 'tomorrow' : `in ${inDays} days`}`,
        body: `${rupees(b.amount)} · due ${fmtDate(due)}. Set it aside now so it doesn't surprise you.`,
        date: today,
        action: { kind: 'payBill', label: 'Pay now', billId: b.id },
      })
    }
  }

  // 5. Money owed to you (split bills)
  for (const [fid, bal] of friendBalances(p)) {
    if (bal <= 0) continue
    const oldest = p.splits
      .filter((e) => e.paidBy === 'me' && e.shares.some((s) => s.personId === fid && !s.settled))
      .sort((a, b) => (a.date < b.date ? -1 : 1))[0]
    if (!oldest || diffDays(today, oldest.date) < 2) continue
    out.push({
      id: `owed-${fid}-${oldest.id}-${bal}`,
      severity: 'info',
      category: 'social',
      title: `${friendName(p, fid)} owes you ${rupees(bal)}`,
      body: `For "${oldest.title}" since ${fmtDate(oldest.date)}. A friendly nudge, no awkward conversation.`,
      date: today,
      action: { kind: 'remind', label: 'Remind', friendId: fid },
    })
  }

  // 6. Goals: behind schedule
  for (const g of p.goals) {
    const st = goalStatus(g, today)
    if (st.done) continue
    const savedThisMonth = monthToDate(p).filter((t) => t.kind === 'saving' && t.goalId === g.id).reduce((a, t) => a + t.amount, 0)
    if (g.priority && savedThisMonth < st.monthlyTarget && dayOf(today) >= 8) {
      out.push({
        id: `goal-behind-${g.id}-${mk}`,
        severity: 'info',
        category: 'goals',
        title: `${g.emoji} ${g.name}: save ${rupees(st.monthlyTarget)} this month to stay on track`,
        body: `${rupees(savedThisMonth)} added so far this month · ${rupees(st.remaining)} to go.`,
        date: today,
        action: { kind: 'route', label: 'View goal', to: '/goals' },
      })
    }
  }

  // 7. Wins: transport below usual this week
  const travel7 = last7.filter((t) => t.kind === 'expense' && t.jarId === 'travel').reduce((a, t) => a + t.amount, 0)
  const prevTravel = inRange(p, addDaysISO(today, -34), addDaysISO(today, -7)).filter((t) => t.kind === 'expense' && t.jarId === 'travel').reduce((a, t) => a + t.amount, 0)
  const typicalWeek = prevTravel / 4
  if (typicalWeek - travel7 >= 100) {
    out.push({
      id: `win-travel-${today}`,
      severity: 'success',
      category: 'budget',
      title: `Great job! You saved ${rupees(Math.round((typicalWeek - travel7) / 10) * 10)} on transport this week`,
      body: 'Public transport is paying off — keep it going.',
      date: today,
    })
  }

  // 8. Streak
  const streak = spendStreak(p)
  if (streak >= 3) {
    out.push({
      id: `streak-${today}`,
      severity: 'success',
      category: 'goals',
      title: `Perfect streak! ${streak} days within your daily budget 🔥`,
      body: 'Every day under budget is money that can go to your goals.',
      date: today,
    })
  }

  // 9. Peer benchmark nudge (weekly insight)
  const top = benchmarks(p).find((b) => b.diff >= 0.25 && b.yours >= 300 && JAR_META[b.jarId].type === 'variable')
  if (top) {
    out.push({
      id: `bench-${top.tag}-${mk}`,
      severity: 'info',
      category: 'budget',
      title: `Weekly insight: ${top.tag} is ${Math.round(top.diff * 100)}% above typical students`,
      body: `You average ${rupees(top.yours)}/month vs ~${rupees(top.typical)} for typical students. Try a weekly mini-goal to bring it down.`,
      date: today,
      action: { kind: 'route', label: 'See insights', to: '/insights' },
      icon: 'sparkles',
    })
  }

  // 10. Event alerts (income detected, milestones, reminders...) recorded by actions
  const all = [...p.eventAlerts, ...out]
  return all.filter((a) => !p.dismissedAlertIds.includes(a.id))
}

function daysLeftText(today: string) {
  const d = new Date(today)
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const left = dim - d.getDate() + 1
  return `${left} day${left === 1 ? '' : 's'}`
}

export const SEVERITY_ORDER = { urgent: 0, warning: 1, info: 2, success: 3 } as const

export function sortAlerts(a: AppAlert[]): AppAlert[] {
  // Stable sort: severity first, then newest; equal items keep the rule engine's order.
  return [...a].sort((x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity] || y.date.localeCompare(x.date))
}
