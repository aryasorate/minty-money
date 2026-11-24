import type { Bill, Friend, GoalCategory, Group, IncomeSource, JarId, PersonaId, PersonaMeta, Share } from './types'

/** A recurring spending behaviour used by the synthetic-history generator. */
export interface SpendPattern {
  jarId: JarId
  tag: string
  merchants: string[]
  perDay: number // expected transactions per day
  min: number
  max: number
  step?: number
  weekendMult?: number
}

export interface FixedCharge {
  day: number
  jarId: JarId
  tag: string
  merchant: string
  amount: number
}

export interface SplitSeed {
  title: string
  emoji: string
  day: number
  amount: number
  paidBy: string // friend id or 'me'
  groupId?: string
  jarId: JarId
  shares: Omit<Share, 'amount'>[]
}

export interface GoalSeed {
  name: string
  emoji: string
  category: GoalCategory
  target: number
  saved: number
  monthsAhead: number
  priority?: boolean
}

export interface SmsPreset {
  label: string
  sms: string // {date} and {acct} placeholders are filled in at send time
}

export interface PersonaSpec {
  meta: PersonaMeta
  account: string
  bank: string
  incomes: IncomeSource[]
  budgets: Record<JarId, number>
  bills: Omit<Bill, 'paidMonths'>[]
  fixed: FixedCharge[]
  patterns: SpendPattern[]
  /** Spending multiplier for days 1–10 (the "allowance gone by the 10th" effect). */
  frontLoad?: number
  /** Probability that the monthly savings transfer actually happens. */
  savingsReliability: number
  savingsDay: number
  /** Irregular freelance credits in past months: [min, max] amount. */
  freelance?: { merchant: string; min: number; max: number; perMonth: number }
  /** Multipliers applied to tags in the *current* month (to make insights interesting). */
  currentMonthTagFactor?: Record<string, number>
  friends: Friend[]
  groups: Group[]
  splits: SplitSeed[]
  goals: GoalSeed[]
  sms: SmsPreset[]
}

const chai: SmsPreset = {
  label: '₹40 chai (UPI)',
  sms: 'Rs.40.00 debited from A/c {acct} on {date} to VPA chaipoint@ybl (UPI Ref No 412398765). Not you? Call 18002586161 -{bank}',
}
const swiggy: SmsPreset = {
  label: '₹349 Swiggy order',
  sms: 'INR 349.00 spent on {bank} Debit Card {acct} at SWIGGY on {date}. Avl Bal INR 4,215.30. Not you? SMS BLOCK to 5676791',
}
const uber: SmsPreset = {
  label: '₹186 Uber ride',
  sms: 'Rs 186.00 paid to UBER INDIA via UPI from A/c {acct} on {date}. UPI Ref 509812331. -{bank}',
}
const bms: SmsPreset = {
  label: '₹420 BookMyShow',
  sms: 'Your A/c {acct} is debited for Rs.420.00 on {date} towards BOOKMYSHOW. Avl Bal Rs.3,112.45 -{bank}',
}
const xerox: SmsPreset = {
  label: '₹60 printouts',
  sms: 'Sent Rs.60.00 from {bank} A/c {acct} to campusxerox@okaxis on {date}. UPI Ref 778120934. Not you? Call 18001080',
}
const zomato: SmsPreset = {
  label: '₹520 Zomato',
  sms: 'Rs.520.00 debited from A/c {acct} on {date} to VPA zomato@hdfcbank (UPI Ref No 601245871). -{bank}',
}

export const PERSONA_SPECS: Record<PersonaId, PersonaSpec> = {
  arjun: {
    meta: {
      id: 'arjun',
      name: 'Arjun',
      age: 19,
      course: 'B.Sc. Physics, 1st year',
      college: 'Hansraj College, Delhi',
      archetype: 'The Struggler',
      quote: 'Allowance gone by the 10th of the month.',
      painPoint: 'Always runs out before month-end; collecting rent from roommates is awkward.',
      wants: 'Simple tools to stretch money and avoid borrowing',
      avatarColor: '#f0745a',
    },
    account: 'XX7731',
    bank: 'SBI',
    incomes: [{ id: 'inc_allow', name: "Parents' allowance", kind: 'allowance', amount: 9000, creditDay: 1 }],
    budgets: { rent: 4000, food: 2600, travel: 600, academics: 500, fun: 600, other: 400, savings: 300 },
    bills: [
      { id: 'bill_rent', name: 'PG rent (your share)', amount: 3500, dueDay: 3, jarId: 'rent', tag: 'Rent' },
      { id: 'bill_wifi', name: 'Wifi (your share)', amount: 200, dueDay: 8, jarId: 'rent', tag: 'Utilities' },
      { id: 'bill_jio', name: 'Jio recharge', amount: 299, dueDay: 12, jarId: 'rent', tag: 'Phone Recharge' },
    ],
    fixed: [],
    patterns: [
      { jarId: 'food', tag: 'Mess & Canteen', merchants: ['College Canteen', 'Hostel Mess Extra', 'Kamla Nagar Dhaba'], perDay: 0.9, min: 40, max: 80 },
      { jarId: 'food', tag: 'Snacks & Chai', merchants: ['Campus Tapri', 'Chai Point', 'Amul Parlour'], perDay: 0.7, min: 15, max: 35 },
      { jarId: 'food', tag: 'Food Delivery', merchants: ['Swiggy', 'Zomato'], perDay: 0.06, min: 150, max: 250, weekendMult: 1.8 },
      { jarId: 'travel', tag: 'Cabs & Autos', merchants: ['Rapido', 'Auto (UPI)'], perDay: 0.22, min: 30, max: 80 },
      { jarId: 'travel', tag: 'Metro & Bus', merchants: ['Delhi Metro'], perDay: 0.15, min: 20, max: 40 },
      { jarId: 'academics', tag: 'Printing', merchants: ['Campus Xerox'], perDay: 0.25, min: 10, max: 40 },
      { jarId: 'academics', tag: 'Books & Stationery', merchants: ['Campus Book Store', 'Amazon'], perDay: 0.04, min: 120, max: 300 },
      { jarId: 'fun', tag: 'Movies & Events', merchants: ['BookMyShow', 'PVR'], perDay: 0.035, min: 150, max: 260, weekendMult: 2 },
      { jarId: 'fun', tag: 'Parties & Outings', merchants: ['Birthday treat', 'Hudson Lane Cafe'], perDay: 0.04, min: 100, max: 250, weekendMult: 2 },
      { jarId: 'other', tag: 'Personal Care', merchants: ['Apollo Pharmacy', 'Salon'], perDay: 0.07, min: 50, max: 150 },
      { jarId: 'other', tag: 'Gifts', merchants: ['Archies', 'Gift for friend'], perDay: 0.01, min: 200, max: 400 },
    ],
    frontLoad: 1.5,
    savingsReliability: 0.5,
    savingsDay: 2,
    friends: [
      { id: 'f_rohan', name: 'Rohan' },
      { id: 'f_sameer', name: 'Sameer' },
      { id: 'f_dev', name: 'Dev' },
      { id: 'f_aisha', name: 'Aisha' },
    ],
    groups: [
      { id: 'g_rent', name: 'Hostel Rent', emoji: '🏠', memberIds: ['f_rohan', 'f_sameer'] },
      { id: 'g_lab', name: 'Lab Partners', emoji: '🔬', memberIds: ['f_dev', 'f_aisha'] },
    ],
    splits: [
      {
        title: 'PG Rent – Room 204', emoji: '🏠', day: 3, amount: 10500, paidBy: 'me', groupId: 'g_rent', jarId: 'rent',
        shares: [
          { personId: 'me', settled: true },
          { personId: 'f_rohan', settled: true },
          { personId: 'f_sameer', settled: false },
        ],
      },
      {
        title: 'Wifi – ACT Fibernet', emoji: '📶', day: 8, amount: 600, paidBy: 'me', groupId: 'g_rent', jarId: 'rent',
        shares: [
          { personId: 'me', settled: true },
          { personId: 'f_rohan', settled: false },
          { personId: 'f_sameer', settled: false },
        ],
      },
      {
        title: 'Lab manual printouts', emoji: '🖨️', day: 6, amount: 270, paidBy: 'f_dev', groupId: 'g_lab', jarId: 'academics',
        shares: [
          { personId: 'me', settled: false },
          { personId: 'f_dev', settled: true },
          { personId: 'f_aisha', settled: true },
        ],
      },
    ],
    goals: [
      { name: 'Emergency cushion', emoji: '🛟', category: 'Emergency', target: 3000, saved: 600, monthsAhead: 4, priority: true },
      { name: 'New headphones', emoji: '🎧', category: 'Gadget', target: 2500, saved: 400, monthsAhead: 3 },
    ],
    sms: [chai, xerox, swiggy, {
      label: '₹1,500 from Dad',
      sms: 'Your A/c {acct} is credited with Rs.1,500.00 on {date} by UPI from RAJESH KUMAR (Ref 330918274). Avl Bal Rs.2,104.10 -{bank}',
    }],
  },

  ankit: {
    meta: {
      id: 'ankit',
      name: 'Ankit',
      age: 22,
      course: 'B.Tech CSE, Final year',
      college: 'NIT Trichy',
      archetype: 'The Hustler',
      quote: 'Internship pays, but I never manage to save.',
      painPoint: 'Juggles a stipend and freelance gigs; irregular inflow makes saving hard.',
      wants: 'Control over income streams — and to actually save',
      avatarColor: '#3ba6e8',
    },
    account: 'XX4521',
    bank: 'HDFC Bank',
    incomes: [
      { id: 'inc_allow', name: 'Home allowance', kind: 'allowance', amount: 6000, creditDay: 1 },
      { id: 'inc_stipend', name: 'Internship stipend', kind: 'stipend', amount: 10000, creditDay: 7 },
      { id: 'inc_free', name: 'Freelance design gigs', kind: 'freelance', amount: 3500, creditDay: 0 },
    ],
    budgets: { rent: 5000, food: 3500, travel: 1200, academics: 800, fun: 1800, other: 700, savings: 3000 },
    bills: [
      { id: 'bill_rent', name: 'Flat rent (your share)', amount: 4500, dueDay: 5, jarId: 'rent', tag: 'Rent' },
      { id: 'bill_airtel', name: 'Airtel postpaid', amount: 349, dueDay: 13, jarId: 'rent', tag: 'Phone Recharge' },
    ],
    fixed: [
      { day: 12, jarId: 'fun', tag: 'Subscriptions', merchant: 'Spotify', amount: 119 },
      { day: 20, jarId: 'fun', tag: 'Subscriptions', merchant: 'Netflix', amount: 199 },
    ],
    patterns: [
      { jarId: 'food', tag: 'Mess & Canteen', merchants: ['Night Canteen', 'Mess Extras'], perDay: 0.5, min: 60, max: 120 },
      { jarId: 'food', tag: 'Food Delivery', merchants: ['Swiggy', 'Zomato'], perDay: 0.1, min: 180, max: 350, weekendMult: 1.5 },
      { jarId: 'food', tag: 'Snacks & Chai', merchants: ['Chai Point', 'Campus Tapri'], perDay: 0.5, min: 20, max: 60 },
      { jarId: 'travel', tag: 'Cabs & Autos', merchants: ['Uber', 'Ola', 'Rapido'], perDay: 0.14, min: 120, max: 300 },
      { jarId: 'travel', tag: 'Metro & Bus', merchants: ['City Bus', 'Metro Card Recharge'], perDay: 0.35, min: 20, max: 50 },
      { jarId: 'academics', tag: 'Books & Stationery', merchants: ['Amazon', 'Campus Book Store'], perDay: 0.035, min: 200, max: 500 },
      { jarId: 'academics', tag: 'Printing', merchants: ['Campus Xerox'], perDay: 0.2, min: 10, max: 40 },
      { jarId: 'fun', tag: 'Parties & Outings', merchants: ['Social', 'Bowling with team', 'Hard Rock Cafe'], perDay: 0.045, min: 250, max: 550, weekendMult: 2 },
      { jarId: 'fun', tag: 'Movies & Events', merchants: ['BookMyShow', 'PVR'], perDay: 0.035, min: 200, max: 400, weekendMult: 2 },
      { jarId: 'other', tag: 'Personal Care', merchants: ['Apollo Pharmacy', 'Salon'], perDay: 0.1, min: 80, max: 200 },
      { jarId: 'other', tag: 'Misc', merchants: ['Amazon', 'Decathlon'], perDay: 0.03, min: 100, max: 300 },
    ],
    savingsReliability: 0.85,
    savingsDay: 8,
    freelance: { merchant: 'Freelance client (UPI)', min: 1500, max: 6000, perMonth: 1.6 },
    currentMonthTagFactor: { 'Food Delivery': 1.4, 'Cabs & Autos': 0.7 },
    friends: [
      { id: 'f_vikram', name: 'Vikram' },
      { id: 'f_neha', name: 'Neha' },
      { id: 'f_rahul', name: 'Rahul' },
      { id: 'f_karan', name: 'Karan' },
    ],
    groups: [
      { id: 'g_flat', name: 'Flatmates', emoji: '🏢', memberIds: ['f_vikram', 'f_karan'] },
      { id: 'g_hack', name: 'Hackathon Team', emoji: '💻', memberIds: ['f_neha', 'f_rahul'] },
    ],
    splits: [
      {
        title: 'Monthly groceries run', emoji: '🛒', day: 6, amount: 1200, paidBy: 'me', groupId: 'g_flat', jarId: 'food',
        shares: [
          { personId: 'me', settled: true },
          { personId: 'f_vikram', settled: false },
          { personId: 'f_karan', settled: true },
        ],
      },
      {
        title: 'Pizza at hackathon', emoji: '🍕', day: 9, amount: 1200, paidBy: 'f_neha', groupId: 'g_hack', jarId: 'food',
        shares: [
          { personId: 'me', settled: false },
          { personId: 'f_neha', settled: true },
          { personId: 'f_rahul', settled: false },
        ],
      },
    ],
    goals: [
      { name: 'New Laptop', emoji: '💻', category: 'Gadget', target: 60000, saved: 18500, monthsAhead: 8, priority: true },
      { name: 'Goa trip with squad', emoji: '🏖️', category: 'Trip', target: 12000, saved: 4000, monthsAhead: 5 },
      { name: 'Emergency fund', emoji: '🛟', category: 'Emergency', target: 15000, saved: 9000, monthsAhead: 6 },
    ],
    sms: [
      {
        label: '₹5,000 freelance payment',
        sms: 'Your A/c {acct} is credited with INR 5,000.00 on {date} by UPI from ACME DESIGN STUDIO (Ref 612398001). Avl Bal INR 23,415.50 -{bank}',
      },
      swiggy, uber, bms,
    ],
  },

  priya: {
    meta: {
      id: 'priya',
      name: 'Priya',
      age: 21,
      course: 'BBA, 3rd year (hostel senior)',
      college: 'Christ University, Bengaluru',
      archetype: 'The Social Butterfly',
      quote: "I can't say no to outings, but my wallet can.",
      painPoint: 'Social FOMO drives overspending on food, parties and subscriptions.',
      wants: 'Guilt-free spending, within safe limits',
      avatarColor: '#c77dea',
    },
    account: 'XX9902',
    bank: 'ICICI Bank',
    incomes: [{ id: 'inc_allow', name: "Parents' allowance", kind: 'allowance', amount: 12000, creditDay: 1 }],
    budgets: { rent: 4300, food: 3500, travel: 1000, academics: 500, fun: 1900, other: 500, savings: 300 },
    bills: [
      { id: 'bill_hostel', name: 'Hostel fee (monthly)', amount: 4000, dueDay: 4, jarId: 'rent', tag: 'Rent' },
      { id: 'bill_vi', name: 'Vi recharge', amount: 299, dueDay: 13, jarId: 'rent', tag: 'Phone Recharge' },
    ],
    fixed: [
      { day: 9, jarId: 'fun', tag: 'Subscriptions', merchant: 'Spotify', amount: 119 },
      { day: 15, jarId: 'fun', tag: 'Subscriptions', merchant: 'Netflix', amount: 199 },
    ],
    patterns: [
      { jarId: 'food', tag: 'Eating Out', merchants: ['Third Wave Coffee', 'Truffles', 'Chianti', 'Cafe Delhi Heights'], perDay: 0.18, min: 200, max: 480, weekendMult: 2 },
      { jarId: 'food', tag: 'Food Delivery', merchants: ['Swiggy', 'Zomato'], perDay: 0.11, min: 150, max: 350, weekendMult: 1.4 },
      { jarId: 'food', tag: 'Mess & Canteen', merchants: ['College Canteen', 'Hostel Mess Extras'], perDay: 0.45, min: 40, max: 100 },
      { jarId: 'travel', tag: 'Cabs & Autos', merchants: ['Uber', 'Ola', 'Namma Yatri'], perDay: 0.15, min: 100, max: 250, weekendMult: 1.5 },
      { jarId: 'travel', tag: 'Metro & Bus', merchants: ['Namma Metro'], perDay: 0.2, min: 20, max: 50 },
      { jarId: 'academics', tag: 'Printing', merchants: ['Campus Xerox'], perDay: 0.15, min: 10, max: 50 },
      { jarId: 'academics', tag: 'Books & Stationery', merchants: ['Sapna Book House'], perDay: 0.02, min: 150, max: 350 },
      { jarId: 'fun', tag: 'Parties & Outings', merchants: ['Toit', 'Birthday dinner', 'Bowling at Amoeba'], perDay: 0.05, min: 250, max: 550, weekendMult: 2 },
      { jarId: 'fun', tag: 'Shopping', merchants: ['Myntra', 'Ajio', 'Zara'], perDay: 0.025, min: 300, max: 700 },
      { jarId: 'fun', tag: 'Movies & Events', merchants: ['BookMyShow', 'PVR'], perDay: 0.035, min: 250, max: 400, weekendMult: 2 },
      { jarId: 'other', tag: 'Personal Care', merchants: ['Nykaa', 'Salon', 'Apollo Pharmacy'], perDay: 0.06, min: 80, max: 200 },
    ],
    savingsReliability: 0.6,
    savingsDay: 2,
    currentMonthTagFactor: { 'Eating Out': 1.25, 'Cabs & Autos': 0.6, Shopping: 0.6 },
    friends: [
      { id: 'f_ananya', name: 'Ananya' },
      { id: 'f_riya', name: 'Riya' },
      { id: 'f_kabir', name: 'Kabir' },
      { id: 'f_meera', name: 'Meera' },
    ],
    groups: [
      { id: 'g_squad', name: 'Weekend Squad', emoji: '🎉', memberIds: ['f_ananya', 'f_riya', 'f_kabir'] },
      { id: 'g_wing', name: 'Hostel Wing B', emoji: '🏠', memberIds: ['f_meera', 'f_riya'] },
    ],
    splits: [
      {
        title: 'Brunch at Cafe Delhi Heights', emoji: '🥞', day: 7, amount: 2400, paidBy: 'f_riya', groupId: 'g_squad', jarId: 'food',
        shares: [
          { personId: 'me', settled: false },
          { personId: 'f_ananya', settled: true },
          { personId: 'f_riya', settled: true },
          { personId: 'f_kabir', settled: false },
        ],
      },
      {
        title: 'Movie night', emoji: '🎬', day: 9, amount: 1200, paidBy: 'me', groupId: 'g_squad', jarId: 'fun',
        shares: [
          { personId: 'me', settled: true },
          { personId: 'f_ananya', settled: true },
          { personId: 'f_riya', settled: false },
          { personId: 'f_kabir', settled: false },
        ],
      },
    ],
    goals: [
      { name: 'Goa trip with squad', emoji: '🏖️', category: 'Trip', target: 15000, saved: 3200, monthsAhead: 6, priority: true },
      { name: 'Concert tickets', emoji: '🎸', category: 'Lifestyle', target: 4500, saved: 1500, monthsAhead: 2 },
    ],
    sms: [
      {
        label: '₹1,200 group pizza',
        sms: 'Rs.1,200.00 debited from A/c {acct} on {date} to VPA dominos@icici (UPI Ref No 702213345). -{bank}',
      },
      zomato, uber, bms,
    ],
  },

  kunal: {
    meta: {
      id: 'kunal',
      name: 'Kunal',
      age: 20,
      course: 'B.Com, 2nd year (outstation)',
      college: 'Symbiosis, Pune',
      archetype: 'The Digital-Savvy Saver',
      quote: 'Mess, rent, travel — I spend more than expected.',
      painPoint: 'Pays everything by UPI and loses track of small spends.',
      wants: 'Gamified nudges and micro-savings to build good habits',
      avatarColor: '#16a34a',
    },
    account: 'XX3318',
    bank: 'Axis Bank',
    incomes: [{ id: 'inc_allow', name: "Parents' allowance", kind: 'allowance', amount: 10000, creditDay: 1 }],
    budgets: { rent: 4800, food: 2800, travel: 700, academics: 500, fun: 600, other: 300, savings: 300 },
    bills: [
      { id: 'bill_pg', name: 'PG rent', amount: 4500, dueDay: 5, jarId: 'rent', tag: 'Rent' },
      { id: 'bill_jio', name: 'Jio recharge', amount: 299, dueDay: 22, jarId: 'rent', tag: 'Phone Recharge' },
    ],
    fixed: [
      { day: 11, jarId: 'fun', tag: 'Subscriptions', merchant: 'YouTube Premium', amount: 129 },
      { day: 18, jarId: 'fun', tag: 'Subscriptions', merchant: 'Spotify', amount: 119 },
    ],
    patterns: [
      { jarId: 'food', tag: 'Snacks & Chai', merchants: ['Chai Point', 'Amruttulya', 'Vada Pav Stall', 'Campus Tapri', 'Cold drink shop'], perDay: 1.55, min: 10, max: 28 },
      { jarId: 'food', tag: 'Mess & Canteen', merchants: ['PG Mess Extras', 'College Canteen'], perDay: 0.55, min: 50, max: 90 },
      { jarId: 'food', tag: 'Groceries', merchants: ['Blinkit', 'Zepto', 'DMart'], perDay: 0.08, min: 80, max: 200 },
      { jarId: 'food', tag: 'Food Delivery', merchants: ['Swiggy', 'Zomato'], perDay: 0.05, min: 150, max: 250, weekendMult: 1.6 },
      { jarId: 'travel', tag: 'Metro & Bus', merchants: ['Pune Metro', 'PMPML Bus'], perDay: 0.5, min: 20, max: 40 },
      { jarId: 'travel', tag: 'Cabs & Autos', merchants: ['Rapido', 'Auto (UPI)'], perDay: 0.08, min: 40, max: 80 },
      { jarId: 'academics', tag: 'Printing', merchants: ['Campus Xerox'], perDay: 0.25, min: 10, max: 40 },
      { jarId: 'academics', tag: 'Books & Stationery', merchants: ['Amazon', 'Stationery shop'], perDay: 0.03, min: 100, max: 250 },
      { jarId: 'fun', tag: 'Movies & Events', merchants: ['BookMyShow'], perDay: 0.03, min: 180, max: 260, weekendMult: 2 },
      { jarId: 'other', tag: 'Personal Care', merchants: ['Medical store', 'Salon'], perDay: 0.08, min: 30, max: 120 },
    ],
    savingsReliability: 0.9,
    savingsDay: 2,
    friends: [
      { id: 'f_aditya', name: 'Aditya' },
      { id: 'f_ishaan', name: 'Ishaan' },
      { id: 'f_tanvi', name: 'Tanvi' },
    ],
    groups: [{ id: 'g_pg', name: 'PG Mates', emoji: '🏠', memberIds: ['f_aditya', 'f_ishaan'] }],
    splits: [
      {
        title: 'Electricity bill', emoji: '⚡', day: 6, amount: 900, paidBy: 'f_aditya', groupId: 'g_pg', jarId: 'rent',
        shares: [
          { personId: 'me', settled: false },
          { personId: 'f_aditya', settled: true },
          { personId: 'f_ishaan', settled: false },
        ],
      },
      {
        title: 'Maggi & chai night', emoji: '🍜', day: 8, amount: 240, paidBy: 'me', groupId: 'g_pg', jarId: 'food',
        shares: [
          { personId: 'me', settled: true },
          { personId: 'f_aditya', settled: false },
          { personId: 'f_ishaan', settled: false },
        ],
      },
    ],
    goals: [
      { name: 'New phone', emoji: '📱', category: 'Gadget', target: 25000, saved: 7200, monthsAhead: 7, priority: true },
      { name: 'Emergency fund', emoji: '🛟', category: 'Emergency', target: 10000, saved: 3200, monthsAhead: 6 },
    ],
    sms: [chai, {
      label: '₹25 vada pav',
      sms: 'Rs 25.00 sent via UPI from A/c {acct} to VADA PAV STALL (vadapav.kothrud@okaxis) on {date}. Ref 881230119 -{bank}',
    }, uber, xerox],
  },
}

export const PERSONA_ORDER: PersonaId[] = ['arjun', 'ankit', 'priya', 'kunal']
