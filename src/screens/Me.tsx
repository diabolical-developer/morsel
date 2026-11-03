import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Share, Smartphone, RotateCcw } from 'lucide-react'
import { useStore, useToast, type Theme } from '../store'
import { DietMark } from '../components/bits'
import { MACROS, computeTargets, kcal } from '../lib/nutrition'
import { isIOS, isNativeApp, isStandalone } from '../lib/device'
import type { Diet, Goal } from '../types'

export const APK_URL = 'https://github.com/diabolical-developer/morsel/releases/latest/download/morsel.apk'

type InstallEvent = Event & { prompt: () => Promise<void> }
let deferredInstall: InstallEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstall = e as InstallEvent
    listeners.forEach((l) => l())
  })
}

export const ACTIVITY = [
  { v: 1.2, label: 'Mostly sitting', hint: 'Desk job, little walking' },
  { v: 1.375, label: 'Lightly active', hint: 'Walks, light exercise 1–3 days' },
  { v: 1.55, label: 'Active', hint: 'Exercise 3–5 days a week' },
  { v: 1.725, label: 'Very active', hint: 'Hard training most days' },
]

export const DIET_OPTIONS: { v: Diet; label: string }[] = [
  { v: 'vegan', label: 'Vegan' },
  { v: 'veg', label: 'Veg' },
  { v: 'egg', label: 'Veg + egg' },
  { v: 'nonveg', label: 'Everything' },
]

export const GOALS: { v: Goal; label: string }[] = [
  { v: 'lose', label: 'Lose weight' },
  { v: 'maintain', label: 'Stay steady' },
  { v: 'gain', label: 'Gain weight' },
]

export const cmToFtIn = (cm: number) => {
  const inches = Math.round(cm / 2.54)
  return { ft: Math.floor(inches / 12), inch: inches % 12 }
}
export const ftInToCm = (ft: number, inch: number) => Math.round((ft * 12 + inch) * 2.54)
export const kgToLb = (kg: number) => Math.round(kg * 2.20462)
export const lbToKg = (lb: number) => Math.round((lb / 2.20462) * 10) / 10

export function BodyFields() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const { ft, inch } = cmToFtIn(profile.heightCm)
  const n = (v: string) => Math.max(0, parseFloat(v) || 0)
  return (
    <div className="form">
      <div className="seg" role="group" aria-label="Units">
        <button aria-pressed={!profile.imperial} onClick={() => setProfile({ imperial: false })}>
          cm, kg
        </button>
        <button aria-pressed={profile.imperial} onClick={() => setProfile({ imperial: true })}>
          ft, lb
        </button>
      </div>
      <div className="seg" role="group" aria-label="Sex">
        <button aria-pressed={profile.sex === 'female'} onClick={() => setProfile({ sex: 'female' })}>
          Female
        </button>
        <button aria-pressed={profile.sex === 'male'} onClick={() => setProfile({ sex: 'male' })}>
          Male
        </button>
      </div>
      <div className="grid-3">
        <label className="field">
          <span>Age</span>
          <input className="input" inputMode="numeric" value={profile.age || ''} onChange={(e) => setProfile({ age: n(e.target.value) })} />
        </label>
        {profile.imperial ? (
          <label className="field">
            <span>Height</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <input className="input" inputMode="numeric" aria-label="Feet" value={ft} onChange={(e) => setProfile({ heightCm: ftInToCm(n(e.target.value), inch) })} style={{ padding: '0 8px' }} />
              <input className="input" inputMode="numeric" aria-label="Inches" value={inch} onChange={(e) => setProfile({ heightCm: ftInToCm(ft, n(e.target.value)) })} style={{ padding: '0 8px' }} />
            </div>
          </label>
        ) : (
          <label className="field">
            <span>Height, cm</span>
            <input className="input" inputMode="numeric" value={profile.heightCm || ''} onChange={(e) => setProfile({ heightCm: n(e.target.value) })} />
          </label>
        )}
        <label className="field">
          <span>Weight, {profile.imperial ? 'lb' : 'kg'}</span>
          <input
            className="input"
            inputMode="decimal"
            value={profile.imperial ? kgToLb(profile.weightKg) || '' : profile.weightKg || ''}
            onChange={(e) => setProfile({ weightKg: profile.imperial ? lbToKg(n(e.target.value)) : n(e.target.value) })}
          />
        </label>
      </div>
      <label className="field">
        <span>How active are you?</span>
        <select className="input" value={profile.activity} onChange={(e) => setProfile({ activity: Number(e.target.value) })}>
          {ACTIVITY.map((a) => (
            <option key={a.v} value={a.v}>
              {a.label}: {a.hint}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export function Me() {
  const s = useStore()
  const show = useToast((t) => t.show)
  const fileRef = useRef<HTMLInputElement>(null)
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.add(l)
    return () => void listeners.delete(l)
  }, [])

  const suggested = computeTargets(s.profile)

  async function exportData() {
    const { profile, targets, customTargets, custom, log, water, uses, theme } = useStore.getState()
    const json = JSON.stringify({ app: 'morsel', version: 1, profile, targets, customTargets, custom, log, water, uses, theme })
    const name = `morsel-backup-${new Date().toISOString().slice(0, 10)}.json`
    const file = new File([json], name, { type: 'application/json' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Morsel backup' })
        return
      } catch {
        /* cancelled — fall through */
      }
    }
    if (isNativeApp()) {
      await navigator.clipboard.writeText(json)
      show({ message: 'Backup copied. Paste it into a note or chat to keep it safe.' })
      return
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    show({ message: 'Backup saved to your downloads.' })
  }

  async function importData(f: File) {
    try {
      s.importData(await f.text())
      show({ message: 'Backup restored.' })
    } catch (e) {
      show({ message: (e as Error).message || 'That file could not be read.' })
    }
  }

  const native = isNativeApp()
  const standalone = isStandalone()
  const ios = isIOS()

  return (
    <main>
      <header className="page-head">
        <h1>{s.profile.name ? s.profile.name : 'You'}</h1>
        <p className="muted">Goals, body, diet and your data. Everything stays on this phone.</p>
      </header>

      <div className="section settings">
        <section className="card">
          <h2>Daily goals</h2>
          <div className="target-grid">
            <label className="target">
              <span>Calories</span>
              <input inputMode="numeric" value={s.targets.kcal || ''} onChange={(e) => s.setTargets({ kcal: parseInt(e.target.value) || 0 })} />
            </label>
            {MACROS.map((m) => (
              <label className="target" key={m.key}>
                <span>
                  <i style={{ background: m.color }} />
                  {m.label}, g
                </span>
                <input inputMode="numeric" value={s.targets[m.key] || ''} onChange={(e) => s.setTargets({ [m.key]: parseInt(e.target.value) || 0 })} />
              </label>
            ))}
            <label className="target">
              <span>
                <i style={{ background: 'var(--water)' }} />
                Water, glasses
              </span>
              <input inputMode="numeric" value={s.targets.water || ''} onChange={(e) => s.setTargets({ water: Math.min(16, parseInt(e.target.value) || 0) })} />
            </label>
          </div>
          {s.customTargets ? (
            <button className="btn btn-soft" style={{ marginTop: 12 }} onClick={s.resetTargets}>
              <RotateCcw size={16} /> Use suggested goals ({kcal(suggested.kcal)} kcal)
            </button>
          ) : (
            <p className="small faint" style={{ marginTop: 10 }}>
              Suggested from your body, activity and goal. Type a number to set your own.
            </p>
          )}
        </section>

        <section className="card">
          <h2>Goal</h2>
          <div className="seg">
            {GOALS.map((g) => (
              <button key={g.v} aria-pressed={s.profile.goal === g.v} onClick={() => s.setProfile({ goal: g.v })}>
                {g.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>About you</h2>
          <label className="field" style={{ marginBottom: 12 }}>
            <span>Name</span>
            <input className="input" value={s.profile.name} onChange={(e) => s.setProfile({ name: e.target.value })} placeholder="What should we call you?" />
          </label>
          <BodyFields />
        </section>

        <section className="card">
          <h2>What you eat</h2>
          <div className="seg">
            {DIET_OPTIONS.map((d) => (
              <button key={d.v} aria-pressed={s.profile.diet === d.v} onClick={() => s.setProfile({ diet: d.v })}>
                {d.label}
              </button>
            ))}
          </div>
          <p className="small faint" style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            Search shows matching foods first. Marks: <DietMark diet="veg" /> veg <DietMark diet="egg" /> egg <DietMark diet="nonveg" /> meat or fish
          </p>
        </section>

        <section className="card">
          <h2>Appearance</h2>
          <div className="seg">
            {(['system', 'light', 'dark'] as Theme[]).map((t) => (
              <button key={t} aria-pressed={s.theme === t} onClick={() => s.setTheme(t)}>
                {t === 'system' ? 'Match phone' : t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </section>

        {!native && (
          <section className="card">
            <h2>Get the app</h2>
            {standalone ? (
              <p className="muted">Morsel is installed on this device.</p>
            ) : ios ? (
              <p className="muted">
                In Safari, tap <Share size={16} style={{ verticalAlign: -2 }} aria-label="Share" /> Share, then <b>Add to Home Screen</b>. Morsel opens full screen and works offline.
              </p>
            ) : (
              <div className="row">
                {deferredInstall && (
                  <button
                    className="btn btn-soft"
                    onClick={async () => {
                      await deferredInstall?.prompt()
                      deferredInstall = null
                      force((x) => x + 1)
                    }}
                  >
                    <Smartphone size={18} /> Install Morsel
                  </button>
                )}
                <a className="btn btn-soft" href={APK_URL} style={{ textDecoration: 'none' }}>
                  <Download size={18} /> Android app (APK)
                </a>
              </div>
            )}
          </section>
        )}

        <section className="card">
          <h2>Your data</h2>
          <p className="small muted" style={{ marginBottom: 12 }}>
            No account and no cloud. Save a backup now and then, especially before switching phones.
          </p>
          <div className="row">
            <button className="btn btn-soft" onClick={exportData}>
              <Download size={18} /> Save backup
            </button>
            <button className="btn btn-soft" onClick={() => fileRef.current?.click()}>
              <Upload size={18} /> Restore backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importData(f)
                e.target.value = ''
              }}
            />
          </div>
          <button
            className="btn btn-danger"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (confirm('Delete every meal, goal and custom food on this phone? This cannot be undone.')) s.resetAll()
            }}
          >
            Delete all data
          </button>
        </section>

        <p className="small faint" style={{ padding: '0 4px 8px' }}>
          Nutrition values are estimates for home-style recipes (IFCT 2017, USDA). Packaged foods come from{' '}
          <a className="link" href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
            Open Food Facts
          </a>
          . Morsel is not medical advice.
        </p>
      </div>
    </main>
  )
}
