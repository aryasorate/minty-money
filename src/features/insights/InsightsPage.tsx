import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Brain, ChartColumn, Sparkles, TrendingDown, TrendingUp, Users, Lightbulb } from 'lucide-react'
import { useProfile, useStore } from '@/store/useStore'
import { Card, CardHeader, PageHeader, Pill, Progress } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { JAR_META, SPEND_JARS } from '@/data/catalog'
import { benchmarks, categoryPerformance, trends } from '@/engine/insights'
import { jarPredictions, monthEndForecast } from '@/engine/predictions'
import { impactOf, whatIfs, type WhatIf } from '@/engine/whatif'
import { defaultDeadline } from '@/engine/goals'
import { cx, ordinal, rupees, rupeesShort } from '@/lib/format'
import { dayOf, fmtMonthYear } from '@/lib/date'
import { toast } from '@/store/toast'

const TONES = {
  green: { box: 'border-brand-200 bg-brand-50/70', title: 'text-brand-700' },
  amber: { box: 'border-amber-200 bg-amber-50/70', title: 'text-amber-700' },
  blue: { box: 'border-sky-200 bg-sky-50/70', title: 'text-sky-700' },
}

export function InsightsPage() {
  const p = useProfile()
  const navigate = useNavigate()
  const addGoal = useStore((s) => s.addGoal)
  const [thinking, setThinking] = useState(true)
  useEffect(() => {
    setThinking(true)
    const t = setTimeout(() => setThinking(false), 900)
    return () => clearTimeout(t)
  }, [p.persona.id])

  const perf = useMemo(() => categoryPerformance(p), [p])
  const trend = useMemo(() => trends(p), [p])
  const bench = useMemo(() => benchmarks(p).filter((b) => b.yours >= 150).slice(0, 6), [p])
  const preds = useMemo(() => jarPredictions(p), [p])
  const forecast = useMemo(() => monthEndForecast(p), [p])
  const scenarios = useMemo(() => whatIfs(p), [p])
  const totalYearly = scenarios.reduce((a, s) => a + s.yearly, 0)
  const impact = useMemo(() => impactOf(p, scenarios.reduce((a, s) => a + s.monthly, 0)), [p, scenarios])
  const risky = preds.filter((x) => x.status !== 'on-track').sort((a, b) => (a.runOutDate ?? '') < (b.runOutDate ?? '') ? -1 : 1)
  const topBench = bench.find((b) => b.diff >= 0.25)

  const makeGoal = (w: WhatIf) => {
    addGoal({ name: `${w.title}`, emoji: '🎯', category: 'Other', target: w.monthly * 3, deadline: defaultDeadline(p.demoDate, 3) })
    toast('Mini-goal created 🎯', `Save ${rupees(w.monthly * 3)} in 3 months by ${w.title.toLowerCase()}`)
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Insights" subtitle="Personalised money insights" />

      {/* AI summary */}
      <Card className="overflow-hidden">
        <div className="flex items-start gap-4 bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Brain size={26} />
          </div>
          <div className="flex-1">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-100">
              <Sparkles size={13} /> Minty AI summary
            </p>
            {thinking ? (
              <div className="mt-2 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/20 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-white/20 animate-pulse" />
                <p className="text-xs text-brand-100">Analysing {p.transactions.length} transactions from the last 6 months…</p>
              </div>
            ) : (
              <div className="animate-fade-up">
                <p className="mt-1.5 text-lg font-semibold leading-snug">
                  {risky.length > 0 && risky[0].runOutDate
                    ? `At your current pace, ${risky[0].name} money runs out by the ${ordinal(dayOf(risky[0].runOutDate))}. `
                    : "You're on track across your jars this month. "}
                  {topBench ? `Your ${topBench.tag} spend is ${Math.round(topBench.diff * 100)}% above typical students.` : ''}
                </p>
                <p className="mt-1 text-sm text-brand-100">
                  Projected month-end balance: <b className="text-white">{rupees(forecast.projectedLeft)}</b> · {Math.round(forecast.confidence * 100)}% confidence · based on {p.transactions.length} transactions
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Category Performance" subtitle="This month vs the same days last month" icon={<ChartColumn size={18} />} />
          <ul className="space-y-1 px-6 pb-5 pt-3">
            {perf.map((c) => (
              <li key={c.tag} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-canvas">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: JAR_META[c.jarId].color }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.tag}</p>
                  <p className="text-xs text-brand-700">
                    This month: {rupees(c.thisMonth)} · Last month: {rupees(c.lastMonth)}
                  </p>
                  <p className={cx('text-[11px]', c.change > 0 ? 'text-red-500' : 'text-brand-600')}>{c.note}</p>
                </div>
                <span className={cx('flex items-center gap-1 text-sm font-bold', c.change > 0 ? 'text-red-500' : 'text-brand-600')}>
                  {c.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {c.change > 0 ? '+' : ''}
                  {Math.round(c.change * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="What-If Scenarios" subtitle="Simulate savings from small habit changes" icon={<Lightbulb size={18} />} />
          <div className="space-y-2.5 px-6 pb-6 pt-4">
            {scenarios.map((w) => (
              <div key={w.id} className={cx('flex items-center gap-3 rounded-xl border p-3.5', TONES[w.tone].box)}>
                <div className="flex-1">
                  <p className={cx('text-sm font-semibold', TONES[w.tone].title)}>{w.title}</p>
                  <p className="text-xs text-ink/70">
                    Save <b>{rupees(w.yearly)}/year</b> · {rupees(w.monthly)}/month · {w.detail}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => makeGoal(w)}>
                  Set as goal
                </Button>
              </div>
            ))}
            {impact && (
              <div className="rounded-xl border-l-4 border-sky-400 bg-sky-50 p-3.5">
                <p className="text-sm font-semibold text-sky-700">💰 Impact analysis: {rupees(totalYearly)}/year</p>
                <p className="mt-0.5 text-xs text-ink/70">
                  Doing all of these could get your {impact.goal.emoji} {impact.goal.name} goal{' '}
                  {impact.monthsSooner > 0 ? (
                    <>
                      <b>{impact.monthsSooner} months sooner</b> (in ~{impact.after} months).
                    </>
                  ) : (
                    'done faster.'
                  )}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Smart Predictions & Recommendations"
          subtitle="Run-rate forecast for each jar, with confidence"
          icon={<Sparkles size={18} />}
          right={<Pill tone="purple">Minty AI</Pill>}
        />
        <div className="grid grid-cols-1 gap-3 px-6 pb-6 pt-4 lg:grid-cols-2 2xl:grid-cols-3">
          {preds.map((pr) => (
            <div
              key={pr.jarId}
              className={cx(
                'rounded-xl border p-4',
                pr.status === 'over' ? 'border-red-200 bg-red-50/60' : pr.status === 'at-risk' ? 'border-amber-200 bg-amber-50/60' : 'border-line bg-white',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{pr.name}</p>
                <Pill tone={pr.status === 'over' ? 'red' : pr.status === 'at-risk' ? 'amber' : 'green'}>
                  {pr.status === 'over' ? 'Over budget' : pr.status === 'at-risk' ? 'At risk' : 'On track'}
                </Pill>
              </div>
              <p className={cx('mt-2 text-sm font-medium', pr.status === 'on-track' ? 'text-brand-700' : 'text-amber-700')}>
                {pr.status === 'over'
                  ? `Already ${rupees(pr.spent - pr.budget)} over budget`
                  : pr.status === 'at-risk' && pr.runOutDate
                    ? `At current spending rate, you'll run out by the ${ordinal(dayOf(pr.runOutDate))}`
                    : `Projected ${rupees(pr.projected)} of ${rupees(pr.budget)} — comfortable`}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                <span>Confidence</span>
                <Progress value={pr.confidence} color="#8b5cf6" height="h-1.5" className="flex-1" />
                <span className="font-semibold text-ink">{Math.round(pr.confidence * 100)}%</span>
              </div>
              {pr.status !== 'on-track' && (
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => navigate('/jars')}>
                  Act on it
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader title="Financial Trends" subtitle="6-month spending by jar (this month is month-to-date)" icon={<TrendingUp size={18} />} />
          <div className="h-[300px] px-3 pb-4 pt-3">
            <ResponsiveContainer>
              <BarChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2ef" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={rupeesShort} width={48} />
                <Tooltip formatter={(v, n) => [rupees(Number(v)), JAR_META[n as keyof typeof JAR_META]?.name ?? n]} contentStyle={{ borderRadius: 12, border: '1px solid #e3ebe6', fontSize: 12 }} />
                <Legend formatter={(v) => <span className="text-xs text-muted">{JAR_META[v as keyof typeof JAR_META]?.name ?? v}</span>} iconType="circle" iconSize={8} />
                {SPEND_JARS.map((j, i) => (
                  <Bar key={j} dataKey={j} stackId="a" fill={JAR_META[j].color} radius={i === SPEND_JARS.length - 1 ? [6, 6, 0, 0] : 0} maxBarSize={48} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Savings over time" subtitle="Money moved to savings each month" />
          <div className="h-[300px] px-3 pb-4 pt-3">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef2ef" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={rupeesShort} width={48} />
                <Tooltip formatter={(v) => [rupees(Number(v)), 'Saved']} contentStyle={{ borderRadius: 12, border: '1px solid #e3ebe6', fontSize: 12 }} />
                <Area type="monotone" dataKey="saved" stroke="#16a34a" strokeWidth={2.5} fill="url(#sv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="You vs typical students" subtitle="Your average month (last 3 months) · peer reference values are synthetic for this prototype" icon={<Users size={18} />} />
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 px-6 pb-6 pt-4 lg:grid-cols-2">
          {bench.map((b) => {
            const max = Math.max(b.yours, b.typical)
            return (
              <div key={b.tag}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold">{b.tag}</span>
                  <span className={cx('font-bold', b.diff > 0.1 ? 'text-red-500' : b.diff < -0.1 ? 'text-brand-600' : 'text-muted')}>
                    {b.diff > 0 ? '+' : ''}
                    {Math.round(b.diff * 100)}% vs typical
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-14 text-muted">You</span>
                    <Progress value={b.yours / max} color={JAR_META[b.jarId].color} className="flex-1" />
                    <span className="w-14 text-right font-semibold">{rupees(b.yours)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-14 text-muted">Typical</span>
                    <Progress value={b.typical / max} color="#cbd5d0" className="flex-1" />
                    <span className="w-14 text-right text-muted">{rupees(b.typical)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <p className="mt-3 text-center text-[11px] text-muted">
        “Minty AI” in this prototype is a transparent rule-based engine (run-rate forecasting, peer benchmarks, habit scenarios) — no external AI service. Data as of {fmtMonthYear(p.demoDate)}.
      </p>
    </div>
  )
}
