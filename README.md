# Morsel

**A food tracker for every cuisine.** Log sushi, sourdough or dal-chawal in three taps, in the portion you actually ate: a bowl, a slice, two rotis or 150 g.

Free, offline, no account, no ads. Your data stays on your phone.

## Install

| Phone | How |
|---|---|
| **iPhone** | Open **https://diabolical-developer.github.io/morsel/** in Safari → Share → **Add to Home Screen** |
| **Android** | Download **[morsel.apk](https://github.com/diabolical-developer/morsel/releases/latest/download/morsel.apk)**, open it, allow installing from your browser when asked. Or open the web link in Chrome → **Install app**. |

## What's inside

- **Your day as a plate.** The rim fills with calories; four bowls fill with protein, carbs, fat and fibre.
- **270+ built-in foods across 15 cuisines.** Indian, Chinese, Italian, Mexican, Japanese, Korean, Thai, Middle Eastern, American, European, plus staples, fruit, snacks, desserts and drinks.
- **Portions people really use.** Katori, bowl, plate, roti, piece, slice, cup, glass, tbsp, tsp, g and ml, with grams shown alongside.
- **Search that understands how people talk.** Typos are fine, and local names work too: *chawal* finds rice, *anda* finds egg, *bhindi* finds okra, *gyoza* finds dumplings.
- **Diet marks and filters.** Vegan, veg, egg and non-veg, with your diet shown first.
- **Packaged foods** via [Open Food Facts](https://world.openfoodfacts.org), or create your own from the label.
- Water tracker, journal calendar, trends, streaks, dark mode, backup and restore.

See [docs/DESIGN.md](docs/DESIGN.md) for the design and UX plan.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production web build in dist/
npm run icons        # regenerate icons from scripts/make-icons.mjs
```

### Android

The APK is built by GitHub Actions on every push to `main` (`.github/workflows/android.yml`) and published as the `android-latest` release.
To build locally you need Android Studio (JDK 21 + Android SDK):

```bash
npm run android:sync
npm run android:open
```

Release signing uses four repository secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

## Stack

React 19, TypeScript, Vite, `vite-plugin-pwa`, Motion, Zustand, Fuse.js, Capacitor 8.

## Notes

Nutrition values are estimates for typical home-style recipes, based on IFCT 2017 (India) and USDA FoodData Central. Morsel is not medical advice.

MIT licensed.
