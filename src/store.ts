import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Entry, Food, MealKey, Profile, Targets } from './types'
import { computeTargets } from './lib/nutrition'
import { uid } from './lib/device'

export type Theme = 'system' | 'light' | 'dark'

interface Use {
  n: number
  last: number
  qty: number
  unitKey: string
}

interface State {
  profile: Profile
  targets: Targets
  customTargets: boolean
  custom: Food[]
  log: Record<string, Entry[]>
  water: Record<string, number>
  uses: Record<string, Use>
  theme: Theme

  addEntry: (day: string, food: Food, qty: number, unitKey: string, meal: MealKey) => Entry
  updateEntry: (day: string, id: string, patch: Partial<Pick<Entry, 'qty' | 'unitKey' | 'meal'>>) => void
  removeEntry: (day: string, id: string) => Entry | undefined
  restoreEntry: (day: string, entry: Entry) => void
  setWater: (day: string, glasses: number) => void
  setProfile: (patch: Partial<Profile>) => void
  setTargets: (t: Partial<Targets>) => void
  resetTargets: () => void
  saveFood: (food: Food) => void
  deleteFood: (id: string) => void
  setTheme: (t: Theme) => void
  importData: (json: string) => void
  resetAll: () => void
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  sex: 'female',
  age: 28,
  heightCm: 165,
  weightKg: 62,
  activity: 1.375,
  goal: 'maintain',
  diet: 'nonveg',
  imperial: false,
  onboarded: false,
}

const initial = () => ({
  profile: DEFAULT_PROFILE,
  targets: computeTargets(DEFAULT_PROFILE),
  customTargets: false,
  custom: [] as Food[],
  log: {} as Record<string, Entry[]>,
  water: {} as Record<string, number>,
  uses: {} as Record<string, Use>,
  theme: 'system' as Theme,
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),

      addEntry: (day, food, qty, unitKey, meal) => {
        const entry: Entry = { id: uid(), meal, qty, unitKey, at: Date.now(), food }
        set((s) => {
          const prev = s.uses[food.id]
          const custom =
            food.source === 'packaged' && !s.custom.some((f) => f.id === food.id) ? [food, ...s.custom] : s.custom
          return {
            log: { ...s.log, [day]: [...(s.log[day] ?? []), entry] },
            uses: { ...s.uses, [food.id]: { n: (prev?.n ?? 0) + 1, last: Date.now(), qty, unitKey } },
            custom,
          }
        })
        return entry
      },

      updateEntry: (day, id, patch) =>
        set((s) => ({
          log: { ...s.log, [day]: (s.log[day] ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)) },
        })),

      removeEntry: (day, id) => {
        const removed = get().log[day]?.find((e) => e.id === id)
        set((s) => ({ log: { ...s.log, [day]: (s.log[day] ?? []).filter((e) => e.id !== id) } }))
        return removed
      },

      restoreEntry: (day, entry) =>
        set((s) => ({
          log: { ...s.log, [day]: [...(s.log[day] ?? []), entry].sort((a, b) => a.at - b.at) },
        })),

      setWater: (day, glasses) => set((s) => ({ water: { ...s.water, [day]: Math.max(0, glasses) } })),

      setProfile: (patch) =>
        set((s) => {
          const profile = { ...s.profile, ...patch }
          return { profile, targets: s.customTargets ? s.targets : computeTargets(profile) }
        }),

      setTargets: (t) => set((s) => ({ targets: { ...s.targets, ...t }, customTargets: true })),

      resetTargets: () => set((s) => ({ targets: computeTargets(s.profile), customTargets: false })),

      saveFood: (food) =>
        set((s) => ({ custom: [food, ...s.custom.filter((f) => f.id !== food.id)] })),

      deleteFood: (id) => set((s) => ({ custom: s.custom.filter((f) => f.id !== id) })),

      setTheme: (theme) => set({ theme }),

      importData: (json) => {
        const data = JSON.parse(json)
        if (!data || typeof data !== 'object' || !data.profile || !data.log) {
          throw new Error('This file is not a Morsel backup.')
        }
        set({ ...initial(), ...data })
      },

      resetAll: () => set(initial()),
    }),
    {
      name: 'morsel',
      version: 1,
      partialize: ({ profile, targets, customTargets, custom, log, water, uses, theme }) => ({
        profile, targets, customTargets, custom, log, water, uses, theme,
      }),
    },
  ),
)

// Short-lived UI messages ("Added to lunch · Undo").
interface Toast {
  id: number
  message: string
  action?: { label: string; run: () => void }
}

export const useToast = create<{ toast: Toast | null; show: (t: Omit<Toast, 'id'>) => void; clear: () => void }>(
  (set) => ({
    toast: null,
    show: (t) => set({ toast: { ...t, id: Date.now() } }),
    clear: () => set({ toast: null }),
  }),
)
