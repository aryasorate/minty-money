import { useMemo, useState } from 'react'
import { Bell, CheckCheck, Lightbulb, Trophy } from 'lucide-react'
import { useProfile, useStore } from '@/store/useStore'
import { Card, CardHeader, EmptyState, PageHeader, Tabs } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { deriveAlerts, sortAlerts } from '@/engine/alerts'
import { benchmarks } from '@/engine/insights'
import { badges } from '@/engine/gamification'
import type { AlertCategory } from '@/data/types'
import { AlertCard } from './AlertCard'
import { rupees } from '@/lib/format'

type Filter = 'all' | 'urgent' | AlertCategory

const HACKS: Record<string, string> = {
  'Snacks & Chai': 'Carry a flask of chai from the mess — 3 fewer stall stops a day saves ~₹1,500/month.',
  'Food Delivery': 'Order with friends to split delivery fees, and turn off food-app notifications on weekdays.',
  'Eating Out': 'Use student IDs at cafés (many give 10–15% off) and pick one "treat day" a week.',
  'Cabs & Autos': 'Get a monthly metro/bus pass — it usually pays for itself in 8–10 rides.',
  'Parties & Outings': 'Decide your outing budget before you leave and pay with a separate UPI wallet.',
  Shopping: 'Add items to cart and wait 30 days. Most of them you’ll forget about.',
  Subscriptions: 'Split a family plan (Spotify/YouTube) with flatmates — 60–70% cheaper per person.',
  'Movies & Events': 'Weekday & morning shows are often half price.',
  'Mess & Canteen': 'Pre-paid mess coupons are cheaper than paying per meal at the canteen.',
}

export function AlertsPage() {
  const p = useProfile()
  const markRead = useStore((s) => s.markRead)
  const dismiss = useStore((s) => s.dismissAlert)
  const [filter, setFilter] = useState<Filter>('all')
  const alerts = useMemo(() => sortAlerts(deriveAlerts(p)), [p])
  const tips = useMemo(() => benchmarks(p).filter((b) => HACKS[b.tag]).slice(0, 4), [p])
  const earned = useMemo(() => badges(p).filter((b) => b.earned), [p])

  const filtered = alerts.filter((a) => filter === 'all' || (filter === 'urgent' ? a.severity === 'urgent' : a.category === filter))
  const count = (f: Filter) => alerts.filter((a) => (f === 'urgent' ? a.severity === 'urgent' : a.category === f)).length
  const unread = alerts.filter((a) => !p.readAlertIds.includes(a.id))

  return (
    <div className="animate-fade-up">
      <PageHeader title="Alerts" subtitle="Smart reminders & nudges" />

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-brand-600" />
            <h3 className="font-bold">Smart Notifications</h3>
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{unread.length > 0 ? `${unread.length} new` : 'Active'}</span>
          </div>
          <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={() => markRead(alerts.map((a) => a.id))} disabled={!unread.length}>
            Mark all read
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-line text-center">
          <div>
            <p className="text-2xl font-extrabold text-amber-500">{count('urgent')}</p>
            <p className="text-xs text-muted">Urgent items</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-sky-600">{count('bills') + alerts.filter((a) => a.severity === 'warning').length}</p>
            <p className="text-xs text-muted">Due & warnings</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-600">{alerts.filter((a) => a.severity === 'success').length}</p>
            <p className="text-xs text-muted">Good on track</p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Tabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: alerts.length },
              { value: 'urgent', label: 'Urgent', count: count('urgent') },
              { value: 'budget', label: 'Budget', count: count('budget') },
              { value: 'bills', label: 'Bills', count: count('bills') },
              { value: 'goals', label: 'Goals', count: count('goals') },
              { value: 'social', label: 'Social', count: count('social') },
              { value: 'income', label: 'Income', count: count('income') },
            ]}
          />
          <div className="mt-3 space-y-2.5">
            {filtered.length === 0 && (
              <Card>
                <EmptyState icon={<CheckCheck size={22} />} title="All clear here" body="Nothing in this category right now. Minty keeps watching." />
              </Card>
            )}
            {filtered.map((a) => (
              <AlertCard key={a.id} alert={a} today={p.demoDate} unread={!p.readAlertIds.includes(a.id)} onDismiss={() => dismiss(a.id)} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Personalised suggestions" subtitle="Smart hacks to save more each month" icon={<Lightbulb size={18} />} />
            <ul className="space-y-3 px-6 pb-6 pt-4">
              {tips.map((t) => (
                <li key={t.tag} className="rounded-xl bg-canvas p-3">
                  <p className="text-xs font-bold text-ink">
                    {t.tag} <span className={t.diff > 0 ? 'text-amber-600' : 'text-brand-600'}>· {rupees(t.yours)}/mo</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{HACKS[t.tag]}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Milestone nudges" subtitle="Badges you've earned" icon={<Trophy size={18} />} />
            <div className="flex flex-wrap gap-2 px-6 pb-6 pt-4">
              {earned.length === 0 && <p className="text-xs text-muted">No badges yet — your first one is close!</p>}
              {earned.map((b) => (
                <span key={b.id} title={b.description} className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                  {b.emoji} {b.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
