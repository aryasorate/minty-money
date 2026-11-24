import { useNavigate } from 'react-router-dom'
import { BellRing, CircleCheck, Info, Shield, Smartphone, Sparkles, TriangleAlert, X, IndianRupee, type LucideIcon } from 'lucide-react'
import type { AppAlert } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cx } from '@/lib/format'
import { relativeDay } from '@/lib/date'

const STYLES = {
  urgent: { box: 'border-red-200 bg-red-50/70', title: 'text-red-600', icon: TriangleAlert },
  warning: { box: 'border-amber-200 bg-amber-50/70', title: 'text-amber-700', icon: TriangleAlert },
  info: { box: 'border-sky-200 bg-sky-50/70', title: 'text-sky-700', icon: Info },
  success: { box: 'border-brand-200 bg-brand-50/80', title: 'text-brand-700', icon: CircleCheck },
} as const

const ICONS: Record<string, LucideIcon> = { shield: Shield, sparkles: Sparkles, smartphone: Smartphone, bell: BellRing }

export function AlertCard({ alert, today, unread, compact, onDismiss }: { alert: AppAlert; today: string; unread?: boolean; compact?: boolean; onDismiss?: () => void }) {
  const navigate = useNavigate()
  const payBill = useStore((s) => s.payBill)
  const remind = useStore((s) => s.remind)
  const markRead = useStore((s) => s.markRead)
  const setDetectionOpen = useStore((s) => s.setDetectionOpen)
  const st = STYLES[alert.severity]
  const Icon = alert.icon ? ICONS[alert.icon] : alert.category === 'bills' ? IndianRupee : st.icon

  const act = () => {
    markRead([alert.id])
    const a = alert.action
    if (!a) return
    if (a.kind === 'route') navigate(a.to)
    if (a.kind === 'payBill') payBill(a.billId)
    if (a.kind === 'remind') remind(a.friendId)
    if (a.kind === 'categorize') setDetectionOpen(true)
  }

  return (
    <div className={cx('group relative flex items-start gap-3 rounded-xl border px-4', compact ? 'py-3' : 'py-3.5', st.box)}>
      <Icon size={17} className={cx('mt-0.5 shrink-0', st.title)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cx('text-sm font-semibold', st.title)}>{alert.title}</p>
          {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
        </div>
        <p className="mt-0.5 text-xs text-ink/70">{alert.body}</p>
        {!compact && <p className="mt-1 text-[11px] text-muted">{relativeDay(alert.date, today)}</p>}
      </div>
      {alert.action && (
        <button
          onClick={act}
          className={cx(
            'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
            alert.action.kind === 'payBill' ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700' : 'border-line bg-white text-ink hover:border-brand-300',
          )}
        >
          {alert.action.label}
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} title="Dismiss" className="absolute -right-2 -top-2 hidden rounded-full border border-line bg-white p-1 text-muted shadow-sm hover:text-ink group-hover:block cursor-pointer">
          <X size={12} />
        </button>
      )}
    </div>
  )
}
