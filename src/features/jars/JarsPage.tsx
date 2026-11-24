import { useMemo, useState } from 'react'
import { ArrowLeftRight, CircleCheck, Minus, Plus, Settings2, WandSparkles, CalendarClock } from 'lucide-react'
import { useProfile, useStore } from '@/store/useStore'
import { Card, CardHeader, PageHeader, Pill, Progress, Tabs } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { JarIcon } from '@/components/JarIcon'
import { TransactionList } from '@/components/TransactionList'
import { JAR_META } from '@/data/catalog'
import type { JarId } from '@/data/types'
import { expectedMonthlyIncome, jarStatuses, monthToDate, totalAllocated } from '@/engine/money'
import { spendStreak } from '@/engine/gamification'
import { cx, pct, rupees } from '@/lib/format'
import { fmtDate, monthKey, withDay } from '@/lib/date'
import { toast } from '@/store/toast'
import { AddExpenseModal } from './AddExpenseModal'
import { AutoSplitModal, CustomizeModal, RebalanceModal } from './budgetModals'

export function JarsPage() {
  const p = useProfile()
  const setBudgets = useStore((s) => s.setBudgets)
  const addToSavings = useStore((s) => s.addToSavings)
  const payBill = useStore((s) => s.payBill)
  const statuses = useMemo(() => jarStatuses(p), [p])
  const streak = useMemo(() => spendStreak(p), [p])
  const [spendJar, setSpendJar] = useState<JarId | null>(null)
  const [modal, setModal] = useState<'auto' | 'rebalance' | 'customize' | null>(null)
  const [filter, setFilter] = useState<'all' | JarId>('all')

  const income = expectedMonthlyIncome(p)
  const allocated = totalAllocated(p)
  const spent = statuses.filter((s) => s.jar.type !== 'savings').reduce((a, s) => a + s.spent, 0)
  const spendBudget = statuses.filter((s) => s.jar.type !== 'savings').reduce((a, s) => a + s.budget, 0)
  const mk = monthKey(p.demoDate)
  const txns = useMemo(() => monthToDate(p).filter((t) => filter === 'all' || t.jarId === filter), [p, filter])

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Money Jars"
        subtitle="Split your allowance like a pro"
        right={
          <>
            <Button variant="soft" size="sm" icon={<WandSparkles size={15} />} onClick={() => setModal('auto')}>
              Auto-split
            </Button>
            <Button variant="secondary" size="sm" icon={<ArrowLeftRight size={15} />} onClick={() => setModal('rebalance')}>
              Rebalance
            </Button>
            <Button variant="secondary" size="sm" icon={<Settings2 size={15} />} onClick={() => setModal('customize')}>
              Customise
            </Button>
          </>
        }
      />

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold">Money Jars Overview</h3>
            <p className="text-xs text-muted">This month · {rupees(income)} expected income</p>
          </div>
          {income - allocated > 0 && <Pill tone="amber">{rupees(income - allocated)} unallocated</Pill>}
        </div>
        <div className="mt-5 grid grid-cols-4 divide-x divide-line text-center">
          <div>
            <p className="text-2xl font-extrabold text-brand-600">{rupees(allocated)}</p>
            <p className="text-xs text-muted">Total allocated</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-red-500">{rupees(spent)}</p>
            <p className="text-xs text-muted">Total spent</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-600">{rupees(Math.max(0, spendBudget - spent))}</p>
            <p className="text-xs text-muted">Remaining to spend</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-600">{rupees(statuses.find((s) => s.jar.id === 'savings')!.spent)}</p>
            <p className="text-xs text-muted">Saved this month</p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {statuses.map((s, i) => {
          const m = JAR_META[s.jar.id]
          const isSave = s.jar.type === 'savings'
          return (
            <Card key={s.jar.id} className="flex flex-col p-5 animate-fade-up">
              <div className="flex items-start gap-3" style={{ animationDelay: `${i * 40}ms` }}>
                <JarIcon id={s.jar.id} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{s.jar.name}</p>
                    <Pill tone={isSave ? 'green' : s.jar.type === 'fixed' ? 'red' : 'blue'}>{s.jar.type}</Pill>
                  </div>
                  <p className="truncate text-xs text-muted">{m.description}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-ink">
                    {rupees(s.spent)} {isSave ? 'saved' : 'spent'}
                  </p>
                  <p className={cx('mt-0.5', s.left < 0 ? 'font-semibold text-red-500' : 'text-muted')}>
                    {isSave ? `${rupees(Math.max(0, s.left))} to target` : s.left < 0 ? `${rupees(-s.left)} over` : `${rupees(s.left)} left`}
                  </p>
                </div>
              </div>
              <Progress value={s.pct} color={isSave ? '#16a34a' : s.jar.type === 'fixed' ? m.color : undefined} className="mt-4" />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                <span>
                  {pct(s.pct)} {isSave ? 'of monthly target' : 'used'} of {rupees(s.budget)}
                </span>
                {isSave && streak >= 3 && <span className="font-semibold text-brand-600">Perfect streak! 🎉</span>}
                {s.jar.type === 'variable' && s.pct >= 0.8 && s.pct < 1 && <span className="font-semibold text-amber-600">Slow down</span>}
                {s.jar.type === 'fixed' && s.pct >= 0.98 && <span className="font-semibold text-brand-600">All bills covered ✓</span>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {isSave ? (
                  <>
                    <Button
                      variant="soft"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => {
                        addToSavings(100)
                        toast('₹100 saved 🐷', 'Small steps, big dreams')
                      }}
                    >
                      Save ₹100
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        addToSavings(500)
                        toast('₹500 saved 🐷', 'Pay yourself first!')
                      }}
                    >
                      Save ₹500
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => {
                        setBudgets({ [s.jar.id]: s.budget + 100 })
                        toast(`₹100 added to ${s.jar.name}`, 'Budget increased for this month', 'info')
                      }}
                    >
                      Add ₹100
                    </Button>
                    <Button variant="secondary" size="sm" icon={<Minus size={14} />} onClick={() => setSpendJar(s.jar.id)}>
                      Spend
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Bills & due dates" subtitle="Fixed costs from your Rent & Bills jar" icon={<CalendarClock size={18} />} />
          <ul className="space-y-2 px-6 pb-6 pt-4">
            {p.bills.map((b) => {
              const paid = b.paidMonths.includes(mk)
              return (
                <li key={b.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{b.name}</p>
                    <p className="text-[11px] text-muted">
                      {rupees(b.amount)} · due {fmtDate(withDay(p.demoDate, b.dueDay))}
                    </p>
                  </div>
                  {paid ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                      <CircleCheck size={14} /> Paid
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => payBill(b.id)}>
                      Pay now
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="This month's transactions" subtitle={`${txns.length} entries`} />
          <div className="px-6 pt-3">
            <Tabs
              value={filter}
              onChange={setFilter}
              options={[{ value: 'all' as const, label: 'All' }, ...p.jars.filter((j) => j.type !== 'savings').map((j) => ({ value: j.id, label: j.name }))]}
            />
          </div>
          <div className="max-h-[360px] overflow-y-auto px-6 pb-4 pt-2">
            <TransactionList txns={txns} today={p.demoDate} limit={60} />
          </div>
        </Card>
      </div>

      <AddExpenseModal open={!!spendJar} onClose={() => setSpendJar(null)} defaultJar={spendJar ?? 'food'} />
      <AutoSplitModal open={modal === 'auto'} onClose={() => setModal(null)} p={p} />
      <RebalanceModal open={modal === 'rebalance'} onClose={() => setModal(null)} p={p} />
      <CustomizeModal open={modal === 'customize'} onClose={() => setModal(null)} p={p} />
    </div>
  )
}
