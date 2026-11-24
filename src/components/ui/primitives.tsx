import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cx } from '@/lib/format'

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cx('rounded-2xl border border-line bg-white shadow-card', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, right, icon }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 pt-5">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-brand-600">{icon}</span>}
        <div>
          <h3 className="text-[15px] font-bold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-brand-600">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  subTone = 'muted',
  icon,
  valueClass,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  subTone?: 'muted' | 'good' | 'warn' | 'bad'
  icon?: ReactNode
  valueClass?: string
}) {
  const tones = { muted: 'text-muted', good: 'text-brand-600', warn: 'text-amber-600', bad: 'text-red-500' }
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && <span className="text-brand-500/70">{icon}</span>}
      </div>
      <p className={cx('mt-2 text-2xl font-bold tracking-tight text-ink', valueClass)}>{value}</p>
      {sub && <p className={cx('mt-1 text-xs font-medium', tones[subTone])}>{sub}</p>}
    </Card>
  )
}

export function Progress({ value, color, className, height = 'h-2' }: { value: number; color?: string; className?: string; height?: string }) {
  const v = Math.max(0, Math.min(1, value))
  const auto = value >= 1 ? '#ef4444' : value >= 0.8 ? '#f59e0b' : '#16a34a'
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-[#edf2ef]', height, className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v * 100}%`, background: color ?? auto }} />
    </div>
  )
}

export function Pill({ children, tone = 'green', className }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple'; className?: string }) {
  const tones = {
    green: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-sky-50 text-sky-700',
    gray: 'bg-slate-100 text-slate-600',
    purple: 'bg-purple-50 text-purple-700',
  }
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', tones[tone], className)}>{children}</span>
}

export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: color ?? '#16a34a', fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

export function FriendChip({ name, active, onClick }: { name: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-semibold transition-colors cursor-pointer',
        active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200',
      )}
    >
      <span className={cx('flex h-6 w-6 items-center justify-center rounded-full text-[11px]', active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}>
        {name.slice(0, 1)}
      </span>
      {name}
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  )
}

const inputCls =
  'h-10 w-full rounded-xl border border-line bg-[#fafcfb] px-3 text-sm text-ink placeholder:text-muted/70 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-3 focus:ring-brand-100'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputCls, className)} {...rest} />
}

export function MoneyInput({ value, onChange, className, ...rest }: { value: number | ''; onChange: (v: number | '') => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className={cx('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">₹</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        className={cx(inputCls, 'pl-7')}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
        {...rest}
      />
    </div>
  )
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputCls, 'cursor-pointer appearance-none pr-8', className)} {...rest}>
      {children}
    </select>
  )
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
            value === o.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-muted hover:text-ink hover:border-brand-200',
          )}
        >
          {o.label}
          {o.count !== undefined && o.count > 0 && (
            <span className={cx('rounded-full px-1.5 text-[10px]', value === o.value ? 'bg-white/25' : 'bg-brand-50 text-brand-700')}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs text-muted">{body}</p>}
    </div>
  )
}

/** Small label used on things that are simulated in the PoC. */
export function SimTag({ children = 'Simulated' }: { children?: ReactNode }) {
  return <span className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">{children}</span>
}
