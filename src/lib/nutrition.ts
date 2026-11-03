import type { Entry, Food, Nutrients, Profile, Targets, Unit } from '../types'

export const ZERO: Nutrients = { kcal: 0, p: 0, c: 0, f: 0, fib: 0 }

export const MACROS = [
  { key: 'p', label: 'Protein', color: 'var(--protein)' },
  { key: 'c', label: 'Carbs', color: 'var(--carbs)' },
  { key: 'f', label: 'Fat', color: 'var(--fat)' },
  { key: 'fib', label: 'Fibre', color: 'var(--fibre)' },
] as const

export function unitOf(food: Food, key: string): Unit {
  return food.units.find((u) => u.key === key) ?? food.units[0]
}

export function gramsOf(food: Food, qty: number, unitKey: string) {
  return qty * unitOf(food, unitKey).g
}

export function nutrientsFor(food: Food, grams: number): Nutrients {
  const k = grams / 100
  const n = food.per100
  return { kcal: n.kcal * k, p: n.p * k, c: n.c * k, f: n.f * k, fib: n.fib * k }
}

export function entryNutrients(e: Entry) {
  return nutrientsFor(e.food, gramsOf(e.food, e.qty, e.unitKey))
}

export function sum(list: Nutrients[]): Nutrients {
  return list.reduce(
    (a, n) => ({ kcal: a.kcal + n.kcal, p: a.p + n.p, c: a.c + n.c, f: a.f + n.f, fib: a.fib + n.fib }),
    { ...ZERO },
  )
}

export function totals(entries: Entry[] = []) {
  return sum(entries.map(entryNutrients))
}

// Mifflin–St Jeor resting energy × activity, nudged for the goal.
export function computeTargets(p: Profile): Targets {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161)
  const adjust = p.goal === 'lose' ? -500 : p.goal === 'gain' ? 300 : 0
  const floor = p.sex === 'male' ? 1500 : 1200
  const kcal = Math.max(floor, Math.round((bmr * p.activity + adjust) / 10) * 10)
  const protein = Math.round(p.weightKg * (p.goal === 'maintain' ? 1.2 : 1.6))
  const fat = Math.round((kcal * 0.28) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, p: protein, c: carbs, f: fat, fib: Math.round((kcal / 1000) * 14), water: 8 }
}

// "½", "1½", "2", "0.3" — friendlier than decimals for everyday portions.
export function fmtQty(q: number) {
  const whole = Math.floor(q)
  const frac = Math.round((q - whole) * 100) / 100
  const glyph = frac === 0.5 ? '½' : frac === 0.25 ? '¼' : frac === 0.75 ? '¾' : ''
  if (glyph) return whole ? `${whole}${glyph}` : glyph
  return String(Math.round(q * 100) / 100)
}

const NO_PLURAL = new Set(['g', 'ml', 'tbsp', 'tsp', 'oz'])

export function portionLabel(food: Food, qty: number, unitKey: string) {
  const u = unitOf(food, unitKey)
  if (u.key === 'g' || u.key === 'ml') return `${Math.round(qty)} ${u.label}`
  const many = qty > 1
  let label = u.label
  if (many && !NO_PLURAL.has(label) && !label.includes(' ')) {
    label = /(s|sh|ch|x)$/.test(label) ? `${label}es` : label.endsWith('y') && !/[aeiou]y$/.test(label) ? `${label.slice(0, -1)}ies` : `${label}s`
  }
  return `${fmtQty(qty)} ${label}`
}

export const kcal = (n: number) => Math.round(n).toLocaleString('en-IN')
export const grams = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n))
