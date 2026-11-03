// Draws the Morsel mark (a plate with a bite out of it, ringed in the four nutrient colours)
// and renders every icon / splash size the PWA and the Android app need.
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const BRAND = '#3B2BFF'
const COLORS = ['#FF3D7F', '#FFB800', '#FF6B2C', '#14C38E']

function mark({ size = 512, scale = 1, background = true }) {
  const c = size / 2
  const R = 150 * scale * (size / 512)
  const ring = R * 0.8
  const pt = (a, r) => {
    const rad = (a * Math.PI) / 180
    return `${(c + r * Math.sin(rad)).toFixed(2)} ${(c - r * Math.cos(rad)).toFixed(2)}`
  }
  const arcs = [
    [80, 155],
    [167, 242],
    [254, 329],
    [341, 395],
  ]
    .map(([a1, a2], i) => `<path d="M ${pt(a1, ring)} A ${ring} ${ring} 0 0 1 ${pt(a2, ring)}" stroke="${COLORS[i]}" stroke-width="${R * 0.15}" stroke-linecap="round" fill="none"/>`)
    .join('')
  const b = R * 0.27 // bite radius
  const bites = [
    [38, R * 1.02],
    [60, R * 1.02],
  ]
    .map(([a, r]) => {
      const [x, y] = pt(a, r).split(' ')
      return `<circle cx="${x}" cy="${y}" r="${b}" fill="black"/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs><mask id="bite"><rect width="${size}" height="${size}" fill="white"/>${bites}</mask></defs>
  ${background ? `<rect width="${size}" height="${size}" fill="${BRAND}"/>` : ''}
  <g mask="url(#bite)">
    <circle cx="${c}" cy="${c}" r="${R}" fill="#FFFFFF"/>
    <circle cx="${c}" cy="${c}" r="${R * 0.62}" fill="#F1F0FF"/>
    ${arcs}
  </g>
</svg>`
}

const roundedFavicon = mark({ size: 512, scale: 1.25 }).replace(
  `<rect width="512" height="512" fill="${BRAND}"/>`,
  `<rect width="512" height="512" rx="120" fill="${BRAND}"/>`,
)

mkdirSync('public', { recursive: true })
mkdirSync('assets', { recursive: true })
writeFileSync('public/favicon.svg', roundedFavicon)

const png = (svg, out, size) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)

await Promise.all([
  png(mark({ size: 512, scale: 1.2 }), 'public/pwa-192x192.png', 192),
  png(mark({ size: 512, scale: 1.2 }), 'public/pwa-512x512.png', 512),
  png(mark({ size: 512, scale: 0.95 }), 'public/maskable-icon-512x512.png', 512),
  png(mark({ size: 512, scale: 1.1 }), 'public/apple-touch-icon-180x180.png', 180),
  // Capacitor assets (consumed by `npx @capacitor/assets generate --android`)
  png(mark({ size: 1024, scale: 1.15 }), 'assets/icon-only.png', 1024),
  png(mark({ size: 1024, scale: 0.85, background: false }), 'assets/icon-foreground.png', 1024),
  sharp({ create: { width: 1024, height: 1024, channels: 4, background: BRAND } }).png().toFile('assets/icon-background.png'),
  png(mark({ size: 2732, scale: 0.42 }), 'assets/splash.png', 2732),
  png(mark({ size: 2732, scale: 0.42 }).replace(BRAND, '#0F0C29'), 'assets/splash-dark.png', 2732),
])

console.log('Icons written to public/ and assets/')
