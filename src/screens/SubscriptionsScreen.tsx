import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { GlassCard } from '../components/common/GlassCard'
import { Spinner } from '../components/common/ProgressRing'
import { getSubscriptions, subscribe, unsubscribe, FACETS } from '../services/api'
import type { Category, Gender, Subscription } from '../types'
import { useBackButton } from '../hooks/useTelegram'
import { telegram } from '../services/telegram'

function Pill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-2 rounded-pill text-[13px] font-medium press-spring transition-colors"
      style={
        active
          ? { background: 'var(--color-primary-green)', color: '#fff' }
          : {
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--surface-border)',
            }
      }
    >
      {label}
    </button>
  )
}

function describeSubscription(sub: Subscription): string {
  const parts = [sub.category ?? 'Любая категория', sub.gender ?? 'любой пол', sub.size ? `размер ${sub.size}` : 'любой размер']
  return parts.join(' · ')
}

export function SubscriptionsScreen() {
  const navigate = useNavigate()
  useBackButton(() => navigate(-1))

  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [category, setCategory] = useState<Category | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [size, setSize] = useState('')

  const load = () => {
    setLoading(true)
    getSubscriptions()
      .then(setSubs)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleAdd = async () => {
    setSaving(true)
    try {
      await subscribe({ category, gender, size: size.trim() || null })
      telegram.hapticNotification('success')
      setCategory(null)
      setGender(null)
      setSize('')
      load()
    } catch (err) {
      console.error('Failed to create subscription —', err)
      telegram.showAlert('Не удалось сохранить подписку. Попробуйте ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (sub: Subscription) => {
    const confirmed = await telegram.showConfirm('Удалить эту подписку?')
    if (!confirmed) return
    try {
      await unsubscribe(sub.id)
      setSubs((prev) => prev.filter((s) => s.id !== sub.id))
      telegram.hapticSelection()
    } catch (err) {
      console.error('Failed to remove subscription —', err)
      telegram.showAlert('Не удалось удалить подписку. Попробуйте ещё раз.')
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
          Уведомления о новинках
        </h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">
        <p className="text-[13.5px]" style={{ color: 'var(--text-secondary)' }}>
          Раз в несколько дней бот пришлёт сообщение, если появятся новые вещи, подходящие под
          подписку. Оставьте поле пустым, чтобы не сужать по нему.
        </p>

        {/* New subscription form */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Новая подписка
          </p>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Категория</span>
            <div className="flex flex-wrap gap-2">
              <Pill label="Любая" active={category === null} onClick={() => setCategory(null)} />
              {FACETS.categories.map((c) => (
                <Pill key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Пол</span>
            <div className="flex flex-wrap gap-2">
              <Pill label="Любой" active={gender === null} onClick={() => setGender(null)} />
              {FACETS.genders.map((g) => (
                <Pill key={g} label={g} active={gender === g} onClick={() => setGender(g)} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Размер (необязательно)</span>
            <input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Например, M или 42"
              className="glass rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={saving}
            className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-[13.5px] font-semibold press-spring disabled:opacity-50"
            style={{ background: 'var(--color-primary-green)', color: '#fff' }}
          >
            <Plus size={16} />
            {saving ? 'Сохраняем…' : 'Добавить подписку'}
          </button>
        </GlassCard>

        {/* Existing subscriptions */}
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Мои подписки
          </p>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Bell size={22} style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-[13.5px]" style={{ color: 'var(--text-tertiary)' }}>
                Подписок пока нет
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subs.map((sub) => (
                <div
                  key={sub.id}
                  className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {describeSubscription(sub)}
                  </span>
                  <button
                    onClick={() => handleRemove(sub)}
                    aria-label="Удалить подписку"
                    className="w-8 h-8 rounded-full flex items-center justify-center press-spring flex-shrink-0"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
