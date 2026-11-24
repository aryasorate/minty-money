import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, MoneyInput, Select } from '@/components/ui/primitives'
import { JarIcon } from '@/components/JarIcon'
import { JAR_META, SPEND_JARS, TAGS } from '@/data/catalog'
import type { JarId } from '@/data/types'
import { useStore } from '@/store/useStore'
import { toast } from '@/store/toast'
import { cx, rupees } from '@/lib/format'

export function AddExpenseModal({ open, onClose, defaultJar = 'food' }: { open: boolean; onClose: () => void; defaultJar?: JarId }) {
  const addExpense = useStore((s) => s.addExpense)
  const [amount, setAmount] = useState<number | ''>('')
  const [merchant, setMerchant] = useState('')
  const [jarId, setJarId] = useState<JarId>(defaultJar)
  const [tag, setTag] = useState(TAGS[defaultJar][0])

  useEffect(() => {
    if (open) {
      setAmount('')
      setMerchant('')
      setJarId(defaultJar)
      setTag(TAGS[defaultJar][0])
    }
  }, [open, defaultJar])

  const submit = () => {
    if (!amount) return
    addExpense({ amount, jarId, tag, merchant: merchant.trim() || tag })
    toast(`${rupees(amount)} logged`, `Added to ${JAR_META[jarId].name}`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add an expense" subtitle="Manual entry — most expenses are auto-detected from SMS">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <MoneyInput value={amount} onChange={setAmount} placeholder="0" autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </Field>
          <Field label="What was it?">
            <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Canteen lunch" onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </Field>
        </div>
        <Field label="Jar">
          <div className="grid grid-cols-3 gap-2">
            {SPEND_JARS.map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => {
                  setJarId(j)
                  setTag(TAGS[j][0])
                }}
                className={cx(
                  'flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-semibold transition cursor-pointer',
                  jarId === j ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-200',
                )}
              >
                <JarIcon id={j} size={26} />
                {JAR_META[j].name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Category">
          <Select value={tag} onChange={(e) => setTag(e.target.value)}>
            {TAGS[jarId].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!amount}>
            Add expense
          </Button>
        </div>
      </div>
    </Modal>
  )
}
