import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { kcal, totals } from '../lib/nutrition'
import { addDays, dayKey } from '../lib/date'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function streakOf(log: Record<string, unknown[]>) {
  let day = dayKey()
  if (!log[day]?.length) day = addDays(day, -1) // today not logged yet doesn't break a streak
  let n = 0
  while (log[day]?.length) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function Journal({ onOpenDay }: { onOpenDay: (day: string) => void }) {
  const log = useStore((s) => s.log)
  const goal = useStore((s) => s.targets.kcal)
  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const today = dayKey()

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysIn = new Date(year, month + 1, 0).getDate()
  const lead = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const monthName = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const days = Array.from({ length: daysIn }, (_, i) => dayKey(new Date(year, month, i + 1)))
  const logged = days.filter((d) => log[d]?.length)
  const avg = logged.length ? logged.reduce((a, d) => a + totals(log[d]).kcal, 0) / logged.length : 0
  const onTarget = logged.filter((d) => {
    const k = totals(log[d]).kcal
    return k >= goal * 0.9 && k <= goal * 1.1
  }).length
  const streak = streakOf(log)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <main>
      <header className="page-head">
        <h1>Journal</h1>
        <p className="muted">Every day is a plate. Fuller plates mean more of your goal eaten.</p>
      </header>

      <section className="section">
        <div className="stats">
          <div className="stat">
            <b>{streak}</b>
            <span>day streak</span>
          </div>
          <div className="stat">
            <b>{logged.length}</b>
            <span>days logged</span>
          </div>
          <div className="stat">
            <b>{onTarget}</b>
            <span>days on target</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="month-nav">
            <button className="icon-btn" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
              <ChevronLeft size={22} />
            </button>
            <h2>{monthName}</h2>
            <button className="icon-btn" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month" disabled={isCurrentMonth}>
              <ChevronRight size={22} style={{ opacity: isCurrentMonth ? 0.3 : 1 }} />
            </button>
          </div>
          <div className="cal">
            {DOW.map((d) => (
              <span key={d} className="cal-dow">
                {d.slice(0, 1)}
              </span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <span key={`lead-${i}`} />
            ))}
            {days.map((d, i) => {
              const eaten = totals(log[d]).kcal
              const pct = Math.min(eaten / (goal || 1), 1)
              const over = eaten > goal * 1.1
              return (
                <button
                  key={d}
                  className={`cal-day${d === today ? ' today' : ''}`}
                  disabled={d > today}
                  onClick={() => onOpenDay(d)}
                  aria-label={`${d}: ${eaten ? `${kcal(eaten)} kcal` : 'nothing logged'}`}
                >
                  <MiniPlate pct={pct} over={over} />
                  {i + 1}
                </button>
              )
            })}
          </div>
          <p className="small faint" style={{ marginTop: 12 }}>
            {logged.length ? `Average ${kcal(avg)} kcal on logged days. Tap a day to see or edit it.` : 'Nothing logged this month yet. Tap any past day to fill it in.'}
          </p>
        </div>
      </section>
    </main>
  )
}

export function MiniPlate({ pct, over }: { pct: number; over?: boolean }) {
  const r = 13
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="var(--surface-2)" />
      <circle cx="17" cy="17" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
      {pct > 0 && (
        <circle
          cx="17"
          cy="17"
          r={r}
          fill="none"
          stroke={over ? 'var(--fat)' : 'var(--brand)'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 17 17)"
        />
      )}
    </svg>
  )
}
