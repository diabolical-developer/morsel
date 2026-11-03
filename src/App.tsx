import { useEffect, useState } from 'react'
import { BookOpen, ChartNoAxesColumn, Plus, Sun, UserRound } from 'lucide-react'
import { useStore } from './store'
import { Today } from './screens/Today'
import { Journal } from './screens/Journal'
import { Trends } from './screens/Trends'
import { Me } from './screens/Me'
import { Onboarding } from './screens/Onboarding'
import { AddFood } from './components/AddFood'
import { Portion } from './components/Portion'
import { CreateFood } from './components/CreateFood'
import { Toast } from './components/bits'
import { dayKey, mealForNow } from './lib/date'
import type { Entry, Food, MealKey } from './types'

type Tab = 'today' | 'journal' | 'trends' | 'me'

const TABS: { key: Tab; label: string; Icon: typeof Sun }[] = [
  { key: 'today', label: 'Today', Icon: Sun },
  { key: 'journal', label: 'Journal', Icon: BookOpen },
  { key: 'trends', label: 'Trends', Icon: ChartNoAxesColumn },
  { key: 'me', label: 'Me', Icon: UserRound },
]

export default function App() {
  const onboarded = useStore((s) => s.profile.onboarded)
  const theme = useStore((s) => s.theme)
  const [tab, setTab] = useState<Tab>('today')
  const [day, setDay] = useState(dayKey())
  const [meal, setMeal] = useState<MealKey>(mealForNow())
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<Food | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  // Roll over to the new day if the app stays open past midnight.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setDay((d) => (d > dayKey() ? dayKey() : d))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  if (!onboarded) return <Onboarding />

  const openAdd = (m: MealKey = day === dayKey() ? mealForNow() : 'lunch') => {
    setMeal(m)
    setSearching(true)
  }

  return (
    <div className="app">
      {tab === 'today' && <Today day={day} setDay={setDay} onAdd={openAdd} onEdit={setEditing} />}
      {tab === 'journal' && (
        <Journal
          onOpenDay={(d) => {
            setDay(d)
            setTab('today')
          }}
        />
      )}
      {tab === 'trends' && <Trends />}
      {tab === 'me' && <Me />}

      <nav className="nav" aria-label="Main">
        {TABS.slice(0, 2).map((t) => (
          <NavTab key={t.key} label={t.label} Icon={t.Icon} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
        <button
          className="fab"
          aria-label="Add food"
          onClick={() => {
            if (tab !== 'today') {
              setTab('today')
            }
            openAdd()
          }}
        >
          <Plus size={30} strokeWidth={2.6} />
        </button>
        {TABS.slice(2).map((t) => (
          <NavTab key={t.key} label={t.label} Icon={t.Icon} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </nav>

      <AddFood
        open={searching}
        onClose={() => setSearching(false)}
        day={day}
        meal={meal}
        setMeal={setMeal}
        onPick={setPicked}
        onCreate={(name) => setCreating(name)}
      />
      <CreateFood
        open={creating !== null}
        initialName={creating ?? ''}
        onClose={() => setCreating(null)}
        onCreated={(food) => {
          setCreating(null)
          setPicked(food)
        }}
      />
      <Portion
        food={picked ?? editing?.food ?? null}
        entry={editing}
        day={day}
        meal={meal}
        onClose={() => {
          setPicked(null)
          setEditing(null)
        }}
        onDone={() => {
          setPicked(null)
          setEditing(null)
          setSearching(false)
        }}
      />
      <Toast />
    </div>
  )
}

function NavTab({ label, Icon, active, onClick }: { label: string; Icon: typeof Sun; active: boolean; onClick: () => void }) {
  return (
    <button className="tab" aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon size={24} />
      {label}
    </button>
  )
}
