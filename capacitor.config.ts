import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.morsel.tracker',
  appName: 'Morsel',
  webDir: 'dist',
  backgroundColor: '#3B2BFF',
  android: {
    backgroundColor: '#3B2BFF',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK', // light icons — every screen has the ultramarine header under the status bar
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
