export interface Lesson {
  id: string
  title: string
  minutes: number
  body: string[]
  takeaway: string
}

export interface Course {
  id: string
  title: string
  emoji: string
  blurb: string
  color: string
  lessons: Lesson[]
}

/** Original, bite-sized lesson content written for the prototype. */
export const COURSES: Course[] = [
  {
    id: 'budgeting',
    title: 'Budgeting 101 for Students',
    emoji: '🧮',
    blurb: 'Make your allowance last the whole month — without living on Maggi.',
    color: '#16a34a',
    lessons: [
      {
        id: 'b1',
        title: 'The jar method',
        minutes: 3,
        body: [
          'Budgeting is just deciding where money goes before it arrives. The simplest system is jars: one pot for each kind of spending.',
          'Start with the money you cannot avoid — rent, mess fees, recharges. Then pay yourself first by moving a small amount to savings the day your allowance lands. Whatever is left gets split across food, travel, fun and the rest.',
          'When a jar runs out, you either stop or consciously move money from another jar. That one decision is what keeps month-ends calm.',
        ],
        takeaway: 'Fixed costs first, savings second, everything else gets what is left.',
      },
      {
        id: 'b2',
        title: 'Your daily safe-to-spend number',
        minutes: 2,
        body: [
          'Big monthly numbers are hard to feel. Daily numbers are easy. Divide what is left in your variable jars by the days left in the month — that is your safe-to-spend for today.',
          'Under it? That is a streak day. Over it? Tomorrow’s number shrinks a little. This turns budgeting into a game you play every day instead of a panic on the 25th.',
        ],
        takeaway: 'Check one number a day, not a spreadsheet a month.',
      },
      {
        id: 'b3',
        title: 'Small spends, big leaks',
        minutes: 3,
        body: [
          'A ₹20 chai feels like nothing. Three a day for a month is ₹1,800 — often more than a student’s travel budget.',
          'Auto-detected UPI spends make these leaks visible. Pick one leak, set a weekly cap, and redirect the difference to a goal you actually care about.',
        ],
        takeaway: 'Find your biggest small habit and cap it weekly.',
      },
    ],
  },
  {
    id: 'investing',
    title: 'Investment Basics',
    emoji: '🌱',
    blurb: 'Turn pocket money into future wealth. Start small, dream big.',
    color: '#3ba6e8',
    lessons: [
      {
        id: 'i1',
        title: 'Emergency fund before anything else',
        minutes: 3,
        body: [
          'Before investing, build a cushion of one to two months of expenses in a savings account. It stops a lost phone or a surprise fee from turning into debt.',
          'Treat the emergency fund as a goal with a deadline. Once it is full, new savings can start working harder.',
        ],
        takeaway: 'A cushion first — then let money grow.',
      },
      {
        id: 'i2',
        title: 'How compounding actually works',
        minutes: 4,
        body: [
          'Compounding means your returns earn returns. ₹1,000 a month for 10 years at 10% a year grows to roughly ₹2 lakh, even though you only put in ₹1.2 lakh.',
          'The biggest lever is time, not amount. Starting at 20 instead of 25 can matter more than doubling what you invest later.',
        ],
        takeaway: 'Start early, even if it is small.',
      },
      {
        id: 'i3',
        title: 'SIPs, index funds & what to avoid',
        minutes: 4,
        body: [
          'A SIP (systematic investment plan) invests a fixed amount every month — some start at ₹100–500. Diversified index funds spread money across many companies, which keeps costs and risk lower than picking single stocks.',
          'Be wary of “guaranteed” returns, tips from social media, and anything you do not understand. This lesson is general education, not personal financial advice.',
        ],
        takeaway: 'Boring, diversified and regular beats exciting and risky.',
      },
    ],
  },
  {
    id: 'hustles',
    title: 'Side Hustle Secrets',
    emoji: '🚀',
    blurb: 'Earn extra cash while studying — from freelancing to campus businesses.',
    color: '#f59e3b',
    lessons: [
      {
        id: 'h1',
        title: 'Pick a skill people pay for',
        minutes: 3,
        body: [
          'Design, video editing, tutoring juniors, coding small websites, content writing — campus is full of people who need these.',
          'Start with one service, a clear price, and three samples. Your seniors and college clubs are your first clients.',
        ],
        takeaway: 'One skill, one price, three samples.',
      },
      {
        id: 'h2',
        title: 'Managing irregular income',
        minutes: 3,
        body: [
          'Gig money arrives in lumps. The trick: never budget it before it lands. When it does, split it immediately — a fixed share to savings or a goal, the rest to next month’s buffer.',
          'Minty’s income prompt does exactly this the moment a credit SMS is detected.',
        ],
        takeaway: 'Split side income the day it arrives.',
      },
      {
        id: 'h3',
        title: 'Basics of getting paid safely',
        minutes: 2,
        body: [
          'Take an advance for new clients, share invoices with clear dates, and never share OTPs or UPI PINs to “receive” money — receiving never needs a PIN.',
        ],
        takeaway: 'Receiving money never needs your PIN.',
      },
    ],
  },
  {
    id: 'hacks',
    title: 'Money Hacks',
    emoji: '💡',
    blurb: 'Smart tricks to cut costs and still enjoy college life.',
    color: '#c77dea',
    lessons: [
      {
        id: 'm1',
        title: 'Student discounts everywhere',
        minutes: 2,
        body: [
          'Many software tools, streaming plans, travel apps and cafés offer student pricing. Your college ID or email can unlock 10–50% off.',
        ],
        takeaway: 'Always ask: is there a student price?',
      },
      {
        id: 'm2',
        title: 'Beating peer pressure, kindly',
        minutes: 3,
        body: [
          'Suggest the plan before someone else does: potluck, a picnic, a free campus event. People usually just want time together, not the expensive venue.',
          'Keep a separate “fun” jar so saying yes to friends never eats your rent.',
        ],
        takeaway: 'Be the friend who suggests the cheaper plan.',
      },
      {
        id: 'm3',
        title: 'Subscription audit',
        minutes: 2,
        body: ['List every subscription. Cancel what you did not use last month, and share family plans with flatmates for the rest.'],
        takeaway: 'Unused subscriptions are a monthly tax.',
      },
    ],
  },
]
