import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'

function useCountdown(until: string | null) {
  const [remaining, setRemaining] = useState<string | null>(null)

  useEffect(() => {
    if (!until) {
      setRemaining(null)
      return
    }
    const target = new Date(until).getTime()

    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setRemaining('уже скоро')
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1000)
      setRemaining(h > 0 ? `${h} ч ${m} мин` : m > 0 ? `${m} мин ${s} сек` : `${s} сек`)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [until])

  return remaining
}

export function MaintenanceScreen({ message, until }: { message: string | null; until: string | null }) {
  const remaining = useCountdown(until)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center"
      style={{ background: 'var(--bg-app)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(62,221,109,0.14)' }}
      >
        <Wrench size={28} style={{ color: 'var(--color-primary-green)' }} />
      </div>
      <h1 className="text-[19px] font-bold" style={{ color: 'var(--text-primary)' }}>
        Технический перерыв
      </h1>
      <p className="text-[14.5px] leading-relaxed max-w-[280px]" style={{ color: 'var(--text-secondary)' }}>
        {message || 'Мы ненадолго остановили приложение для техработ. Загляните чуть позже.'}
      </p>
      {remaining && (
        <p className="text-[13px] font-semibold" style={{ color: 'var(--color-primary-green)' }}>
          Осталось примерно: {remaining}
        </p>
      )}
    </div>
  )
}
