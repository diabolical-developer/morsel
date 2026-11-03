export type Diet = 'vegan' | 'veg' | 'egg' | 'nonveg'

export type MealKey = 'breakfast' | 'lunch' | 'snacks' | 'dinner'

export interface Nutrients {
  kcal: number
  p: number // protein, g
  c: number // carbs, g
  f: number // fat, g
  fib: number // fibre, g
}

export interface Unit {
  key: string
  label: string
  g: number // grams (or ml) in one unit
}

export interface Food {
  id: string
  name: string
  aliases: string[]
  cuisine: string
  diet?: Diet
  emoji: string
  per100: Nutrients
  units: Unit[] // first = default portion
  liquid?: boolean
  brand?: string
  source: 'builtin' | 'custom' | 'packaged'
}

export interface Entry {
  id: string
  meal: MealKey
  qty: number
  unitKey: string
  at: number
  food: Food // snapshot, so history survives edits to custom foods
}

export type Goal = 'lose' | 'maintain' | 'gain'

export interface Profile {
  name: string
  sex: 'female' | 'male'
  age: number
  heightCm: number
  weightKg: number
  activity: number // multiplier, 1.2 – 1.9
  goal: Goal
  diet: Diet
  imperial: boolean
  onboarded: boolean
}

export interface Targets extends Nutrients {
  water: number // glasses of 250 ml
}
