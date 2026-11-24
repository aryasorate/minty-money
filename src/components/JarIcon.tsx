import { BookOpen, Bus, House, Package, PartyPopper, PiggyBank, Utensils, type LucideIcon } from 'lucide-react'
import { JAR_META } from '@/data/catalog'
import type { JarId } from '@/data/types'

const ICONS: Record<JarId, LucideIcon> = {
  rent: House,
  food: Utensils,
  travel: Bus,
  academics: BookOpen,
  fun: PartyPopper,
  other: Package,
  savings: PiggyBank,
}

export function JarIcon({ id, size = 36 }: { id: JarId; size?: number }) {
  const Icon = ICONS[id]
  const m = JAR_META[id]
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl" style={{ width: size, height: size, background: m.soft, color: m.color }}>
      <Icon size={size * 0.5} strokeWidth={2.2} />
    </span>
  )
}
