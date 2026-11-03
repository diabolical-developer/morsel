import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { isNativeApp } from './lib/device'
import './styles.css'

// The Android app ships its files inside the APK, so it needs no service worker.
if (!isNativeApp()) registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
