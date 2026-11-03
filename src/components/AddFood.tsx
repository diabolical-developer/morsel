import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, X, PackageSearch, PencilLine, Loader2 } from 'lucide-react'
import { Sheet } from './Sheet'
import { ChipRow, DietMark, defaultPortion, portionKcal } from './bits'
import { CUISINES, FOOD_BY_ID, POPULAR } from '../data/foods'
import { searchFoods } from '../lib/search'
import { searchPackaged } from '../lib/packaged'
import { MEALS } from '../lib/date'
import { buzz } from '../lib/device'
import { useStore, useToast } from '../store'
import type { Food, MealKey } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  day: string
  meal: MealKey
  setMeal: (m: MealKey) => void
  onPick: (food: Food) => void
  onCreate: (name: string) => void
}

type Packaged = { state: 'idle' | 'loading' | 'done' | 'error'; items: Food[]; error?: string }

export function AddFood({ open, onClose, day, meal, setMeal, onPick, onCreate }: Props) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const profileDiet = useStore((s) => s.profile.diet)
  const [dietOnly, setDietOnly] = useState(profileDiet !== 'nonveg')
  const [packaged, setPackaged] = useState<Packaged>({ state: 'idle', items: [] })
  const custom = useStore((s) => s.custom)
  const uses = useStore((s) => s.uses)
  const inputRef = useRef<HTMLInputElement>(null)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setCuisine('')
      setPackaged({ state: 'idle', items: [] })
      setDietOnly(profileDiet !== 'nonveg')
      // Let the sheet start sliding before the keyboard appears.
      const t = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(t)
    }
  }, [open, profileDiet])

  useEffect(() => {
    setPackaged({ state: 'idle', items: [] })
  }, [query])

  const byId = (id: string) => custom.find((f) => f.id === id) ?? FOOD_BY_ID.get(id)

  const recent = useMemo(
    () =>
      Object.entries(uses)
        .sort((a, b) => b[1].last - a[1].last)
        .slice(0, 8)
        .map(([id]) => byId(id))
        .filter((f): f is Food => !!f),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uses, custom],
  )

  const browsing = !query.trim() && !cuisine
  const diet = dietOnly ? profileDiet : undefined
  const results = useMemo(
    () => (browsing ? [] : searchFoods(query, custom, { cuisine: cuisine || undefined, diet }).slice(0, 60)),
    [browsing, query, cuisine, custom, diet],
  )
  const popular = POPULAR.map(byId).filter((f): f is Food => !!f)

  async function findPackaged() {
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setPackaged({ state: 'loading', items: [] })
    try {
      const items = await searchPackaged(query.trim(), ctl.signal)
      setPackaged({ state: 'done', items })
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setPackaged({
        state: 'error',
        items: [],
        error: navigator.onLine ? 'Packaged search is not answering right now. Try again in a minute.' : 'You are offline. Packaged search needs internet.',
      })
    }
  }

  const mealLabel = MEALS.find((m) => m.key === meal)!.label

  return (
    <Sheet open={open} onClose={onClose} label="Add food" full>
      <div className="sheet-title">
        <h2>Add to {mealLabel.toLowerCase()}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>
      </div>
      <div className="sheet-body">
        <ChipRow label="Meal" style={{ paddingTop: 0 }}>
          {MEALS.map((m) => (
            <button key={m.key} className="chip" aria-pressed={meal === m.key} onClick={() => setMeal(m.key)}>
              <span aria-hidden="true">{m.emoji}</span> {m.label}
            </button>
          ))}
        </ChipRow>

        <label className="search" style={{ marginTop: 10 }}>
          <Search size={20} aria-hidden="true" className="faint" />
          <span className="sr-only">Search foods</span>
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Dosa, sushi, pasta, poha…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </label>

        <div className="chips" role="group" aria-label="Filter">
          {profileDiet !== 'nonveg' && (
            <button className="chip" aria-pressed={dietOnly} onClick={() => setDietOnly(!dietOnly)}>
              <DietMark diet={profileDiet} />
              {profileDiet === 'vegan' ? 'Vegan only' : profileDiet === 'veg' ? 'Veg only' : 'Veg + egg'}
            </button>
          )}
          <button className="chip" aria-pressed={!cuisine} onClick={() => setCuisine('')}>
            All cuisines
          </button>
          {CUISINES.map((c) => (
            <button key={c.key} className="chip" aria-pressed={cuisine === c.key} onClick={() => setCuisine(cuisine === c.key ? '' : c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        {browsing ? (
          <>
            {recent.length > 0 && <FoodList title="Recent" foods={recent} day={day} meal={meal} onPick={onPick} />}
            <FoodList title={recent.length ? 'Popular' : 'Popular to start with'} foods={popular} day={day} meal={meal} onPick={onPick} />
          </>
        ) : (
          <>
            {results.length > 0 ? (
              <FoodList title={`${results.length === 60 ? '60+' : results.length} ${results.length === 1 ? 'match' : 'matches'}`} foods={results} day={day} meal={meal} onPick={onPick} />
            ) : (
              <p className="list-label">No matches in the built-in list{dietOnly ? ' for your diet' : ''}.</p>
            )}
          </>
        )}

        {packaged.state === 'done' && packaged.items.length > 0 && (
          <FoodList title="Packaged foods" foods={packaged.items} day={day} meal={meal} onPick={onPick} />
        )}

        <div className="notfound">
          <h3>Can't find it?</h3>
          <p className="muted">
            {packaged.state === 'error'
              ? packaged.error
              : packaged.state === 'done' && packaged.items.length === 0
                ? `No packaged foods matched "${query.trim()}". Create it yourself from the label.`
                : 'Look it up among packaged foods from around the world, or add your own from the label.'}
          </p>
          <div className="row">
            {query.trim().length > 1 && packaged.state !== 'done' && (
              <button className="btn btn-soft" onClick={findPackaged} disabled={packaged.state === 'loading'}>
                {packaged.state === 'loading' ? <Loader2 size={18} className="spin" /> : <PackageSearch size={18} />}
                Search packaged foods
              </button>
            )}
            <button className="btn btn-soft" onClick={() => onCreate(query.trim())}>
              <PencilLine size={18} /> Create a food
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  )
}

function FoodList({ title, foods, day, meal, onPick }: { title: string; foods: Food[]; day: string; meal: MealKey; onPick: (f: Food) => void }) {
  const uses = useStore((s) => s.uses)
  const addEntry = useStore((s) => s.addEntry)
  const removeEntry = useStore((s) => s.removeEntry)
  const show = useToast((s) => s.show)

  function quickAdd(food: Food) {
    const last = uses[food.id]
    const unitKey = last && food.units.some((u) => u.key === last.unitKey) ? last.unitKey : food.units[0].key
    const qty = last ? last.qty : 1
    const entry = addEntry(day, food, qty, unitKey, meal)
    buzz()
    show({
      message: `Added ${food.name} to ${meal}`,
      action: { label: 'Undo', run: () => removeEntry(day, entry.id) },
    })
  }

  return (
    <>
      <h3 className="list-label">{title}</h3>
      <ul className="results">
        {foods.map((food) => {
          const last = uses[food.id]
          const unitKey = last && food.units.some((u) => u.key === last.unitKey) ? last.unitKey : food.units[0].key
          const qty = last ? last.qty : 1
          return (
            <li key={food.id} className="result">
              <button className="item" onClick={() => onPick(food)}>
                <span className="item-emoji" aria-hidden="true">{food.emoji}</span>
                <span className="item-main">
                  <span className="item-name">
                    <span>{food.name}</span>
                    <DietMark diet={food.diet} />
                  </span>
                  <span className="item-sub" style={{ display: 'block' }}>
                    {food.brand ? `${food.brand}, ` : ''}
                    {defaultPortion(food, qty, unitKey)}
                  </span>
                </span>
                <span className="item-kcal">
                  {portionKcal(food, qty, unitKey)}
                  <small>kcal</small>
                </span>
              </button>
              <button className="quick" onClick={() => quickAdd(food)} aria-label={`Quick add ${food.name}`}>
                <Plus size={22} strokeWidth={2.6} />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
