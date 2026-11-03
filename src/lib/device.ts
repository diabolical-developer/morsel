export const buzz = (ms = 12) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported */
  }
}

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isNativeApp = () => !!(window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
