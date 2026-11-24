import { create } from 'zustand'
import confetti from 'canvas-confetti'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'
export interface Toast {
  id: number
  title: string
  body?: string
  tone: ToastTone
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  remove: (id: number) => void
}

let n = 0
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++n
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3800)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

export const toast = (title: string, body?: string, tone: ToastTone = 'success') => useToasts.getState().push({ title, body, tone })

export function celebrate() {
  const colors = ['#16a34a', '#4ade80', '#f59e3b', '#c77dea', '#3ba6e8']
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.65 }, colors })
  setTimeout(() => confetti({ particleCount: 60, spread: 110, origin: { y: 0.55 }, colors }), 220)
}
