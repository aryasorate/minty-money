import { useMemo, useState } from 'react'
import { BellRing, CircleCheck, HandCoins, Plus, UserPlus, Users, UsersRound } from 'lucide-react'
import { useProfile, useStore } from '@/store/useStore'
import { Card, CardHeader, EmptyState, Field, FriendChip, Input, MoneyInput, PageHeader, Pill, Select, StatCard } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ME, type JarId } from '@/data/types'
import { JAR_META } from '@/data/catalog'
import { friendBalances, friendName, splitTotals } from '@/engine/split'
import { cx, rupees } from '@/lib/format'
import { relativeDay } from '@/lib/date'
import { toast } from '@/store/toast'

const EMOJI_GUESS: [RegExp, string][] = [
  [/pizza/i, '🍕'],
  [/rent|pg|hostel|room/i, '🏠'],
  [/movie|film/i, '🎬'],
  [/cab|uber|ola|auto/i, '🚕'],
  [/grocer|blinkit|zepto/i, '🛒'],
  [/wifi|internet/i, '📶'],
  [/trip|goa|travel/i, '🏖️'],
  [/brunch|lunch|dinner|cafe|food/i, '🍽️'],
  [/electric|power/i, '⚡'],
]

export function SplitPage() {
  const p = useProfile()
  const addSplit = useStore((s) => s.addSplit)
  const settleFriend = useStore((s) => s.settleFriend)
  const remind = useStore((s) => s.remind)
  const settleShare = useStore((s) => s.settleShare)
  const totals = useMemo(() => splitTotals(p), [p])
  const balances = useMemo(() => friendBalances(p), [p])

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [groupId, setGroupId] = useState<string>('')
  const [selected, setSelected] = useState<string[]>([])
  const [paidBy, setPaidBy] = useState<string>(ME)
  const [jarId, setJarId] = useState<JarId>('food')
  const [modal, setModal] = useState<'friend' | 'group' | null>(null)

  const pickGroup = (id: string) => {
    setGroupId(id)
    const g = p.groups.find((x) => x.id === id)
    if (g) setSelected(g.memberIds)
  }
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const participants = [ME, ...selected]
  const each = amount && participants.length > 1 ? Math.floor(Number(amount) / participants.length) : 0

  const submit = () => {
    if (!amount || selected.length === 0) return
    const name = title.trim() || 'Shared expense'
    addSplit({
      title: name,
      emoji: EMOJI_GUESS.find(([re]) => re.test(name))?.[1] ?? '🧾',
      amount: Number(amount),
      paidBy,
      participants,
      groupId: groupId || undefined,
      jarId,
    })
    toast('Bill split!', `${rupees(each)} each between ${participants.length} people${paidBy === ME ? ' · your share logged to ' + JAR_META[jarId].name : ''}`)
    setTitle('')
    setAmount('')
    setSelected([])
    setGroupId('')
    setPaidBy(ME)
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Split Bills"
        subtitle="No more awkward money conversations"
        right={
          <>
            <Button variant="secondary" size="sm" icon={<UserPlus size={15} />} onClick={() => setModal('friend')}>
              Add friend
            </Button>
            <Button variant="secondary" size="sm" icon={<UsersRound size={15} />} onClick={() => setModal('group')}>
              Create group
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="You owe" value={<span className="text-red-500">{rupees(totals.youOwe)}</span>} sub="across all friends" />
        <StatCard label="Owed to you" value={<span className="text-brand-600">{rupees(totals.owedToYou)}</span>} sub="pending from friends" />
        <StatCard label="Active groups" value={p.groups.length} sub={`${p.friends.length} friends`} />
      </div>

      <Card className="mt-4 p-6">
        <h3 className="text-[15px] font-bold">Split a new bill</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_1fr]">
          <Field label="What did you pay for?">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pizza night 🍕" />
          </Field>
          <Field label="Total amount">
            <MoneyInput value={amount} onChange={setAmount} placeholder="0" />
          </Field>
          <Field label="Group (optional)">
            <Select value={groupId} onChange={(e) => pickGroup(e.target.value)}>
              <option value="">No group</option>
              {p.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold">Split with:</p>
          <div className="flex flex-wrap gap-2">
            {p.friends.map((f) => (
              <FriendChip key={f.id} name={f.name} active={selected.includes(f.id)} onClick={() => toggle(f.id)} />
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Field label="Paid by">
            <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              <option value={ME}>You</option>
              {selected.map((id) => (
                <option key={id} value={id}>
                  {friendName(p, id)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Count your share in">
            <Select value={jarId} onChange={(e) => setJarId(e.target.value as JarId)}>
              {(['food', 'fun', 'travel', 'rent', 'other'] as JarId[]).map((j) => (
                <option key={j} value={j}>
                  {JAR_META[j].name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
              {each ? (
                <>
                  <b>{rupees(each)}</b> each · {participants.length} people
                </>
              ) : (
                'Pick friends to see each share'
              )}
            </div>
          </div>
        </div>
        <Button className="mt-4 w-full" icon={<Plus size={16} />} disabled={!amount || selected.length === 0} onClick={submit}>
          Split bill
        </Button>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader title="Recent expenses" subtitle="Who has paid and who is pending" />
          <div className="space-y-3 px-6 pb-6 pt-4">
            {p.splits.length === 0 && <EmptyState icon={<Users size={22} />} title="No shared expenses yet" />}
            {p.splits.map((e) => {
              const mine = e.shares.find((s) => s.personId === ME)
              const pending = e.shares.filter((s) => !s.settled && s.personId !== e.paidBy)
              const group = p.groups.find((g) => g.id === e.groupId)
              return (
                <div key={e.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg">{e.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-xs text-brand-700">
                        Paid by {friendName(p, e.paidBy)} · {relativeDay(e.date, p.demoDate)}
                        {group && <span className="text-muted"> · {group.emoji} {group.name}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{rupees(e.amount)}</p>
                      <p className="text-xs text-muted">Your share: {rupees(mine?.amount ?? 0)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {e.shares
                      .filter((s) => s.personId !== e.paidBy)
                      .map((s) => (
                        <button
                          key={s.personId}
                          disabled={s.settled || e.paidBy !== ME}
                          title={!s.settled && e.paidBy === ME ? 'Mark as paid' : undefined}
                          onClick={() => {
                            settleShare(e.id, s.personId)
                            toast(`${friendName(p, s.personId)} paid ${rupees(s.amount)}`, `for ${e.title}`)
                          }}
                          className={cx(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                            s.settled ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700',
                            !s.settled && e.paidBy === ME && 'cursor-pointer hover:bg-amber-100',
                          )}
                        >
                          {s.settled ? <CircleCheck size={11} /> : <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                          {friendName(p, s.personId)} · {s.settled ? 'paid' : 'pending'}
                        </button>
                      ))}
                    {e.paidBy === ME && pending.length > 0 && (
                      <Button
                        size="sm"
                        variant="soft"
                        className="ml-auto"
                        icon={<BellRing size={13} />}
                        onClick={() => pending.forEach((s) => remind(s.personId))}
                      >
                        {e.lastReminded === p.demoDate ? 'Reminded' : 'Remind'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Friends balance" subtitle="Settle up with one tap" icon={<HandCoins size={18} />} />
            <ul className="divide-y divide-line px-6 pb-3 pt-2">
              {p.friends.map((f) => {
                const bal = balances.get(f.id) ?? 0
                return (
                  <li key={f.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{f.name[0]}</span>
                    <span className="flex-1 text-sm font-semibold">{f.name}</span>
                    {bal === 0 ? (
                      <span className="text-xs text-muted">all square</span>
                    ) : (
                      <>
                        <div className="text-right">
                          <p className={cx('text-sm font-bold', bal > 0 ? 'text-brand-600' : 'text-red-500')}>
                            {bal > 0 ? '+' : '−'}
                            {rupees(Math.abs(bal))}
                          </p>
                          <p className="text-[10px] text-muted">{bal > 0 ? 'owes you' : 'you owe'}</p>
                        </div>
                        {bal > 0 ? (
                          <Button size="sm" variant="secondary" onClick={() => remind(f.id)}>
                            Remind
                          </Button>
                        ) : null}
                        <Button size="sm" variant={bal < 0 ? 'primary' : 'soft'} onClick={() => settleFriend(f.id)}>
                          Settle
                        </Button>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Groups" icon={<UsersRound size={18} />} />
            <div className="grid grid-cols-1 gap-2 px-6 pb-6 pt-4">
              {p.groups.map((g) => {
                const total = p.splits.filter((e) => e.groupId === g.id).reduce((a, e) => a + e.amount, 0)
                return (
                  <div key={g.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                    <span className="text-xl">{g.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{g.name}</p>
                      <p className="text-[11px] text-muted">You + {g.memberIds.map((id) => friendName(p, id)).join(', ')}</p>
                    </div>
                    <Pill tone="gray">{rupees(total)}</Pill>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      <AddFriendModal open={modal === 'friend'} onClose={() => setModal(null)} />
      <CreateGroupModal open={modal === 'group'} onClose={() => setModal(null)} />
    </div>
  )
}

function AddFriendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addFriend = useStore((s) => s.addFriend)
  const [name, setName] = useState('')
  const submit = () => {
    if (!name.trim()) return
    addFriend(name.trim())
    toast(`${name.trim()} added`, 'You can now split bills with them')
    setName('')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Add a friend">
      <Field label="Name">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="e.g. Sneha" />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!name.trim()}>
          Add friend
        </Button>
      </div>
    </Modal>
  )
}

function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = useProfile()
  const createGroup = useStore((s) => s.createGroup)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [members, setMembers] = useState<string[]>([])
  const submit = () => {
    if (!name.trim() || members.length === 0) return
    createGroup(name.trim(), emoji, members)
    toast(`Group "${name.trim()}" created`)
    setName('')
    setMembers([])
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Create a group" subtitle="For flatmates, trips, or your weekend squad">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <Field label="Icon">
          <Select value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-20">
            {['🎉', '🏠', '🏖️', '🍕', '💻', '🎬', '⚽', '🚗'].map((e) => (
              <option key={e}>{e}</option>
            ))}
          </Select>
        </Field>
        <Field label="Group name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip 2027" />
        </Field>
      </div>
      <p className="mb-2 mt-4 text-xs font-semibold">Members</p>
      <div className="flex flex-wrap gap-2">
        {p.friends.map((f) => (
          <FriendChip key={f.id} name={f.name} active={members.includes(f.id)} onClick={() => setMembers((m) => (m.includes(f.id) ? m.filter((x) => x !== f.id) : [...m, f.id]))} />
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!name.trim() || members.length === 0}>
          Create group
        </Button>
      </div>
    </Modal>
  )
}
