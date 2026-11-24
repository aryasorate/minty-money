import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, ChevronRight, Flame, Target, Wallet } from 'lucide-react'
import { useProfile } from '@/store/useStore'
import { Card, CardHeader, PageHeader, Progress, StatCard, Pill } from '@/components/ui/primitives'
import { JarIcon } from '@/components/JarIcon'
import { TransactionList } from '@/components/TransactionList'
import { AlertCard } from '@/features/alerts/AlertCard'
import { JAR_META, SPEND_JARS } from '@/data/catalog'
import { jarStatuses, monthStats, weeklyPattern, expectedMonthlyIncome } from '@/engine/money'
import { deriveAlerts, sortAlerts } from '@/engine/alerts'
import { spendStreak } from '@/engine/gamification'
import { goalStatus, priorityGoal } from '@/engine/goals'
import { pct, rupees, rupeesShort } from '@/lib/format'

export function DashboardPage() {
  const p = useProfile()
  const s = useMemo(() => monthStats(p), [p])
  const jars = useMemo(() => jarStatuses(p), [p])
  const weekly = useMemo(() => weeklyPattern(p), [p])
  const alerts = useMemo(() => sortAlerts(deriveAlerts(p)).slice(0, 4), [p])
  const streak = useMemo(() => spendStreak(p), [p])
  const goal = priorityGoal(p.goals)
  const income = Math.max(s.income, expectedMonthlyIncome(p))

  const donut = SPEND_JARS.map((j) => ({ id: j, name: JAR_META[j].name, value: s.byJar[j], color: JAR_META[j].color })).filter((d) => d.value > 0)
  const maxDay = Math.max(...weekly.map((w) => w.amount))
  const vsLast = s.lastMonthExpensesSamePeriod > 0 ? (s.expenses - s.lastMonthExpensesSamePeriod) / s.lastMonthExpensesSamePeriod : 0
  const variableUsed = s.variableBudget > 0 ? s.variableSpent / s.variableBudget : 0

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Dashboard"
        subtitle="How much money do I have left this month?"
        right={
          <p className="text-sm text-muted">
            Hi <span className="font-bold text-ink">{p.persona.name}</span> 👋
          </p>
        }
      />

      {/* Monthly snapshot */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Left this month"
          value={rupees(s.left)}
          icon={<Wallet size={16} />}
          sub={
            <span className="inline-flex items-center gap-1">
              {vsLast <= 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
              Spending {Math.abs(Math.round(vsLast * 100))}% {vsLast <= 0 ? 'less' : 'more'} than last month
            </span>
          }
          subTone={vsLast <= 0 ? 'good' : 'warn'}
        />
        <StatCard label="Fixed expenses" value={rupees(s.fixedSpent)} sub={`${pct(s.fixedSpent / income)} of income · rent & bills`} />
        <StatCard
          label="Variable pool"
          value={`${rupees(s.variableSpent)}`}
          sub={`${pct(variableUsed)} used of ${rupees(s.variableBudget)} · ${rupees(s.safePerDay)}/day safe`}
          subTone={variableUsed >= 0.8 ? 'warn' : 'muted'}
        />
        <StatCard
          label="Savings rate"
          value={pct(s.savingsRate)}
          sub={`◎ Target ${pct(s.savingsTarget)} · ${rupees(s.saved)} saved`}
          subTone={s.savingsRate >= s.savingsTarget ? 'good' : 'muted'}
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Money Jars Distribution" subtitle="Where this month's money went" right={<Link to="/jars" className="text-xs font-semibold text-brand-600 hover:underline">Open jars</Link>} />
          <div className="flex items-center gap-6 px-6 pb-5">
            <div className="shrink-0">
              <PieChart width={210} height={210}>
                <Pie data={donut} dataKey="value" cx={105} cy={105} innerRadius={62} outerRadius={95} paddingAngle={2} stroke="none" isAnimationActive>
                  {donut.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => rupees(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e3ebe6', fontSize: 12 }} />
              </PieChart>
            </div>
            <ul className="flex-1 space-y-2.5">
              {donut.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 text-ink/80">{d.name}</span>
                  <span className="font-semibold">{rupees(d.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader title="Weekly Spending Pattern" subtitle="Average daily spend by weekday (last 4 weeks)" right={<Pill tone="amber">Peak: {weekly.find((w) => w.amount === maxDay)?.day}</Pill>} />
          <div className="h-[230px] px-3 pb-3 pt-2">
            <ResponsiveContainer>
              <BarChart data={weekly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2ef" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={rupeesShort} width={48} />
                <Tooltip cursor={{ fill: '#f0f7f2' }} formatter={(v) => [rupees(Number(v)), 'Avg spend']} contentStyle={{ borderRadius: 12, border: '1px solid #e3ebe6', fontSize: 12 }} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {weekly.map((w) => (
                    <Cell key={w.day} fill={w.amount === maxDay ? '#f59e3b' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Alerts + side widgets */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Smart Alerts & Insights" subtitle="Your money coach, watching out for you" right={<Link to="/alerts" className="text-xs font-semibold text-brand-600 hover:underline">See all</Link>} />
          <div className="space-y-2.5 px-6 pb-6 pt-4">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} today={p.demoDate} compact />
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Flame size={22} />
              </div>
              <div>
                <p className="text-xl font-extrabold">{streak}-day streak</p>
                <p className="text-xs text-muted">within your daily budget</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < Math.min(streak, 7) ? 'bg-amber-400' : 'bg-[#edf2ef]'}`} />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-brand-700">{streak >= 3 ? 'Perfect streak! Keep it going 🔥' : 'Stay under budget today to build a streak'}</p>
          </Card>

          {goal && (
            <Link to="/goals">
              <Card className="p-5 transition hover:border-brand-300">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <Target size={14} className="text-brand-600" /> Priority goal
                  </p>
                  <ChevronRight size={16} className="text-muted" />
                </div>
                <p className="mt-2 text-base font-bold">
                  {goal.emoji} {goal.name}
                </p>
                <Progress value={goal.saved / goal.target} color="#16a34a" className="mt-3" />
                <div className="mt-2 flex justify-between text-xs text-muted">
                  <span>
                    <span className="font-semibold text-ink">{rupees(goal.saved)}</span> of {rupees(goal.target)}
                  </span>
                  <span>{rupees(goalStatus(goal, p.demoDate).monthlyTarget)}/mo needed</span>
                </div>
              </Card>
            </Link>
          )}

          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold text-muted">Jars at a glance</p>
            <div className="space-y-3">
              {jars
                .filter((j) => j.jar.type === 'variable')
                .map((j) => (
                  <div key={j.jar.id} className="flex items-center gap-3">
                    <JarIcon id={j.jar.id} size={28} />
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold">{j.jar.name}</span>
                        <span className="text-muted">{rupees(Math.max(0, j.left))} left</span>
                      </div>
                      <Progress value={j.pct} height="h-1.5" />
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent transactions" subtitle="Auto-detected, split and manual entries in one place" />
        <div className="px-6 pb-4">
          <TransactionList txns={p.transactions} today={p.demoDate} limit={6} />
        </div>
      </Card>
    </div>
  )
}
