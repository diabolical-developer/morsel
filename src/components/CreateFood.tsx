import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Sheet } from './Sheet'
import { DietMark } from './bits'
import { slug } from '../data/foods'
import { uid } from '../lib/device'
import { useStore } from '../store'
import type { Diet, Food } from '../types'

const EMOJI = ['🍽️', '🍲', '🍛', '🥗', '🍜', '🍝', '🥪', '🌯', '🍕', '🍔', '🍳', '🥣', '🍰', '🍪', '🥤', '☕', '🍎', '📦']
const DIETS: Diet[] = ['vegan', 'veg', 'egg', 'nonveg']
const DIET_SHORT: Record<Diet, string> = { vegan: 'Vegan', veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg' }

interface Props {
  open: boolean
  initialName: string
  onClose: () => void
  onCreated: (food: Food) => void
}

export function CreateFood({ open, initialName, onClose, onCreated }: Props) {
  const saveFood = useStore((s) => s.saveFood)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI[0])
  const [portion, setPortion] = useState('serving')
  const [portionG, setPortionG] = useState('100')
  const [vals, setVals] = useState({ kcal: '', p: '', c: '', f: '', fib: '' })
  const [diet, setDiet] = useState<Diet>('veg')

  useEffect(() => {
    if (open) {
      setName(initialName)
      setEmoji(EMOJI[0])
      setPortion('serving')
      setPortionG('100')
      setVals({ kcal: '', p: '', c: '', f: '', fib: '' })
    }
  }, [open, initialName])

  const g = parseFloat(portionG)
  const valid = name.trim().length > 1 && g > 0 && parseFloat(vals.kcal) >= 0

  function save() {
    const per = (v: string) => Math.round(((parseFloat(v) || 0) * 100 * 10) / g) / 10
    const label = portion.trim() || 'serving'
    const food: Food = {
      id: `custom-${uid()}`,
      name: name.trim(),
      aliases: [],
      cuisine: 'custom',
      diet,
      emoji,
      per100: { kcal: per(vals.kcal), p: per(vals.p), c: per(vals.c), f: per(vals.f), fib: per(vals.fib) },
      units: [
        { key: slug(label) || 'serving', label, g },
        { key: 'g', label: 'g', g: 1 },
      ],
      source: 'custom',
    }
    saveFood(food)
    onCreated(food)
  }

  const num = (key: keyof typeof vals, label: string) => (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        inputMode="decimal"
        placeholder="0"
        value={vals[key]}
        onChange={(e) => setVals({ ...vals, [key]: e.target.value })}
      />
    </label>
  )

  return (
    <Sheet open={open} onClose={onClose} label="Create a food" full>
      <div className="sheet-title">
        <h2>Create a food</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>
      </div>
      <div className="sheet-body">
        <div className="form">
          <label className="field">
            <span>Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mum's rajma, protein bar…" />
          </label>

          <div className="field">
            <span>Icon</span>
            <div className="chips" style={{ paddingTop: 0 }}>
              {EMOJI.map((e) => (
                <button key={e} className="chip" aria-pressed={emoji === e} onClick={() => setEmoji(e)} aria-label={`Icon ${e}`} style={{ fontSize: '1.2rem' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <label className="field">
              <span>Portion name</span>
              <input className="input" value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="bar, bowl, piece" />
            </label>
            <label className="field">
              <span>Portion weight (g or ml)</span>
              <input className="input" inputMode="decimal" value={portionG} onChange={(e) => setPortionG(e.target.value)} />
            </label>
          </div>

          <p className="small muted">Nutrition in one {portion.trim() || 'serving'}. Copy it from the pack, or leave a field empty if you don't know it.</p>
          <div className="grid-2">
            {num('kcal', 'Calories (kcal)')}
            {num('p', 'Protein (g)')}
            {num('c', 'Carbs (g)')}
            {num('f', 'Fat (g)')}
            {num('fib', 'Fibre (g)')}
          </div>

          <div className="field">
            <span>Diet</span>
            <div className="seg">
              {DIETS.map((d) => (
                <button key={d} aria-pressed={diet === d} onClick={() => setDiet(d)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <DietMark diet={d} /> {DIET_SHORT[d]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={save} disabled={!valid} style={{ marginTop: 8 }}>
            Save food
          </button>
        </div>
      </div>
    </Sheet>
  )
}
