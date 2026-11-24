import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useToasts } from '@/store/toast'
import { cx } from '@/lib/format'

export function Toaster() {
  const { toasts, remove } = useToasts()
  return (
    <div className="pointer-events-none fixed right-5 top-20 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CircleCheck : t.tone === 'info' ? Info : TriangleAlert
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-pop animate-slide-in">
            <Icon
              size={18}
              className={cx('mt-0.5 shrink-0', t.tone === 'success' ? 'text-brand-600' : t.tone === 'info' ? 'text-sky-600' : t.tone === 'warning' ? 'text-amber-500' : 'text-red-500')}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-muted hover:text-ink cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
