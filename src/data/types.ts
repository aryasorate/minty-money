import type { ISODate } from '@/lib/date'

export type PersonaId = 'arjun' | 'ankit' | 'priya' | 'kunal'

/** Jar ids are shared across all profiles so the engine can reason about them. */
export type JarId = 'rent' | 'food' | 'travel' | 'academics' | 'fun' | 'other' | 'savings'
export type JarType = 'fixed' | 'variable' | 'savings'

export interface Jar {
  id: JarId
  name: string
  description: string
  type: JarType
  /** Monthly budget allocated to this jar (for savings: monthly saving target). */
  budget: number
}

export type TxnKind = 'expense' | 'income' | 'saving'
export type TxnSource = 'history' | 'manual' | 'sms' | 'split' | 'bill' | 'auto'

export interface Transaction {
  id: string
  date: ISODate
  kind: TxnKind
  amount: number // always positive
  jarId: JarId // income → 'savings' is never used; income uses 'other' as placeholder
  tag: string // sub-category, e.g. "Food Delivery"
  merchant: string
  source: TxnSource
  goalId?: string
  note?: string
}

export type IncomeKind = 'allowance' | 'stipend' | 'freelance' | 'parttime'

export interface IncomeSource {
  id: string
  name: string
  kind: IncomeKind
  amount: number // expected monthly amount
  creditDay: number // day of month it usually arrives (0 = irregular)
}

export interface Bill {
  id: string
  name: string
  amount: number // the user's own amount
  dueDay: number
  jarId: JarId
  tag: string
  paidMonths: string[] // "2026-11"
}

export type GoalCategory = 'Trip' | 'Gadget' | 'Emergency' | 'Education' | 'Lifestyle' | 'Other'

export interface Goal {
  id: string
  name: string
  emoji: string
  category: GoalCategory
  target: number
  saved: number
  deadline: ISODate
  createdAt: ISODate
  priority: boolean
  celebrated: number[] // milestones already celebrated (25, 50, 75, 100)
}

export interface Friend {
  id: string
  name: string
}

export interface Group {
  id: string
  name: string
  emoji: string
  memberIds: string[] // friend ids (the user is implicit)
}

export const ME = 'me'

export interface Share {
  personId: string // friend id or ME
  amount: number
  settled: boolean
}

export interface SharedExpense {
  id: string
  title: string
  emoji: string
  date: ISODate
  amount: number
  paidBy: string // friend id or ME
  groupId?: string
  jarId: JarId // where the user's own share is counted
  shares: Share[]
  lastReminded?: ISODate
}

export type AlertSeverity = 'urgent' | 'warning' | 'info' | 'success'
export type AlertCategory = 'budget' | 'bills' | 'goals' | 'social' | 'income'

export type AlertAction =
  | { kind: 'route'; label: string; to: string }
  | { kind: 'payBill'; label: string; billId: string }
  | { kind: 'remind'; label: string; friendId: string }
  | { kind: 'categorize'; label: string }

export interface AppAlert {
  id: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  body: string
  date: ISODate
  action?: AlertAction
  icon?: string
}

/** A bank SMS that was detected but not yet categorised by the user. */
export interface Detection {
  id: string
  sms: string
  kind: 'debit' | 'credit'
  amount: number
  merchant: string
  account?: string
  bank?: string
  suggestedJar: JarId
  suggestedTag: string
  confidence: number
  date: ISODate
}

export interface PersonaMeta {
  id: PersonaId
  name: string
  age: number
  course: string
  college: string
  archetype: string
  quote: string
  painPoint: string
  wants: string
  avatarColor: string
}

export interface ProfileState {
  persona: PersonaMeta
  onboarded: boolean
  smsLinked: boolean
  bankLinked: boolean
  demoDate: ISODate
  startDate: ISODate // demo start date (used by reset / jump)
  incomes: IncomeSource[]
  jars: Jar[]
  transactions: Transaction[]
  bills: Bill[]
  goals: Goal[]
  friends: Friend[]
  groups: Group[]
  splits: SharedExpense[]
  eventAlerts: AppAlert[]
  readAlertIds: string[]
  dismissedAlertIds: string[]
  pendingDetections: Detection[]
  completedLessons: string[]
  smsCategorised: number
}
