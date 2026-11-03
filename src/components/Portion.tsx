import { useEffect, useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Sheet } from './Sheet'
import { ChipRow, DietMark, dietLabel } from './bits'
import { Num } from './Plate'
import { CUISINES } from '../data/foods'
import { MACROS, fmtQty, grams, kcal, nutrientsFor, unitOf } from '../lib/nutrition'
import { MEALS } from '../lib/date'
import { buzz } from '../lib/device'
import { useStore, useToast } from '../store'
import type { Entry, Food, MealKey } from '../types'

interface Props {
  food: Food | null
  entry: Entry | null // set when editing something already logged
  day: string
  meal: MealKey
  onClose: () => void
  onDone: () => void
}

const isMass = (key: string) => key === 'g' || key === 'ml'

export function Portion({ food, entry, day, meal: initialMeal, onClose, onDone }: Props) {
  const open = !!food
  const uses = useStore((s) => s.uses)
  const targets = useStore((s) => s.targets)
  const addEntry = useStore((s) => s.addEntry)
  const updateEntry = useStore((s) => s.updateEntry)
  const removeEntry = useStore((s) => s.removeEntry)
  const restoreEntry = useStore((s) => s.restoreEntry)
  const show = useToast((s) => s.show)

  const [qty, setQty] = useState(1)
  const [unitKey, setUnitKey] = useState('')
  const [meal, setMeal] = useState<MealKey>(initialMeal)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!food) return
    if (entry) {
      setQty(entry.qty)
      setUnitKey(entry.unitKey)
      setMeal(entry.meal)
    } else {
      const last = uses[food.id]
      const lastOk = last && food.units.some((u) => u.key === last.unitKey)
      setQty(lastOk ? last.qty : 1)
      setUnitKey(lastOk ? last.unitKey : food.units[0].key)
      setMeal(initialMeal)
    }
    setEditing(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food, entry])

  if (!food) return <Sheet open={false} onClose={onClose} label="Portion">{null}</Sheet>

  const unit = unitOf(food, unitKey)
  const mass = isMass(unit.key)
  const step = mass ? (qty >= 200 ? 25 : 10) : 0.5
  const min = mass ? 5 : 0.25
  const n = nutrientsFor(food, qty * unit.g)
  const mealLabel = MEALS.find((m) => m.key === meal)!.label
  const cuisine = CUISINES.find((c) => c.key === food.cuisine)?.label ?? (food.brand || 'Packaged')

  function changeUnit(key: string) {
    const next = unitOf(food!, key)
    const g = qty * unit.g
    let q = g / next.g
    q = isMass(next.key) ? Math.max(5, Math.round(q / 5) * 5) : Math.max(0.25, Math.round(q * 2) / 2)
    setUnitKey(next.key)
    setQty(q)
    buzz(6)
  }

  function nudge(dir: 1 | -1) {
    const next = Math.round((qty + dir * step) * 100) / 100
    setQty(Math.max(min, dir < 0 && qty <= 0.5 && !mass ? 0.25 : next))
    buzz(6)
  }

  function commitDraft() {
    const v = parseFloat(draft.replace(',', '.'))
    if (Number.isFinite(v) && v > 0) setQty(Math.round(v * 100) / 100)
    setEditing(false)
  }

  function save() {
    if (entry) {
      updateEntry(day, entry.id, { qty, unitKey, meal })
      show({ message: `Updated ${food!.name}` })
    } else {
      const added = addEntry(day, food!, qty, unitKey, meal)
      show({
        message: `Added ${food!.name} to ${mealLabel.toLowerCase()}`,
        action: { label: 'Undo', run: () => removeEntry(day, added.id) },
      })
    }
    buzz(18)
    onDone()
  }

  function remove() {
    const removed = removeEntry(day, entry!.id)
    buzz(18)
    if (removed) show({ message: `Removed ${food!.name}`, action: { label: 'Undo', run: () => restoreEntry(day, removed) } })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} label={`Portion of ${food.name}`}>
      <div className="sheet-body">
        <div className="portion-head">
          <div className="portion-emoji" aria-hidden="true">{food.emoji}</div>
          <div>
            <h2>{food.name}</h2>
            <p>
              <DietMark diet={food.diet} />
              {food.diet ? `${dietLabel(food.diet)}, ` : ''}
              {cuisine}
            </p>
          </div>
        </div>

        <div className="stepper">
          <button className="step" onClick={() => nudge(-1)} aria-label="Less" disabled={qty <= min}>
            <Minus size={24} strokeWidth={2.6} />
          </button>
          <div className="qty">
            {editing ? (
              <input
                autoFocus
                inputMode="decimal"
                aria-label="Amount"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => e.key === 'Enter' && commitDraft()}
              />
            ) : (
              <button
                className="qty-btn"
                aria-label={`Amount ${qty}, tap to type`}
                onClick={() => {
                  setDraft(String(qty))
                  setEditing(true)
                }}
              >
                {mass ? Math.round(qty) : fmtQty(qty)}
              </button>
            )}
            <span>
              {unit.label}
              {!mass && ` (${Math.round(qty * unit.g)} ${food.liquid ? 'ml' : 'g'})`}
            </span>
          </div>
          <button className="step" onClick={() => nudge(1)} aria-label="More">
            <Plus size={24} strokeWidth={2.6} />
          </button>
        </div>

        <h3 className="field-label">Measured in</h3>
        <ChipRow label="Unit" style={{ paddingTop: 8 }}>
          {food.units.map((u) => (
            <button key={u.key} className="chip" aria-pressed={u.key === unit.key} onClick={() => changeUnit(u.key)}>
              {u.label}
              {!isMass(u.key) && <small>{u.g} {food.liquid ? 'ml' : 'g'}</small>}
            </button>
          ))}
        </ChipRow>

        <h3 className="field-label">Meal</h3>
        <ChipRow label="Meal" style={{ paddingTop: 8 }}>
          {MEALS.map((m) => (
            <button key={m.key} className="chip" aria-pressed={meal === m.key} onClick={() => setMeal(m.key)}>
              <span aria-hidden="true">{m.emoji}</span> {m.label}
            </button>
          ))}
        </ChipRow>

        <div className="facts">
          <div className="facts-kcal">
            <span className="muted">Calories</span>
            <b>
              <Num value={n.kcal} /> <small className="small faint">kcal</small>
            </b>
          </div>
          <div className="bars">
            {MACROS.map((m) => {
              const v = n[m.key]
              const goal = targets[m.key] || 1
              return (
                <div className="bar-row" key={m.key}>
                  <span>{m.label}</span>
                  <div className="bar" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, (v / goal) * 100)}%`, background: m.color, transition: 'width .4s cubic-bezier(.22,1,.36,1)' }} />
                  </div>
                  <span>{grams(v)} g</span>
                </div>
              )
            })}
          </div>
          <p className="small faint" style={{ marginTop: 10 }}>
            Bars show how much of your daily goal this covers. {kcal((n.kcal / (targets.kcal || 1)) * 100)}% of today's calories.
          </p>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={save} disabled={!(qty > 0)}>
            {entry ? 'Save changes' : `Add to ${mealLabel.toLowerCase()}`}
          </button>
          {entry && (
            <button className="btn btn-danger" onClick={remove}>
              <Trash2 size={18} /> Remove from {MEALS.find((m) => m.key === entry.meal)!.label.toLowerCase()}
            </button>
          )}
        </div>
      </div>
    </Sheet>
  )
}
