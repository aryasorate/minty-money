import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Landmark, Lock, MessageSquareText, ShieldCheck, WandSparkles } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { JarMark } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Avatar, Card, MoneyInput, SimTag } from '@/components/ui/primitives'
import { JarIcon } from '@/components/JarIcon'
import { ALL_JARS, JAR_META } from '@/data/catalog'
import type { IncomeSource, JarId } from '@/data/types'
import { recommendedSplit } from '@/features/jars/budgetModals'
import { cx, rupees, sum } from '@/lib/format'

const STEPS = ['Welcome', 'Money in', 'Your jars', 'Connect']

export function Onboarding() {
  const p = useStore((s) => s.profiles[s.activeId!]!)
  const complete = useStore((s) => s.completeOnboarding)
  const exitProfile = useStore((s) => s.exitProfile)
  const [step, setStep] = useState(0)
  const [incomes, setIncomes] = useState<IncomeSource[]>(p.incomes)
  const [budgets, setBudgets] = useState<Record<JarId, number>>(() => Object.fromEntries(p.jars.map((j) => [j.id, j.budget])) as Record<JarId, number>)
  const [sms, setSms] = useState(true)
  const [bank, setBank] = useState<'idle' | 'linking' | 'done'>('idle')
  const [progress, setProgress] = useState(0)

  const monthly = sum(incomes.filter((i) => i.creditDay > 0).map((i) => i.amount))
  const allocated = sum(Object.values(budgets))
  const m = p.persona

  useEffect(() => {
    if (bank !== 'linking') return
    const t = setInterval(() => setProgress((x) => Math.min(100, x + 7)), 90)
    return () => clearInterval(t)
  }, [bank])
  useEffect(() => {
    if (progress >= 100 && bank === 'linking') setBank('done')
  }, [progress, bank])

  const navigate = useNavigate()
  const finish = () => {
    complete({ incomes, budgets, smsLinked: sms, bankLinked: bank === 'done' })
    navigate('/')
  }
  const txnCount = useMemo(() => p.transactions.length, [p.transactions])

  return (
    <div className="flex min-h-full flex-col bg-[radial-gradient(ellipse_at_top,#dff5e6_0%,#f5f8f6_55%)]">
      <header className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-2.5">
          <JarMark size={32} />
          <span className="text-lg font-extrabold">
            Minty <span className="text-brand-600">Money</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={cx(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-white text-muted border border-line',
                )}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </span>
              <span className={cx('text-xs font-semibold', i === step ? 'text-ink' : 'text-muted')}>{s}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
            </div>
          ))}
        </div>
        <button onClick={finish} className="text-xs font-semibold text-muted hover:text-ink cursor-pointer">
          Skip setup →
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pb-12 pt-4">
        <Card className="w-full max-w-2xl p-8 animate-pop" key={step}>
          {step === 0 && (
            <div className="text-center">
              <div className="flex justify-center">
                <Avatar name={m.name} color={m.avatarColor} size={72} />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold">Hey {m.name}! 👋</h2>
              <p className="mt-1 text-sm text-muted">
                {m.course} · {m.college}
              </p>
              <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink/80">
                Minty Money is your personal money coach. In the next minute we'll set up your income, split it into jars, and switch on auto-tracking — so you always know
                <b> how much you have left this month.</b>
              </p>
              <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 text-left">
                {[
                  ['🫙', 'Money Jars', 'Every rupee gets a job'],
                  ['📲', 'Auto-detect', 'No manual logging'],
                  ['🎯', 'Goals & nudges', 'Save for what matters'],
                ].map(([e, t, d]) => (
                  <div key={t} className="rounded-xl bg-canvas p-3">
                    <p className="text-xl">{e}</p>
                    <p className="mt-1 text-xs font-bold">{t}</p>
                    <p className="text-[11px] text-muted">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-extrabold">Where does your money come from?</h2>
              <p className="mt-1 text-sm text-muted">Allowance, stipend, part-time or freelance — add what you expect each month.</p>
              <div className="mt-6 space-y-3">
                {incomes.map((inc, i) => (
                  <div key={inc.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">
                      {inc.kind === 'allowance' ? '👨‍👩‍👦' : inc.kind === 'stipend' ? '💼' : inc.kind === 'freelance' ? '🎨' : '⏱️'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{inc.name}</p>
                      <p className="text-[11px] text-muted">{inc.creditDay > 0 ? `Usually arrives on day ${inc.creditDay}` : 'Irregular — Minty will detect it when it lands'}</p>
                    </div>
                    <MoneyInput
                      className="w-36"
                      value={inc.amount}
                      onChange={(v) => setIncomes((xs) => xs.map((x, j) => (j === i ? { ...x, amount: Number(v) || 0 } : x)))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                <span className="text-sm text-brand-800">Regular monthly income</span>
                <span className="text-lg font-extrabold text-brand-700">{rupees(monthly)}</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold">Split it into Money Jars</h2>
                  <p className="mt-1 text-sm text-muted">Bills first, pay yourself, then spend guilt-free from the rest.</p>
                </div>
                <Button variant="soft" size="sm" icon={<WandSparkles size={14} />} onClick={() => setBudgets(recommendedSplit({ ...p, incomes }, monthly))}>
                  Auto-split
                </Button>
              </div>
              <div className="mt-5 space-y-2">
                {ALL_JARS.map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <JarIcon id={j} size={34} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{JAR_META[j].name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#edf2ef]">
                        <div className="h-full rounded-full transition-all" style={{ width: `${monthly ? Math.min(100, (budgets[j] / monthly) * 100) : 0}%`, background: JAR_META[j].color }} />
                      </div>
                    </div>
                    <span className="w-10 text-right text-[11px] text-muted">{monthly ? Math.round((budgets[j] / monthly) * 100) : 0}%</span>
                    <MoneyInput className="w-32" value={budgets[j]} onChange={(v) => setBudgets((b) => ({ ...b, [j]: Number(v) || 0 }))} />
                  </div>
                ))}
              </div>
              <div className={cx('mt-5 rounded-xl px-4 py-3 text-sm', allocated > monthly ? 'bg-amber-50 text-amber-800' : 'bg-brand-50 text-brand-800')}>
                {rupees(allocated)} of {rupees(monthly)} allocated
                {allocated > monthly ? ` — ${rupees(allocated - monthly)} over your income` : allocated < monthly ? ` · ${rupees(monthly - allocated)} unallocated` : ' · every rupee has a job ✓'}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-extrabold">Switch on auto-tracking</h2>
              <p className="mt-1 text-sm text-muted">Students forget to log expenses. Minty does it for you.</p>
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-4 rounded-2xl border border-line p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MessageSquareText size={22} />
                  </span>
                  <div className="flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      Read payment SMS <SimTag />
                    </p>
                    <p className="mt-0.5 text-xs text-muted">Detects UPI & card spends instantly and asks you to categorise with one tap. Only bank/UPI messages are read.</p>
                  </div>
                  <button
                    onClick={() => setSms(!sms)}
                    className={cx('relative h-7 w-12 shrink-0 rounded-full transition cursor-pointer', sms ? 'bg-brand-600' : 'bg-slate-300')}
                    aria-label="Toggle SMS reading"
                  >
                    <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', sms ? 'left-6' : 'left-1')} />
                  </button>
                </div>
                <div className="rounded-2xl border border-line p-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Landmark size={22} />
                    </span>
                    <div className="flex-1">
                      <p className="flex items-center gap-2 font-semibold">
                        Link your bank account <SimTag />
                      </p>
                      <p className="mt-0.5 text-xs text-muted">Securely import past transactions via India's Account Aggregator framework (read-only).</p>
                    </div>
                    {bank === 'idle' && (
                      <Button size="sm" variant="secondary" onClick={() => setBank('linking')}>
                        Link bank
                      </Button>
                    )}
                    {bank === 'done' && (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                        <Check size={16} /> Linked
                      </span>
                    )}
                  </div>
                  {bank !== 'idle' && (
                    <div className="mt-4 rounded-xl bg-canvas p-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold">{bank === 'done' ? `Imported ${txnCount} transactions from the last 6 months` : 'Fetching transactions…'}</span>
                        <span className="text-muted">{progress}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      {bank === 'done' && <p className="mt-2 text-[11px] text-brand-700">✨ 96% auto-categorised into your jars</p>}
                    </div>
                  )}
                </div>
                <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted">
                  <Lock size={12} /> <ShieldCheck size={12} /> Read-only access. Minty can never move your money.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            {step === 0 ? (
              <button onClick={exitProfile} className="text-sm font-semibold text-muted hover:text-ink cursor-pointer">
                ← Choose another student
              </button>
            ) : (
              <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                {step === 0 ? "Let's go" : 'Continue'} <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={finish} disabled={bank === 'linking'}>
                Open my dashboard <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
