import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Heart, Share2, Trash2 } from 'lucide-react'
import { deleteListing, getItemById, getUserProfile } from '../services/api'
import type { Item, User } from '../types'
import { ConditionBadge, InfoChip } from '../components/common/ConditionBadge'
import { Avatar } from '../components/common/Avatar'
import { RatingStars } from '../components/common/RatingStars'
import { Spinner } from '../components/common/ProgressRing'
import { useApp } from '../context/AppContext'
import { useBackButton } from '../hooks/useTelegram'
import { telegram } from '../services/telegram'
import { formatPrice, timeAgo } from '../utils/format'

export function ItemDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isFavorited, toggleFavorite, currentUser, isAdmin } = useApp()

  const [item, setItem] = useState<Item | null>(null)
  const [seller, setSeller] = useState<User | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useBackButton(() => navigate(-1))

  const canDelete = !!item && (isAdmin || (!!currentUser && item.sellerId === currentUser.id))

  const handleDelete = async () => {
    if (!item) return
    const confirmed = await telegram.showConfirm(
      isAdmin && item.sellerId !== currentUser?.id
        ? `Удалить это объявление как администратор? Это действие необратимо.`
        : 'Удалить это объявление? Это действие необратимо.'
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      await deleteListing(item.id)
      telegram.hapticNotification('success')
      navigate(-1)
    } catch (err) {
      console.error('Failed to delete listing —', err)
      telegram.showAlert('Не удалось удалить объявление. Попробуйте ещё раз.')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getItemById(id).then(async (found) => {
      setItem(found ?? null)
      if (found) {
        const s = await getUserProfile(found.sellerId)
        setSeller(s ?? null)
      }
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={28} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p style={{ color: 'var(--text-secondary)' }}>Не удалось найти эту вещь.</p>
        <button
          onClick={() => navigate('/')}
          className="cta-gradient text-white font-semibold px-5 py-2.5 rounded-pill press-spring"
        >
          На главную
        </button>
      </div>
    )
  }

  const favorited = isFavorited(item.id)

  return (
    <div className="pb-32">
      {/* Photo carousel */}
      <div className="relative w-full aspect-[3/4] bg-black/20">
        <img
          src={item.images[photoIndex]}
          alt={item.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-0 left-0 right-0 safe-top px-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 rounded-full glass flex items-center justify-center press-spring"
          >
            <ChevronLeft size={22} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Удалить объявление"
                className="w-10 h-10 rounded-full glass flex items-center justify-center press-spring disabled:opacity-50"
              >
                <Trash2 size={18} className="text-white" />
              </button>
            )}
            <button
              onClick={() => telegram.showAlert('Функция «поделиться» пока не подключена.')}
              aria-label="Поделиться"
              className="w-10 h-10 rounded-full glass flex items-center justify-center press-spring"
            >
              <Share2 size={18} className="text-white" />
            </button>
            <button
              onClick={() => toggleFavorite(item)}
              aria-label="В избранное"
              className="w-10 h-10 rounded-full glass flex items-center justify-center press-spring"
            >
              <Heart
                size={18}
                className={favorited ? 'fill-green-brand text-green-brand' : 'text-white'}
              />
            </button>
          </div>
        </div>

        {item.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {item.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                aria-label={`Фото ${i + 1}`}
                className="glass rounded-full transition-all"
                style={{
                  width: i === photoIndex ? 18 : 6,
                  height: 6,
                  background: i === photoIndex ? 'var(--color-primary-green)' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Seller row */}
        {seller && (
          <button
            onClick={() => {
              telegram.hapticSelection()
              telegram.showAlert('Публичные профили продавцов пока не реализованы — это прототип.')
            }}
            className="flex items-center gap-3 glass rounded-card px-3 py-3 press-spring text-left"
          >
            <Avatar src={seller.avatarUrl} name={seller.name} size={44} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {seller.name}
              </p>
              <RatingStars rating={seller.rating} count={seller.ratingCount} />
            </div>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--color-primary-green)' }}>
              Профиль
            </span>
          </button>
        )}

        {/* Price + title */}
        <div>
          <p className="text-[26px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {formatPrice(item.price, item.currency)}
          </p>
          <h1 className="text-[17px] font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Добавлено {timeAgo(item.createdAt)}
          </p>
        </div>

        {/* Бейджи */}
        <div className="flex flex-wrap gap-2">
          <ConditionBadge condition={item.condition} />
          <InfoChip label={`Размер ${item.size}`} />
          <InfoChip label={item.brand} />
          <InfoChip label={item.gender} />
          {item.color && <InfoChip label={item.color} />}
        </div>

        {/* Описание */}
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Описание
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {item.description}
          </p>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 safe-bottom pointer-events-none z-40">
        <div className="glass-strong rounded-t-sheet w-full max-w-[560px] px-4 pt-3 pb-3 flex gap-3 pointer-events-auto shadow-glass-lg">
          <button
            onClick={() => {
              if (seller?.username) {
                telegram.openTelegramLink(`https://t.me/${seller.username}`)
              } else {
                telegram.showAlert('У продавца не задан username в Telegram — написать напрямую нельзя.')
              }
            }}
            className="flex-1 glass rounded-pill py-3 font-semibold text-[14px] press-spring"
            style={{ color: 'var(--text-primary)' }}
          >
            Написать продавцу
          </button>
          <button
            onClick={() => telegram.showAlert('Оплата пока не подключена — это прототип.')}
            className="flex-1 cta-gradient text-white rounded-pill py-3 font-bold text-[14px] press-spring shadow-glass"
          >
            {item.sold ? 'Продано' : 'Купить'}
          </button>
        </div>
      </div>
    </div>
  )
}
