import { ME, type ProfileState, type SharedExpense } from '@/data/types'

/**
 * Pairwise balances between the user and each friend.
 * Positive = the friend owes the user; negative = the user owes the friend.
 * Only unsettled shares count.
 */
export function friendBalances(p: ProfileState): Map<string, number> {
  const m = new Map<string, number>(p.friends.map((f) => [f.id, 0]))
  for (const e of p.splits) {
    if (e.paidBy === ME) {
      for (const s of e.shares) if (s.personId !== ME && !s.settled) m.set(s.personId, (m.get(s.personId) ?? 0) + s.amount)
    } else {
      const mine = e.shares.find((s) => s.personId === ME)
      if (mine && !mine.settled) m.set(e.paidBy, (m.get(e.paidBy) ?? 0) - mine.amount)
    }
  }
  return m
}

export function splitTotals(p: ProfileState) {
  let owedToYou = 0
  let youOwe = 0
  for (const v of friendBalances(p).values()) {
    if (v > 0) owedToYou += v
    else youOwe += -v
  }
  return { owedToYou, youOwe }
}

export function friendName(p: ProfileState, id: string): string {
  if (id === ME) return 'You'
  return p.friends.find((f) => f.id === id)?.name ?? 'Friend'
}

export function pendingShares(e: SharedExpense) {
  return e.shares.filter((s) => !s.settled && s.personId !== e.paidBy)
}

/** Split an amount equally, putting any rounding remainder on the payer. */
export function equalShares(amount: number, people: string[], payer: string) {
  const each = Math.floor(amount / people.length)
  const rem = amount - each * people.length
  return people.map((id) => ({ personId: id, amount: each + (id === payer ? rem : 0), settled: id === payer }))
}
