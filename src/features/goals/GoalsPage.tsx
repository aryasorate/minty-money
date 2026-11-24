import { useMemo, useState } from 'react'
import { CalendarClock, Pin, Plus, Target, Trash2, Trophy } from 'lucide-react'
import { useProfile, useStore } from '@/store/useStore'
import { Card, Field, Input, MoneyInput, PageHeader, Pill, Progress, Select } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { GOAL_EMOJIS } from '@/data/catalog'
import type { Goal, GoalCategory } from '@/data/types'
import { defaultDeadline, goalStatus } from '@/engine/goals'
import { cx, pct, rupees, sum } from '@/lib/format'
import { fmtMonthYear, addDaysISO } from '@/lib/date'
import { toast } from '@/store/toast'

const CATEGORIES: GoalCategory[] = ['Trip', 'Gadget', 'Emergency', 'Education', 'Lifestyle', 'Other']

export function GoalsPage() {
  const p = useProfile()
  const addGoal = useStore((s) => s.addGoal)
  const [name, setName] = useState('')
  const [target, setTarget] = useState<number | ''>('')
  const [months, setMonths] = useState(6)
  const [category, setCategory] = useState<GoalCategory>('Trip')
  const [emoji, setEmoji] = useState('🏖️')
  const [fundGoal, setFundGoal] = useState<Goal | null>(null)

  const totalSaved = sum(p.goals.map((g) => g.saved))
  const totalTarget = sum(p.goals.map((g) => g.target))
  const active = p.goals.filter((g) => g.saved < g.target).length
  const sorted = useMemo(() => [...p.goals].sort((a, b) => Number(b.priority) - Number(a.priority) || a.deadline.localeCompare(b.deadline)), [p.goals])
  const preview = target ? Math.ceil(Number(target) / months / 50) * 50 : 0

  const create = () => {
    if (!name.trim() || !target) return
    addGoal({ name: name.trim(), emoji, category, target: Number(target), deadline: defaultDeadline(p.demoDate, months) })
    toast(`Goal created: ${emoji} ${name.trim()}`, `Save ${rupees(preview)}/month to get there`)
    setName('')
    setTarget('')
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Goals" subtitle="Save smarter for what matters" />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-brand-50 to-white px-6 pb-6 pt-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Target size={16} /> Your Dream Goals
          </p>
          <p className="text-xs text-muted">Every rupee saved gets you closer 🎯</p>
          <div className="mt-5 grid grid-cols-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-brand-600">{rupees(totalSaved)}</p>
              <p className="text-xs text-muted">Total saved</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-ink">{rupees(totalTarget)}</p>
              <p className="text-xs text-muted">Total target</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-ink">{active}</p>
              <p className="text-xs text-muted">Active goals</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-sky-600">{totalTarget ? pct(totalSaved / totalTarget) : '0%'}</p>
              <p className="text-xs text-muted">Overall progress</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_2fr]">
        <Card className="h-fit p-6">
          <h3 className="flex items-center gap-2 text-[15px] font-bold">
            <Plus size={16} /> Add new goal
          </h3>
          <div className="mt-4 space-y-3">
            <Field label="What are you saving for?">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. iPhone 16 📱" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target amount">
                <MoneyInput value={target} onChange={setTarget} placeholder="20000" />
              </Field>
              <Field label="Deadline">
                <Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                  {[1, 2, 3, 4, 6, 9, 12, 18].map((m) => (
                    <option key={m} value={m}>
                      {fmtMonthYear(addDaysISO(p.demoDate, Math.round(m * 30.4)))} ({m} mo)
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <div>
              <p className="mb-1.5 text-xs font-semibold">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_EMOJIS.map((e) => (
                  <button key={e} onClick={() => setEmoji(e)} className={cx('h-9 w-9 rounded-lg text-lg transition cursor-pointer', emoji === e ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-canvas hover:bg-brand-50')}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            {preview > 0 && (
              <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                Monthly target: <b>{rupees(preview)}/month</b> for {months} months
              </div>
            )}
            <Button className="w-full" onClick={create} disabled={!name.trim() || !target}>
              Create goal
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((g) => (
            <GoalCard key={g.id} g={g} onFund={() => setFundGoal(g)} />
          ))}
        </div>
      </div>

      <FundModal goal={fundGoal} onClose={() => setFundGoal(null)} />
    </div>
  )
}

function GoalCard({ g, onFund }: { g: Goal; onFund: () => void }) {
  const p = useProfile()
  const togglePriority = useStore((s) => s.togglePriority)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const st = goalStatus(g, p.demoDate)
  return (
    <Card className={cx('flex flex-col p-5', g.priority && 'ring-2 ring-brand-200')}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas text-2xl">{g.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{g.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill tone="gray">{g.category}</Pill>
            {g.priority && (
              <Pill tone="green">
                <Pin size={10} /> Priority
              </Pill>
            )}
            {st.done && (
              <Pill tone="amber">
                <Trophy size={10} /> Achieved
              </Pill>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button title={g.priority ? 'Unpin priority' : 'Make priority'} onClick={() => togglePriority(g.id)} className={cx('rounded-lg p-1.5 hover:bg-brand-50 cursor-pointer', g.priority ? 'text-brand-600' : 'text-muted')}>
            <Pin size={15} />
          </button>
          <button
            title="Delete goal"
            onClick={() => {
              deleteGoal(g.id)
              toast(`Goal removed: ${g.name}`, undefined, 'info')
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500 cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-xl font-extrabold">{rupees(g.saved)}</p>
        <p className="text-xs text-muted">of {rupees(g.target)}</p>
      </div>
      <Progress value={st.pct} color="#16a34a" height="h-2.5" className="mt-2" />
      <div className="mt-1.5 flex justify-between text-[11px]">
        <span className="font-semibold text-brand-700">{pct(st.pct)} complete</span>
        <span className="flex items-center gap-1 text-muted">
          <CalendarClock size={11} /> {fmtMonthYear(g.deadline)}
        </span>
      </div>
      <div className="mt-2 flex gap-1">
        {[25, 50, 75, 100].map((m) => (
          <span key={m} className={cx('flex-1 rounded-md py-0.5 text-center text-[10px] font-bold', st.pct * 100 >= m ? 'bg-brand-600 text-white' : 'bg-canvas text-muted')}>
            {m}%
          </span>
        ))}
      </div>
      {!st.done && (
        <div className="mt-4 rounded-xl bg-canvas px-3 py-2.5 text-xs">
          <span className="text-muted">Monthly target: </span>
          <b>{rupees(st.monthlyTarget)}/month</b>
          <span className="text-muted"> · {st.monthsLeft} months left</span>
        </div>
      )}
      <Button className="mt-4" variant={st.done ? 'secondary' : 'primary'} size="sm" icon={<Plus size={14} />} disabled={st.done} onClick={onFund}>
        {st.done ? 'Goal achieved 🎉' : 'Add money'}
      </Button>
    </Card>
  )
}

function FundModal({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const p = useProfile()
  const contribute = useStore((s) => s.contributeGoal)
  const [amount, setAmount] = useState<number | ''>(500)
  if (!goal) return null
  const st = goalStatus(goal, p.demoDate)
  const presets = Array.from(new Set([100, 500, st.monthlyTarget, st.remaining].filter((x) => x > 0 && x <= st.remaining))).sort((a, b) => a - b)
  return (
    <Modal open={!!goal} onClose={onClose} title={`Add money to ${goal.emoji} ${goal.name}`} subtitle={`${rupees(st.remaining)} to go`}>
      <MoneyInput value={amount} onChange={setAmount} autoFocus />
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((v) => (
          <button key={v} onClick={() => setAmount(v)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:border-brand-300 cursor-pointer">
            {v === st.monthlyTarget ? `Monthly target ${rupees(v)}` : v === st.remaining ? `Finish it! ${rupees(v)}` : rupees(v)}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!amount}
          onClick={() => {
            const a = Math.min(Number(amount), st.remaining)
            contribute(goal.id, a)
            toast(`${rupees(a)} added to ${goal.name}`, 'Moved from your Savings jar')
            onClose()
          }}
        >
          Add money
        </Button>
      </div>
    </Modal>
  )
}
