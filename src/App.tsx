import { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { BottomNav } from './components/layout/BottomNav'
import { FeedScreen } from './screens/FeedScreen'
import { SearchScreen } from './screens/SearchScreen'
import { UploadScreen } from './screens/UploadScreen'
import { CharityScreen } from './screens/CharityScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ItemDetailScreen } from './screens/ItemDetailScreen'
import { SubscriptionsScreen } from './screens/SubscriptionsScreen'
import { GuidedTour } from './components/onboarding/GuidedTour'
import { MaintenanceScreen } from './components/onboarding/MaintenanceScreen'
import { AdminStatsScreen } from './screens/AdminStatsScreen'
import { AdminModerationScreen } from './screens/AdminModerationScreen'
import { AdminMaintenanceScreen } from './screens/AdminMaintenanceScreen'
import { getMaintenanceStatus, type MaintenanceStatus } from './services/api'
import { telegram } from './services/telegram'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Telegram's WebView can carry over the last-viewed URL from a previous
// session, so opening the Mini App fresh could otherwise resume on
// whatever screen was open last time instead of the home feed. This forces
// every cold launch back to "/", once, without affecting in-app navigation.
function ForceHomeOnLaunch() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function AppRoutes() {
  const { pathname } = useLocation()
  const { isAdmin } = useApp()
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(null)

  useEffect(() => {
    getMaintenanceStatus().then(setMaintenance)
  }, [])

  // Item detail has its own sticky "Message seller / Buy now" action bar and a
  // Telegram BackButton for navigation, so the tab bar steps aside there —
  // mirrors how Vinted/Depop hide the main tab bar on push-navigated screens.
  const showBottomNav =
    !pathname.startsWith('/item/') &&
    pathname !== '/subscriptions' &&
    !pathname.startsWith('/edit/') &&
    pathname !== '/admin-stats' &&
    pathname !== '/admin-moderation' &&
    pathname !== '/admin-maintenance'

  // Everyone except the admin sees the maintenance screen instead of the
  // app while it's toggled on — the admin still needs access to turn it
  // back off, so they always get the real app (with a small reminder banner).
  if (maintenance?.enabled && !isAdmin) {
    return <MaintenanceScreen message={maintenance.message} until={maintenance.until} />
  }

  return (
    <>
      <ForceHomeOnLaunch />
      <ScrollToTop />
      <GuidedTour />
      {maintenance?.enabled && isAdmin && (
        <div
          className="sticky top-0 z-[60] px-4 py-2 text-center text-[12px] font-semibold safe-top"
          style={{ background: '#F59E0B', color: '#1a1a1a' }}
        >
          Технический перерыв включён — обычные пользователи видят заглушку
        </div>
      )}
      <Routes>
        <Route path="/" element={<FeedScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/sell" element={<UploadScreen />} />
        <Route path="/edit/:id" element={<UploadScreen />} />
        <Route path="/charity" element={<CharityScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/item/:id" element={<ItemDetailScreen />} />
        <Route path="/subscriptions" element={<SubscriptionsScreen />} />
        <Route path="/admin-stats" element={<AdminStatsScreen />} />
        <Route path="/admin-moderation" element={<AdminModerationScreen />} />
        <Route path="/admin-maintenance" element={<AdminMaintenanceScreen />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </>
  )
}

export default function App() {
  useEffect(() => {
    telegram.init()
  }, [])

  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
