import Fuse from 'fuse.js'
import { FOODS } from '../data/foods'
import type { Diet, Food } from '../types'

const ALLOWED: Record<Diet, Diet[]> = {
  vegan: ['vegan'],
  veg: ['vegan', 'veg'],
  egg: ['vegan', 'veg', 'egg'],
  nonveg: ['vegan', 'veg', 'egg', 'nonveg'],
}

export const fitsDiet = (food: Food, diet: Diet) => !food.diet || ALLOWED[diet].includes(food.diet)

let fuse: Fuse<Food> | null = null
let indexed: Food[] = []

export function searchFoods(query: string, custom: Food[], opts: { cuisine?: string; diet?: Diet }) {
  const all = [...custom, ...FOODS]
  if (!fuse || indexed.length !== all.length || indexed[0] !== all[0]) {
    indexed = all
    fuse = new Fuse(all, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'aliases', weight: 2 },
        { name: 'brand', weight: 1 },
      ],
      threshold: 0.35,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    })
  }
  const q = query.trim()
  const ql = q.toLowerCase()
  // Fuse ranks on fuzziness alone; nudge exact names and shorter, simpler names to the top
  // so "paneer" shows Paneer before Paneer butter masala.
  let list = q
    ? fuse
        .search(q, { limit: 80 })
        .map((r) => {
          const name = r.item.name.toLowerCase()
          const exact = name === ql || r.item.aliases.includes(ql)
          const starts = name.startsWith(ql)
          return { item: r.item, rank: (r.score ?? 1) - (exact ? 1 : 0) - (starts ? 0.05 : 0) + name.length * 0.002 }
        })
        .sort((a, b) => a.rank - b.rank)
        .map((r) => r.item)
    : all
  if (opts.cuisine) list = list.filter((f) => f.cuisine === opts.cuisine)
  if (opts.diet) list = list.filter((f) => fitsDiet(f, opts.diet!))
  return list
}
