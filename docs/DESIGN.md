# Morsel — design brief & UX plan

> A food tracker for every cuisine. Sushi, sourdough, dal-chawal or tacos — log it in three taps, in the portion you actually ate.

## Who it's for

People who eat across cuisines and are tired of trackers that only understand "1 cup" and "100 g".
A big, under-served group is Indian home food: nobody weighs their dal — they eat *a katori*, *two rotis*, *one plate* of biryani.
Morsel speaks every one of those units, so anyone can use it without translating their meal into grams first.

## The one big idea: your day is a plate

The Today screen is a top-down **plate**:

- The **rim** is your calorie ring. It fills clockwise as you log.
- **Four little bowls** sit on the plate — protein, carbs, fat, fibre. Each fills with colour like liquid as you eat.
- The **centre** says, in plain words, how much is left: `1,240 kcal left`.

It is instantly readable (a fuller plate = more eaten) and it's the single memorable visual. Everything else stays calm so the plate can be loud.

## Colour — vivid, and every colour means one thing

| Token | Hex | Meaning |
|---|---|---|
| Ultramarine | `#3B2BFF` | Brand, calories, primary actions |
| Raspberry | `#FF3D7F` | Protein |
| Sunflower | `#FFB800` | Carbs |
| Tangerine | `#FF6B2C` | Fat |
| Mint | `#14C38E` | Fibre |
| Sky | `#2BB4FF` | Water |
| Indigo ink | `#17133D` | Text |
| Cloud | `#F3F2FF` | Background (light) |
| Night | `#0F0C29` | Background (dark) |

A nutrient's colour is the same on the plate, in the portion preview, in charts and in the journal. Colour is never the only signal — every value also has a word label.

## Type

One family: **Bricolage Grotesque** (variable — weight, width and optical size). Wide and heavy for the big numbers; normal width for reading. Friendly, slightly quirky, never sterile. Numbers use tabular figures so they don't jitter while animating.

## Layout (mobile first, one thumb)

```
┌──────────────────────────────┐
│ Tue, 4 Nov            (◐ me) │
│ ┌──────────────────────────┐ │  ultramarine block
│ │      ◯ plate ◯           │ │  rim = calories
│ │   ◯  1,240 kcal left  ◯  │ │  bowls = macros (labelled)
│ │  Eaten 760 · Goal 2,000  │ │
│ └──────────────────────────┘ │
│ Water   ▮▮▮▮▯▯▯▯  4 of 8     │  tap a glass to fill
│                              │
│ ☀ Breakfast         420 kcal │  meal header, + to add here
│   Poha · 1 plate        280  │
│   Chai · 1 cup          140  │
│ ☼ Lunch             add food │  empty state = an invitation
│ ...                          │
├──────────────────────────────┤
│ Today  Journal  (+)  Trends  Me │
└──────────────────────────────┘
```

Left aligned everywhere except the plate centre. Bottom nav with a raised centre **+** in the thumb zone.

## Core flows

### Log food — 3 taps
1. **+** → full-screen search, keyboard already open. Before typing, it shows *Recent* and *Frequent* foods.
2. Tap a food → portion sheet: big serving number, `−` / `+` in ½ steps, unit chips (`katori · roti · piece · slice · cup · g`), meal picked automatically from time of day (changeable), live macro bars.
3. **Add to Lunch** → sheet drops, the plate's bowls fill with a spring, the phone gives a short buzz (Android).

### Search that understands how people talk
- Fuzzy matching (typos are fine: `biriyani`, `panner`, `quesadila`).
- Aliases across languages: `chawal → rice`, `anda → egg`, `bhindi → okra`, `aloo → potato`, `gyoza → dumplings`.
- Filter by cuisine and diet (vegan, veg, egg, non-veg).
- Not in the list? **Search packaged foods** (Open Food Facts, global incl. India) or **Create a food** in 20 seconds.

### Edit / delete
Tap any logged item → same portion sheet, with **Remove**. Undo toast for 5 s after removal.

### Onboarding (skippable, 4 short steps)
Name → goal (lose / maintain / gain) → body stats (for a calorie target via Mifflin–St Jeor) → diet preference. Each step is one question, big tap targets, progress shown as a filling plate.

## Screens
- **Today** — plate, water, meals.
- **Journal** — swipeable week strip + month grid where each day is a tiny plate filled to that day's %. Tap a day to view/edit it.
- **Trends** — 7/30-day calories vs goal bars, average macros split, most-logged foods, logging streak.
- **Me** — goals, body stats, diet, units, theme, export / import your data (JSON), install instructions.

## Inclusive by default
- **Units people really use**: katori, bowl, plate, roti, piece, slice, cup, glass, tbsp, tsp, ml, g, oz.
- **Diet marks** next to every food (veg / egg / non-veg / vegan), with a filter to hide what you don't eat.
- **Works offline**, no account, no paywall, no ads. Data stays on the phone.
- **Light on low-end phones**: one font file, no heavy chart libraries, the food database ships with the app.
- Text sizes ≥16 px in inputs (stops iOS zoom), ≥44 px tap targets, honours *Reduce motion*, full dark mode.

## Motion — only to explain change
- Plate rim and bowls animate when values change (spring, ~600 ms).
- Sheets slide up and can be dragged down to close.
- Numbers roll to their new value.
- Nothing moves on its own when idle.

## Platforms
- **iPhone**: PWA — open in Safari → Share → *Add to Home Screen*. Full-screen, offline, safe-area aware.
- **Android**: installable APK built with Capacitor in GitHub Actions (also installable as a PWA from Chrome).
