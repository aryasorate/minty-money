import { useNavigate } from 'react-router-dom'
import { ArrowRight, RotateCcw, Quote } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PERSONA_ORDER, PERSONA_SPECS } from '@/data/personas'
import { JarMark } from '@/components/Logo'
import { Avatar, Pill } from '@/components/ui/primitives'
import { rupees } from '@/lib/format'
import { toast } from '@/store/toast'

export function ProfilePicker() {
  const select = useStore((s) => s.selectProfile)
  const profiles = useStore((s) => s.profiles)
  const resetAll = useStore((s) => s.resetAll)
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,#dff5e6_0%,#f5f8f6_55%)]">
      <div className="mx-auto max-w-6xl px-8 py-14">
        <div className="flex flex-col items-center text-center animate-fade-up">
          <JarMark size={64} />
          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-ink">
            Minty <span className="text-brand-600">Money</span>
          </h1>
          <p className="mt-3 inline-flex rounded-full bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white">“Smart, Simple, Student-First”</p>
          <p className="mt-5 max-w-xl text-[15px] text-muted">
            A money coach for college students — not just another expense tracker. Pick a student to explore Minty Money through their eyes.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 xl:grid-cols-4">
          {PERSONA_ORDER.map((id, i) => {
            const spec = PERSONA_SPECS[id]
            const m = spec.meta
            const income = spec.incomes.reduce((a, x) => a + (x.creditDay > 0 ? x.amount : 0), 0)
            const started = !!profiles[id]
            return (
              <button
                key={id}
                onClick={() => {
                  select(id)
                  navigate('/')
                }}
                style={{ animationDelay: `${i * 70}ms` }}
                className="group flex flex-col rounded-3xl border border-line bg-white p-6 text-left shadow-card transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-pop animate-fade-up cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} color={m.avatarColor} size={48} />
                  <div>
                    <p className="text-lg font-extrabold text-ink">
                      {m.name}, {m.age}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: m.avatarColor }}>
                      {m.archetype}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted">
                  {m.course}
                  <br />
                  {m.college}
                </p>
                <div className="relative mt-4 rounded-2xl bg-canvas p-3.5">
                  <Quote size={14} className="absolute -top-2 left-3 text-brand-400" />
                  <p className="text-sm font-medium italic text-ink">“{m.quote}”</p>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  <span className="font-semibold text-ink">Pain point: </span>
                  {m.painPoint}
                </p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <Pill tone="green">{rupees(income)}/month</Pill>
                  <span className="flex items-center gap-1 text-sm font-bold text-brand-600 transition-transform group-hover:translate-x-0.5">
                    {started ? 'Continue' : 'Start'} <ArrowRight size={16} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 text-xs text-muted">
          <span>Prototype · all data is synthetic and stays in this browser</span>
          <span>·</span>
          <button
            onClick={() => {
              resetAll()
              toast('Demo data reset', 'All four profiles are back to their starting state', 'info')
            }}
            className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink cursor-pointer"
          >
            <RotateCcw size={12} /> Reset all demo data
          </button>
        </div>
      </div>
    </div>
  )
}
