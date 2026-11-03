import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Diet, Food } from '../types'
import { useToast } from '../store'
import { kcal, nutrientsFor, portionLabel, unitOf } from '../lib/nutrition'

const DIET_LABEL: Record<Diet, string> = {
  vegan: 'Vegan',
  veg: 'Vegetarian',
  egg: 'Contains egg',
  nonveg: 'Non-vegetarian',
}

export function DietMark({ diet }: { diet?: Diet }) {
  if (!diet) return null
  return <i className={`diet ${diet}`} role="img" aria-label={DIET_LABEL[diet]} title={DIET_LABEL[diet]} />
}

export const dietLabel = (d: Diet) => DIET_LABEL[d]

/** "1 katori (150 g)" — the default portion, with grams for people who think in grams. */
export function defaultPortion(food: Food, qty = 1, unitKey = food.units[0].key) {
  const u = unitOf(food, unitKey)
  const label = portionLabel(food, qty, u.key)
  return u.g === 1 ? label : `${label} (${Math.round(qty * u.g)} ${food.liquid ? 'ml' : 'g'})`
}

export function portionKcal(food: Food, qty = 1, unitKey = food.units[0].key) {
  return kcal(nutrientsFor(food, qty * unitOf(food, unitKey).g).kcal)
}

export function Toast() {
  const { toast, clear } = useToast()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clear, 5000)
    return () => clearTimeout(t)
  }, [toast, clear])
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          className="toast"
          role="status"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 380 }}
        >
          <p>{toast.message}</p>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.run()
                clear()
              }}
            >
              {toast.action.label}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A horizontally scrolling row of chips that keeps the selected chip in view. */
export function ChipRow({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const last = useRef<Element | null>(null)
  useEffect(() => {
    const row = ref.current
    const on = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row || !on || on === last.current) return
    last.current = on
    row.scrollTo({ left: on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' })
  })
  return (
    <div ref={ref} className="chips" role="group" aria-label={label} style={style}>
      {children}
    </div>
  )
}
