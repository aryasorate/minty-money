import type { JarId, JarType } from './types'

/** Static, presentation-level metadata for each jar. */
export interface JarMeta {
  id: JarId
  name: string
  description: string
  type: JarType
  color: string
  soft: string
}

export const JAR_META: Record<JarId, JarMeta> = {
  rent: { id: 'rent', name: 'Rent & Bills', description: 'Fixed expenses like rent, wifi, recharge', type: 'fixed', color: '#f0745a', soft: '#fdeae5' },
  food: { id: 'food', name: 'Food & Snacks', description: 'Mess, canteen, groceries, food delivery', type: 'variable', color: '#f59e3b', soft: '#fef1e0' },
  travel: { id: 'travel', name: 'Travel', description: 'Metro, autos, cabs and trips home', type: 'variable', color: '#3ba6e8', soft: '#e3f2fc' },
  academics: { id: 'academics', name: 'Academics', description: 'Books, printouts, courses', type: 'variable', color: '#6d72e8', soft: '#ebecfc' },
  fun: { id: 'fun', name: 'Fun & Social', description: 'Outings, movies, parties, subscriptions', type: 'variable', color: '#c77dea', soft: '#f6eafc' },
  other: { id: 'other', name: 'Other', description: 'Personal care, gifts and everything else', type: 'variable', color: '#8f9bb0', soft: '#eef0f4' },
  savings: { id: 'savings', name: 'Savings', description: 'Pay yourself first — goals & emergency fund', type: 'savings', color: '#16a34a', soft: '#e3f6e9' },
}

export const SPEND_JARS: JarId[] = ['rent', 'food', 'travel', 'academics', 'fun', 'other']
export const VARIABLE_JARS: JarId[] = ['food', 'travel', 'academics', 'fun', 'other']
export const ALL_JARS: JarId[] = [...SPEND_JARS, 'savings']

/** The quick categories offered in the SMS pop-up (as in the deck), mapped to jars. */
export const QUICK_CATEGORIES: { label: string; jarId: JarId; tag: string }[] = [
  { label: 'Food', jarId: 'food', tag: 'Eating Out' },
  { label: 'Travel', jarId: 'travel', tag: 'Cabs & Autos' },
  { label: 'Academics', jarId: 'academics', tag: 'Books & Stationery' },
  { label: 'Entertainment', jarId: 'fun', tag: 'Movies & Events' },
  { label: 'Bills', jarId: 'rent', tag: 'Utilities' },
  { label: 'Other', jarId: 'other', tag: 'Misc' },
]

/** Sub-categories ("tags") per jar. */
export const TAGS: Record<JarId, string[]> = {
  rent: ['Rent', 'Utilities', 'Phone Recharge'],
  food: ['Mess & Canteen', 'Food Delivery', 'Snacks & Chai', 'Groceries', 'Eating Out'],
  travel: ['Cabs & Autos', 'Metro & Bus', 'Trains & Trips'],
  academics: ['Books & Stationery', 'Courses', 'Printing'],
  fun: ['Movies & Events', 'Subscriptions', 'Parties & Outings', 'Shopping'],
  other: ['Personal Care', 'Gifts', 'Misc'],
  savings: ['Savings'],
}

/**
 * What a "typical student" spends per month on each tag. Used for peer benchmarks.
 * Synthetic reference values for the prototype (documented in README).
 */
export const TYPICAL_MONTHLY: Record<string, number> = {
  'Mess & Canteen': 2400,
  'Food Delivery': 1200,
  'Snacks & Chai': 700,
  Groceries: 600,
  'Eating Out': 1200,
  'Cabs & Autos': 600,
  'Metro & Bus': 450,
  'Trains & Trips': 500,
  'Movies & Events': 400,
  Subscriptions: 300,
  'Parties & Outings': 800,
  Shopping: 900,
  'Books & Stationery': 350,
  Printing: 200,
  'Personal Care': 300,
}

/** Tags that are typically driven by peer/social spending. */
export const SOCIAL_TAGS = ['Eating Out', 'Food Delivery', 'Parties & Outings', 'Movies & Events', 'Shopping']

export const GOAL_EMOJIS = ['💻', '🏖️', '📱', '🎧', '🛟', '🎓', '🎸', '✈️', '🚲', '🎁', '🎮', '👟']
