import { useEffect, useRef, useState } from 'react'
import { telegram } from '../services/telegram'

export interface TelegramThemeVars {
  colorScheme: 'light' | 'dark'
  themeParams: TelegramThemeParams
}

/**
 * Subscribes to Telegram's theme so the app can adapt live when the user
 * flips their Telegram appearance between light/dark while the mini app
 * is open.
 */
export function useTelegramTheme(): TelegramThemeVars {
  const [theme, setTheme] = useState<TelegramThemeVars>({
    colorScheme: telegram.getColorScheme(),
    themeParams: telegram.getThemeParams(),
  })

  useEffect(() => {
    const update = () =>
      setTheme({
        colorScheme: telegram.getColorScheme(),
        themeParams: telegram.getThemeParams(),
      })
    const unsubscribe = telegram.onThemeChanged(update)
    return unsubscribe
  }, [])

  return theme
}

/**
 * Registers a Telegram MainButton for the lifetime of the calling
 * component. Automatically hides/cleans up on unmount.
 */
export function useMainButton(
  text: string,
  onClick: () => void,
  opts?: { visible?: boolean; loading?: boolean }
) {
  const visible = opts?.visible ?? true

  // Keep a ref to the latest onClick so the button binding below can stay
  // stable across renders without ever calling a stale closure — Telegram's
  // MainButton.onClick registers the exact function reference we pass it, so
  // re-registering on every render (when onClick is an inline arrow) would
  // either miss updates or require constant offClick/onClick churn.
  const onClickRef = useRef(onClick)
  useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  useEffect(() => {
    if (!visible) return
    const stableHandler = () => onClickRef.current()
    const cleanup = telegram.showMainButton(text, stableHandler)
    return cleanup
  }, [text, visible])

  useEffect(() => {
    telegram.setMainButtonLoading(!!opts?.loading)
  }, [opts?.loading])
}

/** Registers a Telegram BackButton that navigates back for the lifetime of the component. */
export function useBackButton(onClick: () => void, active = true) {
  const onClickRef = useRef(onClick)
  useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  useEffect(() => {
    if (!active) return
    const stableHandler = () => onClickRef.current()
    const cleanup = telegram.showBackButton(stableHandler)
    return cleanup
  }, [active])
}
