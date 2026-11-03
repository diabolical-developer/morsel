import type { Food, Unit } from '../types'
import { slug } from '../data/foods'

// Open Food Facts — a free, open database of packaged foods from around the world.
const ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl'

interface OffProduct {
  code: string
  product_name?: string
  brands?: string
  serving_quantity?: number | string
  serving_size?: string
  nutriments?: Record<string, number | string | undefined>
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function searchPackaged(query: string, signal?: AbortSignal): Promise<Food[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '24',
    fields: 'code,product_name,brands,serving_quantity,serving_size,nutriments',
  })
  const res = await fetch(`${ENDPOINT}?${params}`, { signal })
  if (!res.ok) throw new Error(`Open Food Facts answered ${res.status}`)
  const data = (await res.json()) as { products?: OffProduct[] }
  return (data.products ?? [])
    .filter((p) => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] !== undefined)
    .map((p) => {
      const n = p.nutriments!
      const serving = num(p.serving_quantity)
      const units: Unit[] = []
      if (serving > 0) units.push({ key: 'serving', label: 'serving', g: serving })
      units.push({ key: 'g', label: 'g', g: 1 })
      const brand = p.brands?.split(',')[0]?.trim()
      return {
        id: `off-${p.code}`,
        name: p.product_name!.trim(),
        aliases: [],
        brand,
        cuisine: 'packaged',
        emoji: '📦',
        per100: {
          kcal: num(n['energy-kcal_100g']),
          p: num(n.proteins_100g),
          c: num(n.carbohydrates_100g),
          f: num(n.fat_100g),
          fib: num(n.fiber_100g),
        },
        units,
        source: 'packaged' as const,
      }
    })
    .filter((f) => slug(f.name).length > 0)
}
