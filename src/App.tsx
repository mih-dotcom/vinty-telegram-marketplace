import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { BottomNav } from './components/layout/BottomNav'
import { FeedScreen } from './screens/FeedScreen'
import { SearchScreen } from './screens/SearchScreen'
import { UploadScreen } from './screens/UploadScreen'
import { CharityScreen } from './screens/CharityScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ItemDetailScreen } from './screens/ItemDetailScreen'
import { telegram } from './services/telegram'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AppRoutes() {
  const { pathname } = useLocation()
  // Item detail has its own sticky "Message seller / Buy now" action bar and a
  // Telegram BackButton for navigation, so the tab bar steps aside there —
  // mirrors how Vinted/Depop hide the main tab bar on push-navigated screens.
  const showBottomNav = !pathname.startsWith('/item/')

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<FeedScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/sell" element={<UploadScreen />} />
        <Route path="/charity" element={<CharityScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/item/:id" element={<ItemDetailScreen />} />
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
