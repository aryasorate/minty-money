import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '@/lib/format'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-lg',
  hideClose,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  width?: string
  hideClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx('relative w-full rounded-2xl bg-white shadow-pop animate-pop max-h-[90vh] overflow-y-auto', width)}>
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <div>
              {title && <h3 className="text-lg font-bold text-ink">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-brand-50 hover:text-ink cursor-pointer" aria-label="Close">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  )
}
