import { useEffect, useRef } from 'react'
import { animate, motion, useReducedMotion } from 'motion/react'
import { kcal as fmtKcal } from '../lib/nutrition'

const spring = { type: 'spring', stiffness: 90, damping: 18, mass: 0.9 } as const

/** A number that rolls to its new value instead of jumping. */
export function Num({ value, format = fmtKcal }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)
  const reduce = useReducedMotion()
  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (reduce || from === value) {
      if (ref.current) ref.current.textContent = format(value)
      return
    }
    const ctl = animate(from, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v)
      },
    })
    return () => ctl.stop()
  }, [value, format, reduce])
  return <span ref={ref}>{format(value)}</span>
}

const R = 103
const CIRC = 2 * Math.PI * R

/** The day as a plate: the rim fills with calories eaten. */
export function Plate({ eaten, goal }: { eaten: number; goal: number }) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0
  const over = eaten > goal
  const left = Math.abs(goal - eaten)
  return (
    <div className="plate" role="img" aria-label={`${Math.round(eaten)} of ${goal} calories eaten`}>
      <svg viewBox="0 0 240 240">
        <defs>
          <radialGradient id="ceramic" cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eceafc" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="119" fill="url(#ceramic)" />
        <circle cx="120" cy="120" r={R} fill="none" stroke="#ecebfb" strokeWidth="15" />
        <motion.circle
          cx="120"
          cy="120"
          r={R}
          fill="none"
          stroke={over ? '#ff6b2c' : '#3b2bff'}
          strokeWidth="15"
          strokeLinecap="round"
          transform="rotate(-90 120 120)"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC * (1 - pct), opacity: pct > 0 ? 1 : 0 }}
          transition={spring}
        />
        <circle cx="120" cy="120" r="84" fill="#f8f7ff" stroke="#ecebfb" strokeWidth="1.5" />
      </svg>
      <div className={`plate-center${over ? ' over' : ''}`}>
        <div className="plate-num">
          <Num value={left} />
        </div>
        <div className="plate-unit">{over ? 'kcal over' : 'kcal left'}</div>
        <div className="plate-sub">
          <Num value={eaten} /> of {fmtKcal(goal)} eaten
        </div>
      </div>
    </div>
  )
}

/** A small bowl that fills like liquid. */
export function Bowl({ id, pct, color }: { id: string; pct: number; color: string }) {
  const p = Math.max(0, Math.min(pct, 1))
  const level = 57 - 50 * p
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <clipPath id={`bowl-${id}`}>
          <circle cx="32" cy="32" r="25" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#ffffff" />
      <circle cx="32" cy="32" r="25" style={{ fill: color }} opacity="0.14" />
      <g clipPath={`url(#bowl-${id})`}>
        <motion.g initial={{ y: 60 }} animate={{ y: level }} transition={spring}>
          <motion.path
            key={Math.round(p * 50)}
            d="M-40 0 Q-32 -5 -24 0 T-8 0 T8 0 T24 0 T40 0 T56 0 T72 0 T88 0 T104 0 V70 H-40 Z"
            style={{ fill: color }}
            initial={{ x: -16 }}
            animate={{ x: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        </motion.g>
      </g>
      <circle cx="32" cy="32" r="25" fill="none" stroke="rgba(23,19,61,0.07)" strokeWidth="2" />
    </svg>
  )
}
