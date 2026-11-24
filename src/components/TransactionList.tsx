import { MessageSquareText, Receipt, Users, Zap } from 'lucide-react'
import type { Transaction } from '@/data/types'
import { JarIcon } from './JarIcon'
import { rupees } from '@/lib/format'
import { relativeDay } from '@/lib/date'

const SOURCE: Record<string, { label: string; icon: typeof Zap; cls: string } | undefined> = {
  sms: { label: 'Auto-detected', icon: MessageSquareText, cls: 'bg-brand-50 text-brand-700' },
  split: { label: 'Split', icon: Users, cls: 'bg-purple-50 text-purple-700' },
  bill: { label: 'Bill', icon: Receipt, cls: 'bg-sky-50 text-sky-700' },
  auto: { label: 'Auto-save', icon: Zap, cls: 'bg-amber-50 text-amber-700' },
}

export function TransactionList({ txns, today, limit = 8 }: { txns: Transaction[]; today: string; limit?: number }) {
  return (
    <ul className="divide-y divide-line">
      {txns.slice(0, limit).map((t) => {
        const src = SOURCE[t.source]
        const isIn = t.kind === 'income'
        const isSave = t.kind === 'saving'
        return (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <JarIcon id={isIn ? 'savings' : t.jarId} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{t.merchant}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                <span>{relativeDay(t.date, today)}</span>
                <span>·</span>
                <span className="truncate">{isIn ? 'Income' : t.tag}</span>
                {src && (
                  <span className={`ml-1 inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-semibold ${src.cls}`}>
                    <src.icon size={10} /> {src.label}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-sm font-bold ${isIn ? 'text-brand-600' : isSave ? 'text-amber-600' : 'text-ink'}`}>
              {isIn ? '+' : isSave ? '→ ' : '−'}
              {rupees(t.amount)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
