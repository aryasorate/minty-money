import { useEffect, useState } from 'react'
import { CalendarClock, FastForward, FlaskConical, MessageSquareText, RotateCcw, SkipForward, Users, X, Send } from 'lucide-react'
import { useProfile, useStore, nextDay } from '@/store/useStore'
import { PERSONA_SPECS } from '@/data/personas'
import { fillSmsTemplate } from '@/engine/sms'
import { Button } from '@/components/ui/Button'
import { SimTag } from '@/components/ui/primitives'
import { fmtDateLong, dayOf, daysInMonthOf } from '@/lib/date'
import { toast } from '@/store/toast'

/**
 * Presenter tools. Everything here simulates an *input* to the app (an SMS arriving, time passing).
 * The app's reaction to those inputs is the real, implemented behaviour.
 */
export function DemoPanel() {
  const p = useProfile()
  const open = useStore((s) => s.demoPanelOpen)
  const setOpen = useStore((s) => s.setDemoPanel)
  const receiveSms = useStore((s) => s.receiveSms)
  const advanceTo = useStore((s) => s.advanceTo)
  const jumpMidMonth = useStore((s) => s.jumpMidMonth)
  const resetProfile = useStore((s) => s.resetProfile)
  const exitProfile = useStore((s) => s.exitProfile)
  const restartOnboarding = useStore((s) => s.restartOnboarding)
  const [custom, setCustom] = useState('')
  const spec = PERSONA_SPECS[p.persona.id]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  const send = (tpl: string) => {
    const sms = fillSmsTemplate(tpl, p.demoDate, spec.account, spec.bank)
    const det = receiveSms(sms)
    if (!det) toast("Couldn't read that SMS", 'Needs an amount (Rs/INR/₹) and debited/credited wording', 'warning')
    else setOpen(false)
  }
  const atMonthEnd = dayOf(p.demoDate) >= daysInMonthOf(p.demoDate)

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink/20" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-[380px] flex-col bg-white shadow-pop animate-slide-in">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-brand-600" />
            <p className="font-bold">Demo panel</p>
            <SimTag>Presenter tools</SimTag>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted hover:bg-brand-50 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <h4 className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <MessageSquareText size={14} /> Simulate a bank SMS
            </h4>
            <p className="mb-3 text-xs text-muted">In the real app this arrives from the phone's SMS inbox. Parsing & categorisation below are real.</p>
            <div className="grid grid-cols-2 gap-2">
              {spec.sms.map((s) => (
                <button key={s.label} onClick={() => send(s.sms)} className="rounded-xl border border-line px-3 py-2.5 text-left text-xs font-semibold hover:border-brand-300 hover:bg-brand-50 cursor-pointer">
                  {s.label}
                </button>
              ))}
            </div>
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="…or paste any bank SMS, e.g. “Rs.250 debited from A/c XX1234 to VPA zomato@ybl”"
              className="mt-3 h-20 w-full resize-none rounded-xl border border-line bg-[#fafcfb] p-3 text-xs outline-none focus:border-brand-400"
            />
            <Button size="sm" variant="soft" icon={<Send size={13} />} disabled={!custom.trim()} onClick={() => send(custom)} className="mt-1">
              Send custom SMS
            </Button>
          </section>

          <section>
            <h4 className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <CalendarClock size={14} /> Demo clock
            </h4>
            <p className="mb-3 text-xs text-muted">
              Today in the demo: <b className="text-ink">{fmtDateLong(p.demoDate)}</b>. Moving forward simulates {p.persona.name}'s usual spending.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" icon={<SkipForward size={14} />} disabled={atMonthEnd} onClick={() => advanceTo(nextDay(p))}>
                Next day
              </Button>
              <Button variant="primary" size="sm" icon={<FastForward size={14} />} disabled={atMonthEnd} onClick={() => jumpMidMonth()}>
                {dayOf(p.demoDate) < 18 ? 'Jump to mid-month' : 'Jump 5 days'}
              </Button>
            </div>
          </section>

          <section>
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <RotateCcw size={14} /> Reset
            </h4>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  resetProfile()
                  setOpen(false)
                  toast(`${p.persona.name}'s demo reset`, 'Back to the 10th with fresh data', 'info')
                }}
              >
                Reset {p.persona.name}'s data (re-runs onboarding)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  restartOnboarding()
                  setOpen(false)
                }}
              >
                Replay onboarding only
              </Button>
              <Button variant="ghost" size="sm" className="w-full" icon={<Users size={14} />} onClick={exitProfile}>
                Switch student
              </Button>
            </div>
          </section>
        </div>
        <p className="border-t border-line px-5 py-3 text-[11px] text-muted">Tip: the Demo panel is a presenter aid and wouldn't exist in the real app.</p>
      </aside>
    </div>
  )
}
