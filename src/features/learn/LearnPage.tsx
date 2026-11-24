import { useState } from 'react'
import { BadgeCheck, CircleCheck, Clock, Crown, GraduationCap } from 'lucide-react'
import { useProfile, useStore } from '@/store/useStore'
import { Card, PageHeader, Pill, Progress } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { COURSES, type Course } from '@/data/lessons'
import { cx } from '@/lib/format'
import { celebrate, toast } from '@/store/toast'

export function LearnPage() {
  const p = useProfile()
  const [open, setOpen] = useState<Course | null>(null)
  const done = (c: Course) => c.lessons.filter((l) => p.completedLessons.includes(l.id)).length

  return (
    <div className="animate-fade-up">
      <PageHeader title="Learn" subtitle="Finance courses for just ₹9" />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-5 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-7 py-6 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <GraduationCap size={30} />
          </div>
          <div className="flex-1">
            <p className="flex items-center gap-2 text-lg font-extrabold">
              <Crown size={18} /> Smart Money — Take control at just ₹9/month
            </p>
            <p className="mt-0.5 text-sm text-brand-100">Bite-sized lessons on budgeting, investing, side hustles and money hacks. Level up your money game.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-brand-700">
            <BadgeCheck size={16} /> Subscribed
          </span>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COURSES.map((c) => {
          const n = done(c)
          return (
            <Card key={c.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `${c.color}1a` }}>
                  {c.emoji}
                </span>
                <Pill tone="green">₹9</Pill>
              </div>
              <p className="mt-4 font-bold">{c.title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{c.blurb}</p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
                <span>
                  {c.lessons.length} lessons · {c.lessons.reduce((a, l) => a + l.minutes, 0)} min
                </span>
                <span className="font-semibold text-ink">
                  {n}/{c.lessons.length}
                </span>
              </div>
              <Progress value={n / c.lessons.length} color={c.color} height="h-1.5" className="mt-1.5" />
              <Button className="mt-4" size="sm" onClick={() => setOpen(c)} variant={n === c.lessons.length ? 'secondary' : 'primary'}>
                {n === 0 ? 'Start learning' : n === c.lessons.length ? 'Review course' : 'Continue'}
              </Button>
            </Card>
          )
        })}
      </div>

      <CourseModal course={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function CourseModal({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const p = useProfile()
  const complete = useStore((s) => s.completeLesson)
  const [idx, setIdx] = useState(0)
  if (!course) return null
  const lesson = course.lessons[Math.min(idx, course.lessons.length - 1)]
  const isDone = p.completedLessons.includes(lesson.id)
  const finish = () => {
    if (!isDone) {
      complete(lesson.id)
      if (p.completedLessons.length === 0) {
        celebrate()
        toast('Badge earned: Money Nerd 📚', 'You completed your first Smart Money lesson')
      } else toast('Lesson complete ✓', lesson.takeaway)
    }
    if (idx < course.lessons.length - 1) setIdx(idx + 1)
    else {
      setIdx(0)
      onClose()
    }
  }
  return (
    <Modal
      open
      onClose={() => {
        setIdx(0)
        onClose()
      }}
      title={
        <span>
          {course.emoji} {course.title}
        </span>
      }
      width="max-w-2xl"
    >
      <div className="grid grid-cols-[180px_1fr] gap-5">
        <ol className="space-y-1">
          {course.lessons.map((l, i) => (
            <li key={l.id}>
              <button
                onClick={() => setIdx(i)}
                className={cx('flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs cursor-pointer', i === idx ? 'bg-brand-50 font-semibold text-brand-800' : 'text-muted hover:bg-canvas')}
              >
                {p.completedLessons.includes(l.id) ? <CircleCheck size={14} className="mt-px shrink-0 text-brand-600" /> : <span className="mt-px w-3.5 shrink-0 text-center">{i + 1}</span>}
                {l.title}
              </button>
            </li>
          ))}
        </ol>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <Clock size={12} /> {lesson.minutes} min read
          </p>
          <h4 className="mt-1 text-lg font-bold">{lesson.title}</h4>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/80">
            {lesson.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
            <span className="font-bold text-brand-700">Key takeaway: </span>
            {lesson.takeaway}
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={finish}>{idx < course.lessons.length - 1 ? (isDone ? 'Next lesson' : 'Mark complete & next') : isDone ? 'Close' : 'Complete course'}</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
