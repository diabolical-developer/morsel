import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { useStore } from '../store'
import { BodyFields } from './Me'
import { Bowl } from '../components/Plate'
import { MACROS, kcal } from '../lib/nutrition'
import type { Diet, Goal } from '../types'

const GOAL_CHOICES: { v: Goal; em: string; label: string; hint: string }[] = [
  { v: 'lose', em: '🔥', label: 'Lose weight', hint: 'A gentle deficit, about 0.5 kg a week' },
  { v: 'maintain', em: '⚖️', label: 'Stay steady', hint: 'Eat well and keep an eye on it' },
  { v: 'gain', em: '💪', label: 'Gain weight', hint: 'A small surplus for muscle' },
]

const DIET_CHOICES: { v: Diet; em: string; label: string; hint: string }[] = [
  { v: 'vegan', em: '🌱', label: 'Vegan', hint: 'No meat, fish, egg or dairy' },
  { v: 'veg', em: '🥦', label: 'Vegetarian', hint: 'Dairy yes, egg and meat no' },
  { v: 'egg', em: '🥚', label: 'Vegetarian + egg', hint: 'Eggs are fine' },
  { v: 'nonveg', em: '🍗', label: 'I eat everything', hint: 'Meat and fish included' },
]

const STEPS = 5

export function Onboarding() {
  const profile = useStore((s) => s.profile)
  const targets = useStore((s) => s.targets)
  const setProfile = useStore((s) => s.setProfile)
  const [step, setStep] = useState(0)
  const next = () => setStep((s) => s + 1)
  const finish = () => setProfile({ onboarded: true })

  return (
    <div className="onb">
      <div className="onb-top">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} aria-label="Back" style={{ display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={22} /> Back
          </button>
        ) : (
          <span>Morsel</span>
        )}
        {step > 0 && step < STEPS ? <span style={{ opacity: 0.75 }}>Step {step} of {STEPS - 1}</span> : null}
        {step < STEPS ? <button onClick={finish}>Skip</button> : <span />}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="onb-body"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 0 && (
            <>
              <div className="onb-cuisines" aria-hidden="true">
                {['🍣', '🍛', '🌮', '🍝', '🥟', '🥗', '🍜', '🫓'].map((e, i) => (
                  <motion.span key={e} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 260, damping: 16 }}>
                    {e}
                  </motion.span>
                ))}
              </div>
              <h1>Every cuisine. One plate.</h1>
              <p>Log sushi, sourdough or dal-chawal in three taps, in the portion you actually ate: a bowl, a slice, two rotis or 150 g.</p>
              <div style={{ flex: 0.6 }} />
              <button className="btn btn-light" onClick={next}>
                Set my goal
              </button>
              <p className="small" style={{ textAlign: 'center', margin: '0 auto' }}>
                Takes 30 seconds. No account needed.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h2>What should we call you?</h2>
              <input
                className="input"
                autoFocus
                placeholder="Your first name"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                autoComplete="given-name"
              />
              <button className="btn btn-light" onClick={next}>
                {profile.name.trim() ? 'Continue' : 'Continue without a name'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2>What's your goal{profile.name ? `, ${profile.name}` : ''}?</h2>
              <div className="choices">
                {GOAL_CHOICES.map((g) => (
                  <button
                    key={g.v}
                    className="choice"
                    aria-pressed={profile.goal === g.v}
                    onClick={() => {
                      setProfile({ goal: g.v })
                      setTimeout(next, 180)
                    }}
                  >
                    <span className="em" aria-hidden="true">{g.em}</span>
                    <span>
                      <b>{g.label}</b>
                      <small>{g.hint}</small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>A little about you</h2>
              <p>Used only to suggest a calorie goal. You can change it any time.</p>
              <BodyFields />
              <button className="btn btn-light" onClick={next} disabled={!(profile.age > 0 && profile.heightCm > 0 && profile.weightKg > 0)}>
                Continue
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <h2>What do you eat?</h2>
              <p>We'll show matching foods first. You can still see everything.</p>
              <div className="choices">
                {DIET_CHOICES.map((d) => (
                  <button
                    key={d.v}
                    className="choice"
                    aria-pressed={profile.diet === d.v}
                    onClick={() => {
                      setProfile({ diet: d.v })
                      setTimeout(next, 180)
                    }}
                  >
                    <span className="em" aria-hidden="true">{d.em}</span>
                    <span>
                      <b>{d.label}</b>
                      <small>{d.hint}</small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <p>Your daily goal</p>
              <div className="goal-num">{kcal(targets.kcal)}</div>
              <p style={{ marginTop: -8 }}>calories a day</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                {MACROS.map((m) => (
                  <div key={m.key} style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
                    <div style={{ width: 52 }}>
                      <Bowl id={`onb-${m.key}`} pct={0.6} color={m.color} />
                    </div>
                    <span className="small" style={{ opacity: 0.85 }}>{m.label}</span>
                    <b>{targets[m.key]} g</b>
                  </div>
                ))}
              </div>
              <p className="small">Fill the bowls a little every day. Adjust any goal later under Me.</p>
              <button className="btn btn-light" onClick={finish}>
                Start tracking
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
