import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Wrench } from 'lucide-react'
import { getMaintenanceStatus, setMaintenanceStatus, type MaintenanceStatus } from '../services/api'
import { GlassCard } from '../components/common/GlassCard'
import { Spinner } from '../components/common/ProgressRing'
import { useBackButton } from '../hooks/useTelegram'
import { telegram } from '../services/telegram'

const DURATION_PRESETS: { label: string; minutes: number | null }[] = [
  { label: '15 минут', minutes: 15 },
  { label: '1 час', minutes: 60 },
  { label: '3 часа', minutes: 180 },
  { label: 'Без таймера', minutes: null },
]

export function AdminMaintenanceScreen() {
  const navigate = useNavigate()
  useBackButton(() => navigate(-1))

  const [status, setStatus] = useState<MaintenanceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    getMaintenanceStatus()
      .then((s) => {
        setStatus(s)
        setMessage(s.message ?? '')
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleEnable = async (minutes: number | null) => {
    setBusy(true)
    try {
      const until = minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : null
      await setMaintenanceStatus(true, message.trim(), until)
      telegram.hapticNotification('success')
      load()
    } catch (err) {
      console.error('Failed to enable maintenance —', err)
      telegram.showAlert('Не удалось включить технический перерыв. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    setBusy(true)
    try {
      await setMaintenanceStatus(false)
      telegram.hapticNotification('success')
      load()
    } catch (err) {
      console.error('Failed to disable maintenance —', err)
      telegram.showAlert('Не удалось выключить технический перерыв. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
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
          Технический перерыв
        </h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : (
          <>
            <GlassCard className="p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: status?.enabled ? 'rgba(245,158,11,0.15)' : 'rgba(62,221,109,0.14)' }}
              >
                <Wrench size={18} style={{ color: status?.enabled ? '#F59E0B' : 'var(--color-primary-green)' }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  {status?.enabled ? 'Сейчас включён' : 'Сейчас выключен'}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  {status?.enabled
                    ? 'Обычные пользователи видят заглушку вместо приложения'
                    : 'Приложение работает как обычно'}
                </p>
              </div>
            </GlassCard>

            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Сообщение для пользователей (необязательно)
              </p>
              <div className="glass rounded-2xl px-4 py-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Например: Обновляем приложение, вернёмся через час"
                  rows={3}
                  className="w-full bg-transparent outline-none text-[14px] resize-none placeholder:opacity-50"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Включить на
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleEnable(preset.minutes)}
                    disabled={busy}
                    className="rounded-2xl py-3 text-[13.5px] font-semibold press-spring disabled:opacity-50"
                    style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {status?.enabled && (
              <button
                onClick={handleDisable}
                disabled={busy}
                className="w-full rounded-pill py-3 font-bold text-[14.5px] press-spring disabled:opacity-50"
                style={{ background: 'var(--color-primary-green)', color: '#fff' }}
              >
                Выключить сейчас
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
