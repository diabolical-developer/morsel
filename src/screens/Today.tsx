import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Bowl, Plate } from '../components/Plate'
import { DietMark } from '../components/bits'
import { useStore } from '../store'
import { MACROS, entryNutrients, grams, kcal, portionLabel, totals } from '../lib/nutrition'
import { MEALS, addDays, dayKey, greeting, prettyDay } from '../lib/date'
import { buzz } from '../lib/device'
import type { Entry, MealKey } from '../types'

interface Props {
  day: string
  setDay: (d: string) => void
  onAdd: (meal: MealKey) => void
  onEdit: (entry: Entry) => void
}

const CORNERS = ['tl', 'tr', 'bl', 'br']

export function Today({ day, setDay, onAdd, onEdit }: Props) {
  const entries = useStore((s) => s.log[day]) ?? []
  const targets = useStore((s) => s.targets)
  const name = useStore((s) => s.profile.name)
  const water = useStore((s) => s.water[day] ?? 0)
  const setWater = useStore((s) => s.setWater)
  const t = totals(entries)
  const today = dayKey()
  const isToday = day === today

  return (
    <main>
      <header className="hero">
        <div className="topbar">
          <div className="daynav">
            <button onClick={() => setDay(addDays(day, -1))} aria-label="Previous day">
              <ChevronLeft size={24} />
            </button>
            <h1>{prettyDay(day)}</h1>
            <button onClick={() => setDay(addDays(day, 1))} aria-label="Next day" disabled={day >= today}>
              <ChevronRight size={24} />
            </button>
          </div>
          {isToday ? (
            <span className="greet">
              {greeting()}
              {name ? `, ${name}` : ''}
            </span>
          ) : (
            <button className="today-pill" onClick={() => setDay(today)}>
              Back to today
            </button>
          )}
        </div>

        <div className="stage">
          <Plate eaten={t.kcal} goal={targets.kcal} />
          {MACROS.map((m, i) => (
            <div key={m.key} className={`bowl ${CORNERS[i]}`}>
              <Bowl id={m.key} pct={t[m.key] / (targets[m.key] || 1)} color={m.color} />
              <div className="bowl-label">
                {m.label}
                <b>
                  {grams(t[m.key])} / {targets[m.key]} g
                </b>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="section" aria-label="Water">
        <div className="water">
          <div className="water-text">
            <span className="small faint">Water</span>
            <b>
              {water} of {targets.water}
            </b>
          </div>
          <div className="glasses">
            {Array.from({ length: Math.max(targets.water, water) }, (_, i) => {
              const full = i < water
              return (
                <button
                  key={i}
                  className="glass"
                  aria-label={full && i === water - 1 ? `Remove glass ${i + 1}` : `Drink glass ${i + 1}`}
                  onClick={() => {
                    setWater(day, full && i === water - 1 ? i : i + 1)
                    buzz(8)
                  }}
                >
                  <Glass full={full} />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Meals">
        <div className="section-head">
          <h2>Meals</h2>
          <span className="small faint">{entries.length ? `${entries.length} ${entries.length === 1 ? 'item' : 'items'} logged` : ''}</span>
        </div>
        {MEALS.map((meal) => {
          const items = entries.filter((e) => e.meal === meal.key)
          const mt = totals(items)
          return (
            <article className="meal" key={meal.key}>
              <div className="meal-head">
                <div className="meal-emoji" aria-hidden="true">{meal.emoji}</div>
                <div className="meal-title">
                  <h3>{meal.label}</h3>
                  {items.length > 0 && (
                    <p>
                      {grams(mt.p)} g protein, {grams(mt.c)} g carbs, {grams(mt.f)} g fat
                    </p>
                  )}
                </div>
                {items.length > 0 && (
                  <span className="item-kcal meal-kcal">
                    {kcal(mt.kcal)}
                    <small>kcal</small>
                  </span>
                )}
                <button className="add-btn" onClick={() => onAdd(meal.key)} aria-label={`Add food to ${meal.label}`}>
                  <Plus size={24} strokeWidth={2.6} />
                </button>
              </div>
              {items.length > 0 ? (
                <ul className="items">
                  {items.map((e) => (
                    <li key={e.id}>
                      <button className="item" onClick={() => onEdit(e)}>
                        <span className="item-emoji" aria-hidden="true">{e.food.emoji}</span>
                        <span className="item-main">
                          <span className="item-name">
                            <span>{e.food.name}</span>
                            <DietMark diet={e.food.diet} />
                          </span>
                          <span className="item-sub" style={{ display: 'block' }}>
                            {portionLabel(e.food, e.qty, e.unitKey)}
                          </span>
                        </span>
                        <span className="item-kcal">
                          {kcal(entryNutrients(e).kcal)}
                          <small>kcal</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <button className="empty-meal" onClick={() => onAdd(meal.key)}>
                  Add {meal.label.toLowerCase()}
                </button>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}

function Glass({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 22 32" aria-hidden="true">
      <path d="M2 2h18l-2.2 26.2A2 2 0 0 1 15.8 30H6.2a2 2 0 0 1-2-1.8L2 2Z" fill="none" stroke={full ? 'var(--water)' : 'var(--line)'} strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M3.2 10h15.6l-1.6 18.1a1.4 1.4 0 0 1-1.4 1.3H6.2a1.4 1.4 0 0 1-1.4-1.3L3.2 10Z"
        style={{ fill: 'var(--water)', transition: 'opacity .25s, transform .35s cubic-bezier(.22,1,.36,1)', transformOrigin: '50% 100%' }}
        opacity={full ? 1 : 0}
        transform={full ? 'scale(1)' : 'scale(1 0.2)'}
      />
    </svg>
  )
}
