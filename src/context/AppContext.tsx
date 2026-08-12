import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Item, User } from '../types'
import * as api from '../services/api'
import { telegram } from '../services/telegram'
import { useTelegramTheme } from '../hooks/useTelegram'

interface AppContextValue {
  currentUser: User | null
  loadingUser: boolean
  refreshUser: () => Promise<void>
  favoriteIds: Set<string>
  isFavorited: (id: string) => boolean
  toggleFavorite: (item: Item) => Promise<void>
  colorScheme: 'light' | 'dark'
  isAdmin: boolean
}

// Only this Telegram username can delete ANY listing (not just their own).
// Enforced for real server-side in the n8n "delete listing" workflow — this
// client-side flag only controls whether the delete button is shown.
const ADMIN_USERNAME = 'tell_somebody'

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const { colorScheme } = useTelegramTheme()

  const refreshUser = useCallback(async () => {
    setLoadingUser(true)
    try {
      const user = await api.getCurrentUser()
      setCurrentUser(user)
    } finally {
      setLoadingUser(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
    api.getFavoriteItems().then((items) => setFavoriteIds(new Set(items.map((i) => i.id))))
  }, [refreshUser])

  const isFavorited = useCallback((id: string) => favoriteIds.has(id), [favoriteIds])

  const toggleFavorite = useCallback(async (item: Item) => {
    const nowFavorited = await api.toggleFavorite(item.id)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (nowFavorited) next.add(item.id)
      else next.delete(item.id)
      return next
    })
    telegram.hapticSelection()
  }, [])

  // Apply Telegram's light/dark colorScheme as a data attribute so the app
  // follows Telegram's live theme. Note: we deliberately do NOT pull
  // --color-primary-green from Telegram's theme_params.button_color —
  // that's the user's personal Telegram accent color (often blue) and
  // would override this app's own green brand identity.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', colorScheme)
  }, [colorScheme])

  const isAdmin = useMemo(
    () => (currentUser?.username ?? '').toLowerCase() === ADMIN_USERNAME.toLowerCase(),
    [currentUser]
  )

  const value = useMemo(
    () => ({
      currentUser,
      loadingUser,
      refreshUser,
      favoriteIds,
      isFavorited,
      toggleFavorite,
      colorScheme,
      isAdmin,
    }),
    [currentUser, loadingUser, refreshUser, favoriteIds, isFavorited, toggleFavorite, colorScheme, isAdmin]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
