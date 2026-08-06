import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Settings } from 'lucide-react'
import { Avatar } from '../components/common/Avatar'
import { RatingStars } from '../components/common/RatingStars'
import { GlassCard } from '../components/common/GlassCard'
import { TabSwitcher } from '../components/profile/TabSwitcher'
import { SettingsSheet } from '../components/profile/SettingsSheet'
import { Sheet } from '../components/layout/Sheet'
import { PricePill, SoldBadge } from '../components/common/PricePill'
import { Spinner } from '../components/common/ProgressRing'
import { useApp } from '../context/AppContext'
import { deleteListing, getFavoriteItems, getItemsBySeller, markAsSold } from '../services/api'
import type { Item } from '../types'
import { formatMemberSince } from '../utils/format'
import { telegram } from '../services/telegram'

const TABS = ['My Listings', 'Favorites', 'Purchases', 'Sold'] as const
type Tab = (typeof TABS)[number]

export function ProfileScreen() {
  const navigate = useNavigate()
  const { currentUser, loadingUser } = useApp()
  const [tab, setTab] = useState<Tab>('My Listings')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuItem, setMenuItem] = useState<Item | null>(null)

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    if (tab === 'Favorites') {
      setItems(await getFavoriteItems())
    } else if (tab === 'My Listings') {
      const mine = await getItemsBySeller(currentUser.id)
      setItems(mine.filter((i) => !i.sold))
    } else if (tab === 'Sold') {
      const mine = await getItemsBySeller(currentUser.id)
      setItems(mine.filter((i) => i.sold))
    } else {
      setItems([]) // Purchases: no checkout flow exists yet in this prototype
    }
    setLoading(false)
  }, [tab, currentUser])

  useEffect(() => {
    load()
  }, [load])

  const handleMarkSold = async (item: Item) => {
    await markAsSold(item.id, !item.sold)
    setMenuItem(null)
    load()
  }

  const handleDelete = async (item: Item) => {
    const ok = await telegram.showConfirm(`Delete "${item.title}"? This can't be undone.`)
    if (!ok) return
    await deleteListing(item.id)
    setMenuItem(null)
    load()
  }

  if (loadingUser || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 glass safe-top px-4 pb-3 flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
          Profile
        </h1>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="w-9 h-9 rounded-full glass flex items-center justify-center press-spring"
        >
          <Settings size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar src={currentUser.avatarUrl} name={currentUser.name} size={72} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {currentUser.name}
            </h2>
            <p className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
              @{currentUser.username}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <RatingStars rating={currentUser.rating} count={currentUser.ratingCount} />
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          <span>
            <b style={{ color: 'var(--text-primary)' }}>{currentUser.followers}</b> followers
          </span>
          <span>
            <b style={{ color: 'var(--text-primary)' }}>{currentUser.following}</b> following
          </span>
        </div>

        {/* Stats card */}
        <GlassCard className="px-4 py-4 grid grid-cols-3 text-center gap-2">
          <div>
            <p className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {currentUser.itemsSold}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Sold
            </p>
          </div>
          <div>
            <p className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {currentUser.itemsListed}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Listed
            </p>
          </div>
          <div>
            <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatMemberSince(currentUser.memberSince)}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Member since
            </p>
          </div>
        </GlassCard>

        <button
          onClick={() => telegram.showAlert('Edit profile is a placeholder in this prototype.')}
          className="glass rounded-pill py-2.5 font-semibold text-[14px] press-spring"
          style={{ color: 'var(--text-primary)' }}
        >
          Edit Profile
        </button>

        <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />

        {/* Items grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-[14px] py-10" style={{ color: 'var(--text-tertiary)' }}>
            {tab === 'Purchases'
              ? "You haven't bought anything yet — checkout isn't wired up in this prototype."
              : 'Nothing here yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const isOwn = tab === 'My Listings' || tab === 'Sold'
              return (
                <div
                  key={item.id}
                  className="glass rounded-card overflow-hidden press-spring cursor-pointer"
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2">
                      {item.sold ? <SoldBadge /> : <PricePill price={item.price} currency={item.currency} />}
                    </div>
                    {isOwn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuItem(item)
                        }}
                        aria-label="More options"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center press-spring"
                      >
                        <MoreVertical size={15} className="text-white" />
                      </button>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {item.brand} · {item.size}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Sheet open={!!menuItem} onClose={() => setMenuItem(null)} title={menuItem?.title ?? ''}>
        {menuItem && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleMarkSold(menuItem)}
              className="glass rounded-2xl px-4 py-3.5 text-left press-spring text-[14.5px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {menuItem.sold ? 'Mark as available' : 'Mark as sold'}
            </button>
            <button
              onClick={() => navigate(`/item/${menuItem.id}`)}
              className="glass rounded-2xl px-4 py-3.5 text-left press-spring text-[14.5px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              View listing
            </button>
            <button
              onClick={() => handleDelete(menuItem)}
              className="glass rounded-2xl px-4 py-3.5 text-left press-spring text-[14.5px] font-medium text-red-400"
            >
              Delete listing
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
