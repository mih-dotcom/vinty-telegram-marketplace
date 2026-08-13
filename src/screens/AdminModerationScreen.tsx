import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import { getFlaggedListings, moderateListing, type FlaggedItem } from '../services/api'
import { GlassCard } from '../components/common/GlassCard'
import { Spinner } from '../components/common/ProgressRing'
import { useBackButton } from '../hooks/useTelegram'
import { telegram } from '../services/telegram'

export function AdminModerationScreen() {
  const navigate = useNavigate()
  useBackButton(() => navigate(-1))

  const [items, setItems] = useState<FlaggedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getFlaggedListings()
      .then(setItems)
      .catch((err) => console.error('Failed to load flagged listings —', err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleApprove = async (item: FlaggedItem) => {
    setBusyId(item.id)
    try {
      await moderateListing(item.id, 'approve')
      telegram.hapticNotification('success')
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      console.error('Failed to approve —', err)
      telegram.showAlert('Не удалось выполнить действие. Попробуйте ещё раз.')
    } finally {
      setBusyId(null)
    }
  }

  const handleBan = async (item: FlaggedItem) => {
    const confirmed = await telegram.showConfirm(
      `Запретить публикацию для ${item.sellerName ?? 'этого пользователя'} на 7 дней? Объявление останется скрытым.`
    )
    if (!confirmed) return
    setBusyId(item.id)
    try {
      await moderateListing(item.id, 'ban')
      telegram.hapticNotification('success')
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      console.error('Failed to ban —', err)
      telegram.showAlert('Не удалось выполнить действие. Попробуйте ещё раз.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-20 safe-top glass-strong px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Назад"
          className="w-9 h-9 rounded-full glass flex items-center justify-center press-spring"
        >
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
          Отсеянные посты
        </h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <ShieldCheck size={26} style={{ color: 'var(--color-primary-green)' }} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Всё чисто
            </p>
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              Нет объявлений, ожидающих проверки.
            </p>
          </div>
        )}

        {items.map((item) => (
          <GlassCard key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ShieldAlert size={13} className="text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-400">
                    Отмечено ИИ-модерацией
                  </span>
                </div>
                <h3 className="text-[14.5px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </h3>
                <p className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
                  {item.price} {item.currency} · {item.sellerUsername ? `@${item.sellerUsername}` : item.sellerName ?? 'неизвестный продавец'}
                </p>
              </div>
            </div>

            {item.description && (
              <p className="text-[13px] leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => handleApprove(item)}
                disabled={busyId === item.id}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-[13px] font-bold press-spring disabled:opacity-50"
                style={{ background: 'var(--color-primary-green)', color: '#fff' }}
              >
                <ShieldCheck size={15} />
                Пропустить
              </button>
              <button
                onClick={() => handleBan(item)}
                disabled={busyId === item.id}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-[13px] font-bold press-spring disabled:opacity-50 text-red-400"
                style={{ background: 'rgba(248,113,113,0.12)' }}
              >
                <ShieldX size={15} />
                Бан на 7 дней
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
