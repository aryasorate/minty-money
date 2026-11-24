import { useEffect, useMemo, useState } from 'react'
import { MessageSquareText, Sparkles, PartyPopper } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/primitives'
import { QUICK_CATEGORIES, JAR_META } from '@/data/catalog'
import { useProfile, useStore } from '@/store/useStore'
import { toast } from '@/store/toast'
import { cx, roundTo, rupees } from '@/lib/format'
import { priorityGoal } from '@/engine/goals'
import type { Detection } from '@/data/types'

/** The "Alert: Expense detected — categorise now" pop-up from the deck (and its income twin). */
export function DetectionModal() {
  const p = useProfile()
  const open = useStore((s) => s.detectionOpen)
  const setOpen = useStore((s) => s.setDetectionOpen)
  const det = p.pendingDetections[0]
  const show = open && !!det

  return (
    <Modal open={show} onClose={() => setOpen(false)} hideClose width="max-w-md">
      {det && (det.kind === 'debit' ? <DebitBody det={det} onLater={() => setOpen(false)} /> : <CreditBody det={det} onLater={() => setOpen(false)} />)}
    </Modal>
  )
}

function SmsStrip({ det }: { det: Detection }) {
  return (
    <div className="rounded-xl bg-[#f3f5f4] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
        <MessageSquareText size={12} /> SMS · {det.bank ?? 'Bank'} {det.account ? `· ${det.account}` : ''}
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-ink/70">{det.sms}</p>
    </div>
  )
}

function DebitBody({ det, onLater }: { det: Detection; onLater: () => void }) {
  const categorise = useStore((s) => s.categoriseDetection)
  const suggestedQuick = QUICK_CATEGORIES.find((q) => q.jarId === det.suggestedJar)?.label
  const pick = (jarId: (typeof QUICK_CATEGORIES)[number]['jarId'], fallbackTag: string) => {
    const tag = jarId === det.suggestedJar ? det.suggestedTag : fallbackTag
    categorise(det.id, jarId, tag)
    toast(`${rupees(det.amount)} logged to ${JAR_META[jarId].name}`, 'One tap. Done. ✨')
  }
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold text-brand-600">Alert: Expense detected</p>
      <p className="mt-2 text-2xl font-bold text-ink">
        {rupees(det.amount)} spent <span className="text-base font-semibold text-muted">– categorise now</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        at <span className="font-semibold text-ink">{det.merchant}</span>
      </p>
      <div className="mt-4 text-left">
        <SmsStrip det={det} />
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-700">
        <Sparkles size={13} /> Minty suggests <span className="underline decoration-brand-300 underline-offset-2">{det.suggestedTag}</span> · {Math.round(det.confidence * 100)}% sure
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {QUICK_CATEGORIES.map((q, i) => (
          <button
            key={q.label}
            onClick={() => pick(q.jarId, q.tag)}
            className={cx(
              'h-12 rounded-full text-[15px] font-bold transition-all cursor-pointer',
              i === QUICK_CATEGORIES.length - 1 && QUICK_CATEGORIES.length % 2 === 1 && 'col-span-2',
              q.label === suggestedQuick
                ? 'bg-brand-600 text-white ring-4 ring-brand-200 hover:bg-brand-700'
                : 'bg-brand-500/90 text-white hover:bg-brand-600',
            )}
          >
            {q.label}
          </button>
        ))}
      </div>
      <button onClick={onLater} className="mt-4 text-xs font-semibold text-muted hover:text-ink cursor-pointer">
        Categorise later
      </button>
    </div>
  )
}

function CreditBody({ det, onLater }: { det: Detection; onLater: () => void }) {
  const p = useProfile()
  const accept = useStore((s) => s.acceptIncome)
  const goal = priorityGoal(p.goals)
  const [goalId, setGoalId] = useState<string>(goal?.id ?? '')
  const [share, setShare] = useState(0.2)
  useEffect(() => setGoalId(goal?.id ?? ''), [det.id, goal?.id])
  const amount = useMemo(() => roundTo(det.amount * share, 50), [det.amount, share])
  const target = p.goals.find((g) => g.id === goalId)

  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <PartyPopper size={28} />
      </div>
      <p className="mt-3 text-xl font-extrabold text-brand-600">Great job! Your side income is in.</p>
      <p className="mt-1 text-2xl font-bold">+{rupees(det.amount)}</p>
      <p className="text-sm text-muted">
        from <span className="font-semibold text-ink">{det.merchant}</span>
      </p>
      <div className="mt-4 text-left">
        <SmsStrip det={det} />
      </div>
      <p className="mt-4 text-sm font-semibold text-ink">Let's make it work for you. Transfer a portion to savings?</p>
      <div className="mt-3 flex justify-center gap-2">
        {[0.1, 0.2, 0.3, 0.5].map((s) => (
          <button
            key={s}
            onClick={() => setShare(s)}
            className={cx('rounded-full border px-3.5 py-1.5 text-sm font-bold transition cursor-pointer', share === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:border-brand-300')}
          >
            {s * 100}%
          </button>
        ))}
      </div>
      <div className="mt-3 text-left">
        <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          <option value="">Savings jar</option>
          {p.goals
            .filter((g) => g.saved < g.target)
            .map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.name} ({rupees(g.saved)} / {rupees(g.target)})
              </option>
            ))}
        </Select>
      </div>
      <Button
        size="lg"
        className="mt-4 w-full"
        onClick={() => {
          accept(det.id, amount, goalId || undefined)
          toast(`${rupees(amount)} moved to ${target ? target.name : 'Savings'} 🎯`, 'Future you says thanks!')
        }}
      >
        Move {rupees(amount)} to {target ? `${target.emoji} ${target.name}` : 'Savings'}
      </Button>
      <div className="mt-2 flex justify-center gap-4">
        <button
          onClick={() => {
            accept(det.id, 0)
            toast(`${rupees(det.amount)} income logged`, undefined, 'info')
          }}
          className="text-xs font-semibold text-muted hover:text-ink cursor-pointer"
        >
          Just log income
        </button>
        <button onClick={onLater} className="text-xs font-semibold text-muted hover:text-ink cursor-pointer">
          Decide later
        </button>
      </div>
    </div>
  )
}
