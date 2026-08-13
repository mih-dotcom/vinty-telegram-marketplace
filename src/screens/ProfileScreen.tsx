import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Settings } from 'lucide-react'
import { Avatar } from '../components/common/Avatar'
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

const TABS = ['Мои объявления', 'Избранное', 'Продано'] as const
type Tab = (typeof TABS)[number]

export function ProfileScreen() {
  const navigate = useNavigate()
  const { currentUser, loadingUser } = useApp()
  const [tab, setTab] = useState<Tab>('Мои объявления')
  const [allMine, setAllMine] = useState<Item[]>([])
  const [favorites, setFavorites] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuItem, setMenuItem] = useState<Item | null>(null)

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    const [mine, favs] = await Promise.all([
      getItemsBySeller(currentUser.id),
      getFavoriteItems(),
    ])
    setAllMine(mine)
    setFavorites(favs)
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    load()
  }, [load])

  const listedCount = allMine.filter((i) => !i.sold).length
  const soldCount = allMine.filter((i) => i.sold).length

  const items =
    tab === 'Избранное' ? favorites : tab === 'Мои объявления' ? allMine.filter((i) => !i.sold) : allMine.filter((i) => i.sold)

  const handleMarkSold = async (item: Item) => {
    try {
      await markAsSold(item.id, !item.sold)
      setMenuItem(null)
      load()
    } catch (err) {
      console.error('Failed to update sold status —', err)
      telegram.showAlert('Не удалось обновить статус. Попробуйте ещё раз.')
    }
  }

  const handleDelete = async (item: Item) => {
    const ok = await telegram.showConfirm(`Удалить «${item.title}»? Это действие нельзя отменить.`)
    if (!ok) return
    try {
      await deleteListing(item.id)
      telegram.hapticNotification('success')
      setMenuItem(null)
      load()
    } catch (err) {
      console.error('Failed to delete listing —', err)
      telegram.showAlert('Не удалось удалить объявление. Попробуйте ещё раз.')
    }
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
          Профиль
        </h1>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Настройки"
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
          </div>
        </div>

        {/* Карточка статистики — из реальных объявлений, не заглушка */}
        <GlassCard className="px-4 py-4 grid grid-cols-3 text-center gap-2">
          <div>
            <p className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {soldCount}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Продано
            </p>
          </div>
          <div>
            <p className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {listedCount}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Выставлено
            </p>
          </div>
          <div>
            <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatMemberSince(currentUser.memberSince)}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              На платформе с
            </p>
          </div>
        </GlassCard>

        <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />

        {/* Items grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-[14px] py-10" style={{ color: 'var(--text-tertiary)' }}>
            Здесь пока пусто.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const isOwn = tab === 'Мои объявления' || tab === 'Продано'
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
                    {item.flagged && (
                      <div
                        className="absolute top-2 left-2 rounded-pill px-2 py-1 text-[10px] font-bold"
                        style={{ background: 'rgba(0,0,0,0.55)', color: '#FCD34D' }}
                      >
                        На проверке
                      </div>
                    )}
                    {isOwn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuItem(item)
                        }}
                        aria-label="Ещё"
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
              {menuItem.sold ? 'Вернуть в продажу' : 'Отметить проданным'}
            </button>
            <button
              onClick={() => navigate(`/item/${menuItem.id}`)}
              className="glass rounded-2xl px-4 py-3.5 text-left press-spring text-[14.5px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Открыть объявление
            </button>
            <button
              onClick={() => handleDelete(menuItem)}
              className="glass rounded-2xl px-4 py-3.5 text-left press-spring text-[14.5px] font-medium text-red-400"
            >
              Удалить объявление
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
