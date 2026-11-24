import { roundTo } from '@/lib/format'
import type { ISODate } from '@/lib/date'
import type { JarId, ProfileState } from '@/data/types'
import { avgMonthlyByTag } from './insights'
import { goalStatus, monthsToReach, priorityGoal } from './goals'

export interface WhatIf {
  id: string
  title: string
  detail: string
  tag: string
  jarId: JarId
  monthly: number
  yearly: number
  tone: 'green' | 'amber' | 'blue'
}

const TEMPLATES: { tag: string; title: (avg: number) => string; share: number; detail: string; tone: WhatIf['tone'] }[] = [
  { tag: 'Food Delivery', title: (a) => `Cut food delivery by ${rupeeStr(roundTo(a * 0.5, 50))}/month`, share: 0.5, detail: 'Order in once a week instead of three times', tone: 'green' },
  { tag: 'Cabs & Autos', title: () => 'Use metro/bus instead of cabs', share: 0.55, detail: 'Swap most cab rides for public transport', tone: 'amber' },
  { tag: 'Snacks & Chai', title: () => 'Weekly snack cap of ₹150', share: 0.35, detail: 'Small UPI spends add up — cap them weekly', tone: 'green' },
  { tag: 'Eating Out', title: () => 'Swap one café outing a week for a potluck', share: 0.35, detail: 'Same friends, a fraction of the bill', tone: 'amber' },
  { tag: 'Parties & Outings', title: () => 'Set a per-outing limit', share: 0.3, detail: 'Decide your number before you leave', tone: 'amber' },
  { tag: 'Subscriptions', title: () => 'Cut subscriptions in half', share: 0.5, detail: 'Share a plan with friends or pause one', tone: 'green' },
  { tag: 'Shopping', title: () => 'Follow the 30-day rule on shopping', share: 0.4, detail: 'Wait 30 days before non-essential buys', tone: 'green' },
  { tag: 'Mess & Canteen', title: () => 'Carry a refillable bottle & tiffin twice a week', share: 0.15, detail: 'Small daily savings, big monthly effect', tone: 'blue' },
]

function rupeeStr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export function whatIfs(p: ProfileState, date: ISODate = p.demoDate): WhatIf[] {
  const avg = avgMonthlyByTag(p, date)
  const out: WhatIf[] = []
  for (const t of TEMPLATES) {
    const a = avg.get(t.tag)
    if (!a) continue
    const monthly = roundTo(a.amount * t.share, 50)
    if (monthly < 100) continue
    out.push({ id: `wi_${t.tag}`, title: t.title(a.amount), detail: t.detail, tag: t.tag, jarId: a.jarId, monthly, yearly: monthly * 12, tone: t.tone })
  }
  return out.sort((a, b) => b.monthly - a.monthly).slice(0, 4)
}

export function impactOf(p: ProfileState, monthly: number, date: ISODate = p.demoDate) {
  const g = priorityGoal(p.goals)
  if (!g) return null
  const base = goalStatus(g, date).monthlyTarget
  const before = monthsToReach(g, base)
  const after = monthsToReach(g, base + monthly)
  return { goal: g, monthsSooner: Number.isFinite(before) ? Math.max(0, before - after) : 0, after }
}
