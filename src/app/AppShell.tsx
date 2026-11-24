import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarClock,
  Crown,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { useProfile, useStore } from '@/store/useStore'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { deriveAlerts } from '@/engine/alerts'
import { fmtDateLong } from '@/lib/date'
import { cx } from '@/lib/format'
import { AddExpenseModal } from '@/features/jars/AddExpenseModal'
import { DetectionModal } from '@/features/autodetect/DetectionModal'
import { DemoPanel } from '@/features/demo/DemoPanel'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jars', label: 'Money Jars', icon: PiggyBank },
  { to: '/split', label: 'Split Bills', icon: Users },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/insights', label: 'Insights', icon: Sparkles },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
]

export function AppShell({ children }: { children: ReactNode }) {
  const p = useProfile()
  const exitProfile = useStore((s) => s.exitProfile)
  const setDemoPanel = useStore((s) => s.setDemoPanel)
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)

  const location = useLocation()
  useEffect(() => setDemoPanel(false), [location.pathname, setDemoPanel])

  const unread = useMemo(() => deriveAlerts(p).filter((a) => !p.readAlertIds.includes(a.id)).length, [p])

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r border-line bg-white px-4 py-5">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-muted hover:bg-brand-50 hover:text-ink',
                )
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {to === '/alerts' && unread > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-100">
              <Crown size={14} /> Smart Money
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-snug">Courses, hacks & smart insights</p>
            <p className="mt-1 text-xs text-brand-100">₹9/month · Active</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
            <Avatar name={p.persona.name} color={p.persona.avatarColor} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{p.persona.name}</p>
              <p className="truncate text-[11px] text-muted">{p.persona.archetype}</p>
            </div>
            <button title="Switch profile" onClick={exitProfile} className="rounded-lg p-1.5 text-muted hover:bg-brand-50 hover:text-ink cursor-pointer">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-8 backdrop-blur">
          <div className="flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-muted" title="The demo clock — use the Demo panel to move it">
            <CalendarClock size={14} className="text-brand-600" />
            {fmtDateLong(p.demoDate)}
          </div>
          {p.smsLinked && (
            <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 xl:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> Auto-detect on
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
              Add expense
            </Button>
            <button onClick={() => navigate('/alerts')} className="relative rounded-xl p-2 text-muted hover:bg-brand-50 hover:text-ink cursor-pointer" title="Alerts">
              <Bell size={19} />
              {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            <Button size="sm" variant="secondary" icon={<FlaskConical size={15} />} onClick={() => setDemoPanel(true)} title="Presenter tools: simulate SMS, income, time">
              Demo
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-8 py-7">{children}</main>
      </div>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} />
      <DetectionModal />
      <DemoPanel />
    </div>
  )
}
