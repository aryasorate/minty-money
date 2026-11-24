import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDaysISO, dayOf, daysInMonthOf, monthKey, withDay, type ISODate } from '@/lib/date'
import { uid } from '@/lib/id'
import { ordinal, rupees } from '@/lib/format'
import { buildProfile, simulateUntil } from '@/data/generator'
import { PERSONA_SPECS } from '@/data/personas'
import {
  ME,
  type AppAlert,
  type Detection,
  type Goal,
  type GoalCategory,
  type IncomeSource,
  type JarId,
  type PersonaId,
  type ProfileState,
  type Transaction,
  type TxnSource,
} from '@/data/types'
import { parseSms } from '@/engine/sms'
import { newMilestones } from '@/engine/goals'
import { equalShares, friendName } from '@/engine/split'
import { celebrate, toast } from './toast'

type ProfileFn = (p: ProfileState) => ProfileState

export interface ExpenseInput {
  amount: number
  jarId: JarId
  tag: string
  merchant: string
  source?: TxnSource
  note?: string
}

export interface SplitInput {
  title: string
  emoji: string
  amount: number
  paidBy: string
  participants: string[] // includes ME
  groupId?: string
  jarId: JarId
}

interface AppState {
  activeId: PersonaId | null
  profiles: Partial<Record<PersonaId, ProfileState>>
  demoPanelOpen: boolean
  setDemoPanel: (open: boolean) => void
  detectionOpen: boolean
  setDetectionOpen: (open: boolean) => void

  selectProfile: (id: PersonaId) => void
  exitProfile: () => void
  resetProfile: (id?: PersonaId) => void
  resetAll: () => void
  completeOnboarding: (input: { incomes: IncomeSource[]; budgets: Record<JarId, number>; smsLinked: boolean; bankLinked: boolean }) => void
  restartOnboarding: () => void

  setBudgets: (budgets: Partial<Record<JarId, number>>) => void
  moveBudget: (from: JarId, to: JarId, amount: number) => void
  addExpense: (e: ExpenseInput) => void
  addToSavings: (amount: number, note?: string) => void

  receiveSms: (sms: string) => Detection | null
  categoriseDetection: (id: string, jarId: JarId, tag: string) => void
  acceptIncome: (id: string, saveAmount: number, goalId?: string) => void
  dismissDetection: (id: string) => void

  payBill: (billId: string) => void

  addFriend: (name: string) => string
  createGroup: (name: string, emoji: string, memberIds: string[]) => void
  addSplit: (s: SplitInput) => void
  settleFriend: (friendId: string) => void
  settleShare: (splitId: string, personId: string) => void
  remind: (friendId: string) => void

  addGoal: (g: { name: string; emoji: string; category: GoalCategory; target: number; deadline: ISODate; saved?: number }) => void
  contributeGoal: (goalId: string, amount: number) => void
  togglePriority: (goalId: string) => void
  deleteGoal: (goalId: string) => void

  markRead: (ids: string[]) => void
  dismissAlert: (id: string) => void

  completeLesson: (lessonId: string) => void

  advanceTo: (date: ISODate) => void
  jumpMidMonth: () => void
}

function txn(p: ProfileState, t: Omit<Transaction, 'id' | 'date'> & { date?: ISODate }): Transaction {
  return { id: uid('t'), date: t.date ?? p.demoDate, ...t }
}

function eventAlert(p: ProfileState, a: Omit<AppAlert, 'id' | 'date'>): AppAlert {
  return { id: uid('ev'), date: p.demoDate, ...a }
}

/** Apply goal contribution + milestone celebration. */
function withContribution(p: ProfileState, goalId: string, amount: number, source: TxnSource, note?: string): ProfileState {
  let celebrated: { goal: Goal; m: number } | null = null
  const goals = p.goals.map((g) => {
    if (g.id !== goalId) return g
    const ng = { ...g, saved: Math.min(g.target, g.saved + amount) }
    const ms = newMilestones(ng)
    if (ms.length) {
      celebrated = { goal: ng, m: Math.max(...ms) }
      ng.celebrated = [...ng.celebrated, ...ms]
    }
    return ng
  })
  const g = p.goals.find((x) => x.id === goalId)!
  let np: ProfileState = {
    ...p,
    goals,
    transactions: [txn(p, { kind: 'saving', amount, jarId: 'savings', tag: 'Savings', merchant: `To goal: ${g.name}`, source, goalId, note }), ...p.transactions],
  }
  if (celebrated) {
    const { goal, m } = celebrated as { goal: Goal; m: number }
    const done = m === 100
    np = {
      ...np,
      eventAlerts: [
        eventAlert(np, {
          severity: 'success',
          category: 'goals',
          title: done ? `🏆 Goal achieved: ${goal.name}!` : `Savings milestone! ${m}% of ${goal.name}`,
          body: `You've saved ${rupees(goal.saved)} towards your ${goal.emoji} ${goal.name}. ${done ? 'Dream unlocked!' : 'Keep the streak alive!'}`,
          action: { kind: 'route', label: 'View goal', to: '/goals' },
        }),
        ...np.eventAlerts,
      ],
    }
    setTimeout(() => {
      celebrate()
      toast(done ? `Goal achieved: ${goal.name} 🏆` : `Milestone: ${m}% of ${goal.name} 🎉`, `${rupees(goal.saved)} saved so far`)
    }, 150)
  }
  return np
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Update the active profile immutably. */
      const mut = (fn: ProfileFn) =>
        set((s) => {
          const id = s.activeId
          const p = id ? s.profiles[id] : undefined
          if (!id || !p) return s
          return { profiles: { ...s.profiles, [id]: fn(p) } }
        })
      const active = () => {
        const s = get()
        return s.activeId ? s.profiles[s.activeId] : undefined
      }

      return {
        activeId: null,
        profiles: {},
        demoPanelOpen: false,
        setDemoPanel: (open) => set({ demoPanelOpen: open }),
        detectionOpen: false,
        setDetectionOpen: (open) => set({ detectionOpen: open }),

        selectProfile: (id) =>
          set((s) => ({ activeId: id, profiles: s.profiles[id] ? s.profiles : { ...s.profiles, [id]: buildProfile(id) } })),
        exitProfile: () => set({ activeId: null, demoPanelOpen: false }),
        resetProfile: (id) =>
          set((s) => {
            const pid = id ?? s.activeId
            if (!pid) return s
            return { profiles: { ...s.profiles, [pid]: buildProfile(pid) } }
          }),
        resetAll: () => set({ profiles: {}, activeId: null, demoPanelOpen: false }),

        completeOnboarding: ({ incomes, budgets, smsLinked, bankLinked }) =>
          mut((p) => ({
            ...p,
            onboarded: true,
            smsLinked,
            bankLinked,
            incomes,
            jars: p.jars.map((j) => ({ ...j, budget: budgets[j.id] ?? j.budget })),
          })),
        restartOnboarding: () => mut((p) => ({ ...p, onboarded: false })),

        setBudgets: (budgets) => mut((p) => ({ ...p, jars: p.jars.map((j) => ({ ...j, budget: Math.max(0, budgets[j.id] ?? j.budget) })) })),
        moveBudget: (from, to, amount) =>
          mut((p) => ({
            ...p,
            jars: p.jars.map((j) => (j.id === from ? { ...j, budget: j.budget - amount } : j.id === to ? { ...j, budget: j.budget + amount } : j)),
          })),
        addExpense: (e) =>
          mut((p) => ({
            ...p,
            transactions: [txn(p, { kind: 'expense', amount: e.amount, jarId: e.jarId, tag: e.tag, merchant: e.merchant, source: e.source ?? 'manual', note: e.note }), ...p.transactions],
          })),
        addToSavings: (amount, note) =>
          mut((p) => ({
            ...p,
            transactions: [txn(p, { kind: 'saving', amount, jarId: 'savings', tag: 'Savings', merchant: 'Moved to Savings jar', source: 'manual', note }), ...p.transactions],
          })),

        receiveSms: (sms) => {
          const p = active()
          if (!p) return null
          const det = parseSms(sms, p.demoDate)
          if (!det) return null
          mut((q) => ({ ...q, pendingDetections: [...q.pendingDetections, det] }))
          set({ detectionOpen: true })
          return det
        },
        categoriseDetection: (id, jarId, tag) =>
          mut((p) => {
            const d = p.pendingDetections.find((x) => x.id === id)
            if (!d) return p
            return {
              ...p,
              smsCategorised: p.smsCategorised + 1,
              pendingDetections: p.pendingDetections.filter((x) => x.id !== id),
              transactions: [txn(p, { kind: 'expense', amount: d.amount, jarId, tag, merchant: d.merchant, source: 'sms', note: 'Auto-detected from SMS' }), ...p.transactions],
            }
          }),
        acceptIncome: (id, saveAmount, goalId) =>
          mut((p) => {
            const d = p.pendingDetections.find((x) => x.id === id)
            if (!d) return p
            let np: ProfileState = {
              ...p,
              smsCategorised: p.smsCategorised + 1,
              pendingDetections: p.pendingDetections.filter((x) => x.id !== id),
              transactions: [txn(p, { kind: 'income', amount: d.amount, jarId: 'other', tag: 'Side income', merchant: d.merchant, source: 'sms', note: 'Auto-detected credit' }), ...p.transactions],
            }
            if (saveAmount > 0) {
              np = goalId
                ? withContribution(np, goalId, saveAmount, 'auto', 'From side income')
                : { ...np, transactions: [txn(np, { kind: 'saving', amount: saveAmount, jarId: 'savings', tag: 'Savings', merchant: 'Moved to Savings jar', source: 'auto', note: 'From side income' }), ...np.transactions] }
            }
            const goalName = goalId ? np.goals.find((g) => g.id === goalId)?.name : 'Savings jar'
            np = {
              ...np,
              eventAlerts: [
                eventAlert(np, {
                  severity: 'success',
                  category: 'income',
                  title: `Side income received: ${rupees(d.amount)} from ${d.merchant}`,
                  body: saveAmount > 0 ? `Great move — ${rupees(saveAmount)} went straight to ${goalName}.` : 'Logged to this month’s income.',
                }),
                ...np.eventAlerts,
              ],
            }
            return np
          }),
        dismissDetection: (id) => mut((p) => ({ ...p, pendingDetections: p.pendingDetections.filter((x) => x.id !== id) })),

        payBill: (billId) => {
          const p = active()
          const b = p?.bills.find((x) => x.id === billId)
          if (!p || !b) return
          const mk = monthKey(p.demoDate)
          if (b.paidMonths.includes(mk)) return
          mut((q) => ({
            ...q,
            bills: q.bills.map((x) => (x.id === billId ? { ...x, paidMonths: [...x.paidMonths, mk] } : x)),
            transactions: [txn(q, { kind: 'expense', amount: b.amount, jarId: b.jarId, tag: b.tag, merchant: b.name, source: 'bill' }), ...q.transactions],
          }))
          toast(`${b.name} marked as paid`, `${rupees(b.amount)} logged in Rent & Bills`)
        },

        addFriend: (name) => {
          const id = uid('f')
          mut((p) => ({ ...p, friends: [...p.friends, { id, name }] }))
          return id
        },
        createGroup: (name, emoji, memberIds) => mut((p) => ({ ...p, groups: [...p.groups, { id: uid('g'), name, emoji, memberIds }] })),
        addSplit: (s) =>
          mut((p) => {
            const shares = equalShares(s.amount, s.participants, s.paidBy)
            const mine = shares.find((x) => x.personId === ME)
            const exp = { id: uid('split'), title: s.title, emoji: s.emoji, date: p.demoDate, amount: s.amount, paidBy: s.paidBy, groupId: s.groupId, jarId: s.jarId, shares }
            let np: ProfileState = { ...p, splits: [exp, ...p.splits] }
            // The user's own share counts as their spending when they paid.
            if (mine && s.paidBy === ME) {
              np = { ...np, transactions: [txn(np, { kind: 'expense', amount: mine.amount, jarId: s.jarId, tag: s.jarId === 'food' ? 'Eating Out' : s.jarId === 'fun' ? 'Parties & Outings' : 'Misc', merchant: `${s.title} (your share)`, source: 'split' }), ...np.transactions] }
            }
            return np
          }),
        settleFriend: (friendId) => {
          const p = active()
          if (!p) return
          mut((q) => {
            let np = q
            const newTxns: Transaction[] = []
            const splits = q.splits.map((e) => {
              if (e.paidBy === ME) {
                return { ...e, shares: e.shares.map((s) => (s.personId === friendId ? { ...s, settled: true } : s)) }
              }
              if (e.paidBy === friendId) {
                const mine = e.shares.find((s) => s.personId === ME)
                if (mine && !mine.settled) newTxns.push(txn(q, { kind: 'expense', amount: mine.amount, jarId: e.jarId, tag: 'Misc', merchant: `${e.title} (paid back to ${friendName(q, friendId)})`, source: 'split' }))
                return { ...e, shares: e.shares.map((s) => (s.personId === ME ? { ...s, settled: true } : s)) }
              }
              return e
            })
            np = { ...np, splits, transactions: [...newTxns, ...np.transactions] }
            return np
          })
          toast(`Settled up with ${friendName(p, friendId)}`, 'Balances updated')
        },
        settleShare: (splitId, personId) =>
          mut((p) => ({
            ...p,
            splits: p.splits.map((e) => (e.id === splitId ? { ...e, shares: e.shares.map((s) => (s.personId === personId ? { ...s, settled: true } : s)) } : e)),
          })),
        remind: (friendId) => {
          const p = active()
          if (!p) return
          mut((q) => ({ ...q, splits: q.splits.map((e) => (e.shares.some((s) => s.personId === friendId && !s.settled) && e.paidBy === ME ? { ...e, lastReminded: q.demoDate } : e)) }))
          toast(`Reminder sent to ${friendName(p, friendId)}`, 'A friendly in-app nudge — no awkward chat needed', 'info')
        },

        addGoal: (g) =>
          mut((p) => ({
            ...p,
            goals: [
              ...p.goals,
              { id: uid('goal'), name: g.name, emoji: g.emoji, category: g.category, target: g.target, saved: g.saved ?? 0, deadline: g.deadline, createdAt: p.demoDate, priority: p.goals.length === 0, celebrated: [] },
            ],
          })),
        contributeGoal: (goalId, amount) => mut((p) => withContribution(p, goalId, amount, 'manual')),
        togglePriority: (goalId) => mut((p) => ({ ...p, goals: p.goals.map((g) => ({ ...g, priority: g.id === goalId ? !g.priority : false })) })),
        deleteGoal: (goalId) => mut((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== goalId) })),

        markRead: (ids) => mut((p) => ({ ...p, readAlertIds: Array.from(new Set([...p.readAlertIds, ...ids])) })),
        dismissAlert: (id) => mut((p) => ({ ...p, dismissedAlertIds: [...p.dismissedAlertIds, id] })),

        completeLesson: (lessonId) => mut((p) => (p.completedLessons.includes(lessonId) ? p : { ...p, completedLessons: [...p.completedLessons, lessonId] })),

        advanceTo: (date) =>
          mut((p) => {
            if (date <= p.demoDate) return p
            const { transactions, bills } = simulateUntil(p, date)
            return { ...p, transactions, bills, demoDate: date }
          }),
        jumpMidMonth: () => {
          const p = active()
          if (!p) return
          const day = dayOf(p.demoDate)
          const dim = daysInMonthOf(p.demoDate)
          const target = day < 18 ? withDay(p.demoDate, 18) : withDay(p.demoDate, Math.min(dim, day + 5))
          if (target <= p.demoDate) {
            toast('End of month reached', 'Reset the demo to start again', 'info')
            return
          }
          get().advanceTo(target)
          toast(`Fast-forwarded to the ${ordinal(dayOf(target))}`,`${PERSONA_SPECS[p.persona.id].meta.name}'s usual spending was simulated`, 'info')
        },
      }
    },
    {
      name: 'minty-money-v1',
      version: 1,
      partialize: (s) => ({ activeId: s.activeId, profiles: s.profiles }),
    },
  ),
)

/** The active profile. Only call inside screens rendered after a profile is chosen. */
export function useProfile(): ProfileState {
  return useStore((s) => s.profiles[s.activeId!]!)
}

export const nextDay = (p: ProfileState) => addDaysISO(p.demoDate, 1)
