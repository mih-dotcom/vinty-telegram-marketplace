// ─────────────────────────────────────────────────────────────────────────
// Thin wrapper around window.Telegram.WebApp so the rest of the app never
// touches the global directly. Falls back gracefully to sane defaults when
// running outside Telegram (plain browser preview during development).
//
// Note: the official telegram-web-app.js script (loaded via CDN in
// index.html) is present even outside a real Telegram client, but reports
// a minimal legacy "version" there — several methods it doesn't support at
// that version (showPopup/showConfirm, HapticFeedback, BackButton) throw a
// synchronous `WebAppMethodUnsupported` error instead of quietly no-op'ing.
// Every call into `tg` below is therefore wrapped in try/catch so a stray
// unsupported-method error never crashes the app during browser preview.
// ─────────────────────────────────────────────────────────────────────────

function getWebApp(): TelegramWebApp | undefined {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
}

/** Runs `fn` against the Telegram WebApp, swallowing "unsupported in this version" errors. */
function safeCall<T>(fn: (tg: TelegramWebApp) => T, fallback?: T): T | undefined {
  const tg = getWebApp()
  if (!tg) return fallback
  try {
    return fn(tg)
  } catch {
    // Older/stubbed WebApp versions throw WebAppMethodUnsupported for some
    // methods (showPopup, HapticFeedback, BackButton, ...) — treat as a no-op.
    return fallback
  }
}

export const telegram = {
  isAvailable(): boolean {
    return !!getWebApp()
  },

  init() {
    safeCall((tg) => {
      tg.ready()
      tg.expand()
    })
  },

  getInitDataUnsafe(): TelegramWebAppInitDataUnsafe | undefined {
    return safeCall((tg) => tg.initDataUnsafe)
  },

  getRawInitData(): string {
    return safeCall((tg) => tg.initData, '') ?? ''
  },

  getColorScheme(): 'light' | 'dark' {
    return safeCall((tg) => tg.colorScheme, 'light') ?? 'light'
  },

  getThemeParams(): TelegramThemeParams {
    return safeCall((tg) => tg.themeParams, {}) ?? {}
  },

  onThemeChanged(cb: () => void) {
    safeCall((tg) => tg.onEvent('themeChanged', cb))
    return () => safeCall((tg) => tg.offEvent('themeChanged', cb))
  },

  haptic(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
    safeCall((tg) => tg.HapticFeedback?.impactOccurred(style))
  },

  hapticNotification(type: 'error' | 'success' | 'warning') {
    safeCall((tg) => tg.HapticFeedback?.notificationOccurred(type))
  },

  hapticSelection() {
    safeCall((tg) => tg.HapticFeedback?.selectionChanged())
  },

  showMainButton(text: string, onClick: () => void) {
    const tg = getWebApp()
    if (!tg) return () => {}
    safeCall(() => {
      tg.MainButton.setText(text)
      tg.MainButton.show()
      tg.MainButton.enable()
      tg.MainButton.onClick(onClick)
    })
    return () => safeCall(() => {
      tg.MainButton.offClick(onClick)
      tg.MainButton.hide()
    })
  },

  setMainButtonLoading(loading: boolean) {
    safeCall((tg) => {
      if (loading) {
        tg.MainButton.showProgress(true)
        tg.MainButton.disable()
      } else {
        tg.MainButton.hideProgress()
        tg.MainButton.enable()
      }
    })
  },

  hideMainButton() {
    safeCall((tg) => tg.MainButton.hide())
  },

  showBackButton(onClick: () => void) {
    const tg = getWebApp()
    if (!tg) return () => {}
    safeCall(() => {
      tg.BackButton.show()
      tg.BackButton.onClick(onClick)
    })
    return () => safeCall(() => {
      tg.BackButton.offClick(onClick)
      tg.BackButton.hide()
    })
  },

  hideBackButton() {
    safeCall((tg) => tg.BackButton.hide())
  },

  showAlert(message: string) {
    const ok = safeCall((tg) => {
      tg.showAlert(message)
      return true
    })
    if (!ok) window.alert(message)
  },

  showConfirm(message: string): Promise<boolean> {
    const tg = getWebApp()
    if (!tg) return Promise.resolve(window.confirm(message))
    return new Promise((resolve) => {
      const ok = safeCall(() => {
        tg.showConfirm(message, (confirmed) => resolve(confirmed))
        return true
      })
      if (!ok) resolve(window.confirm(message))
    })
  },

  /**
   * Opens a t.me link — e.g. a user's DM (`https://t.me/username`) — using
   * Telegram's native in-app navigation when available (keeps the person
   * inside Telegram instead of bouncing out to a system browser). Falls
   * back to a plain new-tab open outside Telegram (dev/browser preview).
   */
  openTelegramLink(url: string) {
    const opened = safeCall((tg) => {
      tg.openTelegramLink(url)
      return true
    })
    if (!opened) window.open(url, '_blank')
  },
}
