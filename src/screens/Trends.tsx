import { useState } from 'react'
import { useStore } from '../store'
import { MACROS, entryNutrients, grams, kcal, totals } from '../lib/nutrition'
import { addDays, dayKey, fromKey } from '../lib/date'

export function Trends() {
  const log = useStore((s) => s.log)
  const targets = useStore((s) => s.targets)
  const [range, setRange] = useState<7 | 30>(7)
  const today = dayKey()
  const days = Array.from({ length: range }, (_, i) => addDays(today, i - range + 1))
  const series = days.map((d) => ({ d, t: totals(log[d]) }))
  const logged = series.filter((s) => log[s.d]?.length)
  const n = logged.length || 1
  const avg = {
    kcal: logged.reduce((a, s) => a + s.t.kcal, 0) / n,
    p: logged.reduce((a, s) => a + s.t.p, 0) / n,
    c: logged.reduce((a, s) => a + s.t.c, 0) / n,
    f: logged.reduce((a, s) => a + s.t.f, 0) / n,
    fib: logged.reduce((a, s) => a + s.t.fib, 0) / n,
  }

  // Bar chart geometry
  const W = 340
  const H = 170
  const top = Math.max(targets.kcal * 1.25, ...series.map((s) => s.t.kcal), 1)
  const gap = range === 7 ? 10 : 3
  const bw = (W - gap * (range - 1)) / range
  const y = (v: number) => H - (v / top) * H

  // Where calories came from
  const fromP = avg.p * 4
  const fromC = avg.c * 4
  const fromF = avg.f * 9
  const all = fromP + fromC + fromF || 1

  // Most logged foods
  const counts = new Map<string, { name: string; emoji: string; n: number; kcal: number }>()
  for (const d of days)
    for (const e of log[d] ?? []) {
      const c = counts.get(e.food.id) ?? { name: e.food.name, emoji: e.food.emoji, n: 0, kcal: 0 }
      c.n++
      c.kcal += entryNutrients(e).kcal
      counts.set(e.food.id, c)
    }
  const topFoods = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 5)

  return (
    <main>
      <header className="page-head">
        <h1>Trends</h1>
        <p className="muted">How your eating adds up over time.</p>
      </header>

      <section className="section">
        <div className="seg" role="group" aria-label="Range">
          <button aria-pressed={range === 7} onClick={() => setRange(7)}>
            Last 7 days
          </button>
          <button aria-pressed={range === 30} onClick={() => setRange(30)}>
            Last 30 days
          </button>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="section-head" style={{ marginBottom: 2 }}>
            <h2>Calories</h2>
            <span className="small faint">goal {kcal(targets.kcal)}</span>
          </div>
          <p className="muted small" style={{ marginBottom: 14 }}>
            {logged.length
              ? `You averaged ${kcal(avg.kcal)} kcal a day on the ${logged.length} ${logged.length === 1 ? 'day' : 'days'} you logged.`
              : 'Log a few meals and your daily calories will show up here.'}
          </p>
          <svg className="chart" viewBox={`0 -8 ${W} ${H + 30}`} role="img" aria-label="Daily calories compared with goal">
            {series.map((s, i) => {
              const v = s.t.kcal
              const over = v > targets.kcal * 1.1
              const h = Math.max(v ? 4 : 0, H - y(v))
              const x = i * (bw + gap)
              return (
                <g key={s.d}>
                  <rect x={x} y={0} width={bw} height={H} rx={Math.min(8, bw / 2)} fill="var(--surface-2)" />
                  {v > 0 && <rect x={x} y={H - h} width={bw} height={h} rx={Math.min(8, bw / 2)} fill={over ? 'var(--fat)' : 'var(--brand)'} />}
                  {(range === 7 || i % 5 === 4) && (
                    <text x={x + bw / 2} y={H + 20} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-3)">
                      {range === 7 ? fromKey(s.d).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2) : fromKey(s.d).getDate()}
                    </text>
                  )}
                </g>
              )
            })}
            <line x1="0" x2={W} y1={y(targets.kcal)} y2={y(targets.kcal)} stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.5" />
          </svg>
          <div className="legend">
            <span>
              <i style={{ background: 'var(--brand)' }} />
              Within goal
            </span>
            <span>
              <i style={{ background: 'var(--fat)' }} />
              More than 10% over
            </span>
            <span>Dashed line: your goal</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 750 }}>Average day</h2>
          <p className="muted small">Where your calories came from, and how close you got to each goal.</p>
          <div className="split" aria-hidden="true">
            <i style={{ flex: fromP / all, background: 'var(--protein)' }} />
            <i style={{ flex: fromC / all, background: 'var(--carbs)' }} />
            <i style={{ flex: fromF / all, background: 'var(--fat)' }} />
          </div>
          <div className="bars" style={{ marginTop: 16 }}>
            {MACROS.map((m) => (
              <div className="bar-row" key={m.key}>
                <span>{m.label}</span>
                <div className="bar" aria-hidden="true">
                  <i style={{ width: `${Math.min(100, (avg[m.key] / (targets[m.key] || 1)) * 100)}%`, background: m.color }} />
                </div>
                <span>
                  {grams(avg[m.key])}/{targets[m.key]} g
                </span>
              </div>
            ))}
          </div>
          {logged.length > 0 && (
            <p className="small faint" style={{ marginTop: 12 }}>
              {Math.round((fromP / all) * 100)}% of calories from protein, {Math.round((fromC / all) * 100)}% from carbs, {Math.round((fromF / all) * 100)}% from fat.
            </p>
          )}
        </div>
      </section>

      {topFoods.length > 0 && (
        <section className="section">
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 750, marginBottom: 6 }}>Most logged</h2>
            <ul className="top-foods">
              {topFoods.map((f) => (
                <li key={f.name}>
                  <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{f.emoji}</span>
                  <span>
                    {f.name}
                    <span className="small faint" style={{ display: 'block' }}>
                      {kcal(f.kcal)} kcal in total
                    </span>
                  </span>
                  <span className="n">{f.n}×</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}
