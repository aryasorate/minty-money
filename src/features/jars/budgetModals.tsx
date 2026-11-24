import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, WandSparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, MoneyInput, Select } from '@/components/ui/primitives'
import { JarIcon } from '@/components/JarIcon'
import { ALL_JARS, JAR_META } from '@/data/catalog'
import type { JarId, ProfileState } from '@/data/types'
import { useStore } from '@/store/useStore'
import { toast } from '@/store/toast'
import { cx, roundTo, rupees, sum } from '@/lib/format'
import { expectedMonthlyIncome } from '@/engine/money'

/** Recommended allocation: cover bills, pay yourself first, then split the rest by weight. */
export function recommendedSplit(p: Pick<ProfileState, 'bills' | 'incomes' | 'jars'>, incomeOverride?: number): Record<JarId, number> {
  const income = incomeOverride ?? sum(p.incomes.filter((i) => i.creditDay > 0).map((i) => i.amount))
  const billSum = sum(p.bills.map((b) => b.amount))
  const rent = Math.ceil(billSum / 100) * 100
  const savings = roundTo(income * (income >= 14000 ? 0.18 : 0.1), 50)
  const rest = Math.max(0, income - rent - savings)
  const weights: Partial<Record<JarId, number>> = { food: 0.46, travel: 0.12, academics: 0.08, fun: 0.22, other: 0.12 }
  const out = { rent, savings } as Record<JarId, number>
  let used = 0
  for (const j of ['travel', 'academics', 'fun', 'other'] as JarId[]) {
    out[j] = roundTo(rest * weights[j]!, 50)
    used += out[j]
  }
  out.food = rest - used
  return out
}

export function AutoSplitModal({ open, onClose, p }: { open: boolean; onClose: () => void; p: ProfileState }) {
  const setBudgets = useStore((s) => s.setBudgets)
  const rec = useMemo(() => recommendedSplit(p), [p])
  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><WandSparkles size={18} className="text-brand-600" /> Auto-split your allowance</span>} subtitle={`Based on ${rupees(expectedMonthlyIncome(p))}/month: cover bills, pay yourself first, then split the rest.`}>
      <div className="divide-y divide-line rounded-xl border border-line">
        {ALL_JARS.map((j) => {
          const cur = p.jars.find((x) => x.id === j)!.budget
          return (
            <div key={j} className="flex items-center gap-3 px-4 py-2.5">
              <JarIcon id={j} size={28} />
              <span className="flex-1 text-sm font-semibold">{JAR_META[j].name}</span>
              <span className="w-20 text-right text-sm text-muted">{rupees(cur)}</span>
              <ArrowRight size={14} className="text-muted" />
              <span className={cx('w-20 text-right text-sm font-bold', rec[j] > cur ? 'text-brand-600' : rec[j] < cur ? 'text-amber-600' : 'text-ink')}>{rupees(rec[j])}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setBudgets(rec)
            toast('Allowance auto-split', 'Your jars have new budgets for this month')
            onClose()
          }}
        >
          Apply split
        </Button>
      </div>
    </Modal>
  )
}

export function RebalanceModal({ open, onClose, p }: { open: boolean; onClose: () => void; p: ProfileState }) {
  const moveBudget = useStore((s) => s.moveBudget)
  const [from, setFrom] = useState<JarId>('fun')
  const [to, setTo] = useState<JarId>('food')
  const [amount, setAmount] = useState<number | ''>(200)
  useEffect(() => {
    if (open) setAmount(200)
  }, [open])
  const fromBudget = p.jars.find((j) => j.id === from)!.budget
  const valid = !!amount && amount <= fromBudget && from !== to
  return (
    <Modal open={open} onClose={onClose} title="Rebalance jars" subtitle="Move budget from one jar to another — your total stays the same.">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <Field label="From">
          <Select value={from} onChange={(e) => setFrom(e.target.value as JarId)}>
            {ALL_JARS.map((j) => (
              <option key={j} value={j}>
                {JAR_META[j].name} ({rupees(p.jars.find((x) => x.id === j)!.budget)})
              </option>
            ))}
          </Select>
        </Field>
        <ArrowRight className="mb-2.5 text-muted" size={18} />
        <Field label="To">
          <Select value={to} onChange={(e) => setTo(e.target.value as JarId)}>
            {ALL_JARS.map((j) => (
              <option key={j} value={j}>
                {JAR_META[j].name} ({rupees(p.jars.find((x) => x.id === j)!.budget)})
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Amount" hint={amount && amount > fromBudget ? `Only ${rupees(fromBudget)} available in ${JAR_META[from].name}` : undefined}>
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>
        <div className="mt-2 flex gap-2">
          {[100, 200, 500].map((v) => (
            <button key={v} onClick={() => setAmount(v)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:border-brand-300 cursor-pointer">
              {rupees(v)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!valid}
          onClick={() => {
            moveBudget(from, to, Number(amount))
            toast('Jars rebalanced', `${rupees(Number(amount))} moved from ${JAR_META[from].name} to ${JAR_META[to].name}`)
            onClose()
          }}
        >
          Move money
        </Button>
      </div>
    </Modal>
  )
}

export function CustomizeModal({ open, onClose, p }: { open: boolean; onClose: () => void; p: ProfileState }) {
  const setBudgets = useStore((s) => s.setBudgets)
  const [vals, setVals] = useState<Record<string, number | ''>>({})
  useEffect(() => {
    if (open) setVals(Object.fromEntries(p.jars.map((j) => [j.id, j.budget])))
  }, [open, p.jars])
  const income = expectedMonthlyIncome(p)
  const total = sum(Object.values(vals).map((v) => Number(v) || 0))
  return (
    <Modal open={open} onClose={onClose} title="Customise budgets" subtitle="Set a monthly budget for each jar.">
      <div className="space-y-2.5">
        {ALL_JARS.map((j) => (
          <div key={j} className="flex items-center gap-3">
            <JarIcon id={j} size={30} />
            <span className="flex-1 text-sm font-semibold">{JAR_META[j].name}</span>
            <MoneyInput className="w-36" value={vals[j] ?? ''} onChange={(v) => setVals((s) => ({ ...s, [j]: v }))} />
          </div>
        ))}
      </div>
      <div className={cx('mt-4 rounded-xl px-4 py-3 text-sm', total > income ? 'bg-amber-50 text-amber-800' : 'bg-brand-50 text-brand-800')}>
        Allocated <b>{rupees(total)}</b> of {rupees(income)} monthly income
        {total > income ? ` — ${rupees(total - income)} over!` : total < income ? ` · ${rupees(income - total)} unallocated` : ' · perfectly balanced ✓'}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setBudgets(Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, Number(v) || 0])) as Record<JarId, number>)
            toast('Budgets updated')
            onClose()
          }}
        >
          Save budgets
        </Button>
      </div>
    </Modal>
  )
}
