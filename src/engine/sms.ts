import type { ISODate } from '@/lib/date'
import type { Detection, JarId } from '@/data/types'
import { uid } from '@/lib/id'

/**
 * Bank SMS parser — genuinely parses common Indian bank/UPI SMS formats.
 * (In the PoC the SMS *source* is simulated; the parsing and categorisation are real.)
 */

const AMOUNT = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i
const DEBIT = /\b(debited|spent|paid|sent|withdrawn|purchase|debit)\b/i
const CREDIT = /\b(credited|received|deposited|credit)\b/i
const ACCOUNT = /(?:a\/c|acct|account|card)\s*(?:no\.?\s*)?([x*]{0,4}\d{3,4})/i
const VPA = /([a-z0-9._-]+)@([a-z]+)/i
const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak', 'PNB', 'Bank of Baroda', 'Yes Bank', 'HDFC', 'ICICI', 'Axis']

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function extractMerchant(sms: string, kind: 'debit' | 'credit'): string {
  if (kind === 'credit') {
    const m = sms.match(/(?:by|from)\s+(?:upi\s+from\s+|neft\s+from\s+|imps\s+from\s+)?([A-Z][A-Z0-9 &.'-]{2,40}?)(?=\s*(?:\(|ref|on\b|\.|-|$))/i)
    if (m) return titleCase(m[1].replace(/^upi from /i, ''))
  }
  const at = sms.match(/\b(?:at|towards)\s+([A-Z0-9][A-Z0-9 &.'-]{1,40}?)(?=\s+(?:on|via|ref|avl)\b|\.|$)/i)
  if (at) return titleCase(at[1])
  const to = sms.match(/\bto\s+(?!vpa\b)([A-Z][A-Z0-9 &.'-]{1,40}?)(?=\s+(?:via|on|ref|\()|\.|$)/i)
  if (to && !/^(?:a\/c|account)/i.test(to[1])) return titleCase(to[1])
  const vpa = sms.match(VPA)
  if (vpa) {
    const handle = vpa[1].split('.')[0].toLowerCase()
    return KNOWN_HANDLES[handle] ?? titleCase(handle)
  }
  return 'Unknown merchant'
}

/** Pretty names for common merchant UPI handles. */
const KNOWN_HANDLES: Record<string, string> = {
  chaipoint: 'Chai Point',
  zomato: 'Zomato',
  swiggy: 'Swiggy',
  dominos: "Domino's",
  campusxerox: 'Campus Xerox',
  bookmyshow: 'BookMyShow',
  blinkit: 'Blinkit',
  zepto: 'Zepto',
}

/** Merchant keyword → jar + sub-category. Order matters (first match wins). */
const RULES: { re: RegExp; jarId: JarId; tag: string }[] = [
  { re: /swiggy|zomato|eatsure|dominos|domino|pizza|kfc|mcdonald|burger/i, jarId: 'food', tag: 'Food Delivery' },
  { re: /chai|tapri|tea|vada|pav|amul|coffee|cafe|bakery|juice|cold drink/i, jarId: 'food', tag: 'Snacks & Chai' },
  { re: /canteen|mess|dhaba|tiffin/i, jarId: 'food', tag: 'Mess & Canteen' },
  { re: /blinkit|zepto|dmart|bigbasket|instamart|grocer/i, jarId: 'food', tag: 'Groceries' },
  { re: /uber|ola|rapido|namma yatri|auto/i, jarId: 'travel', tag: 'Cabs & Autos' },
  { re: /metro|bus|pmpml|best|dtc/i, jarId: 'travel', tag: 'Metro & Bus' },
  { re: /irctc|redbus|railway|makemytrip|indigo/i, jarId: 'travel', tag: 'Trains & Trips' },
  { re: /xerox|print|photocopy/i, jarId: 'academics', tag: 'Printing' },
  { re: /book|stationery|coursera|udemy|unacademy/i, jarId: 'academics', tag: 'Books & Stationery' },
  { re: /bookmyshow|pvr|inox|cinema|movie/i, jarId: 'fun', tag: 'Movies & Events' },
  { re: /netflix|spotify|prime|hotstar|youtube/i, jarId: 'fun', tag: 'Subscriptions' },
  { re: /myntra|ajio|zara|h&m|nykaa fashion/i, jarId: 'fun', tag: 'Shopping' },
  { re: /jio|airtel|vi |vodafone|recharge|fibernet|electricity|bescom/i, jarId: 'rent', tag: 'Utilities' },
  { re: /pharmacy|apollo|medical|salon|nykaa/i, jarId: 'other', tag: 'Personal Care' },
]

export function categorise(merchant: string, sms = ''): { jarId: JarId; tag: string; confidence: number } {
  for (const r of RULES) if (r.re.test(merchant)) return { jarId: r.jarId, tag: r.tag, confidence: 0.93 }
  for (const r of RULES) if (r.re.test(sms)) return { jarId: r.jarId, tag: r.tag, confidence: 0.78 }
  return { jarId: 'other', tag: 'Misc', confidence: 0.4 }
}

export function parseSms(sms: string, date: ISODate): Detection | null {
  const amt = sms.match(AMOUNT)
  if (!amt) return null
  const amount = Number(amt[1].replace(/,/g, ''))
  if (!amount || !Number.isFinite(amount)) return null
  const isCredit = CREDIT.test(sms) && !/debited|spent|paid to|sent/i.test(sms)
  if (!isCredit && !DEBIT.test(sms)) return null
  const kind = isCredit ? 'credit' : 'debit'
  const merchant = extractMerchant(sms, kind)
  const account = sms.match(ACCOUNT)?.[1]
  const bank = BANKS.find((b) => sms.toLowerCase().includes(b.toLowerCase()))
  const cat = categorise(merchant, sms)
  return {
    id: uid('det'),
    sms,
    kind,
    amount,
    merchant,
    account,
    bank,
    suggestedJar: cat.jarId,
    suggestedTag: cat.tag,
    confidence: cat.confidence,
    date,
  }
}

export function fillSmsTemplate(tpl: string, date: ISODate, acct: string, bank: string): string {
  const [y, m, d] = date.split('-')
  return tpl.replace(/\{date\}/g, `${d}-${m}-${y.slice(2)}`).replace(/\{acct\}/g, acct).replace(/\{bank\}/g, bank)
}
