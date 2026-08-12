import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Heart, Package, ShoppingBag, Users } from 'lucide-react'
import { getAdminStats, type AdminStats, type DayCount } from '../services/api'
import { GlassCard } from '../components/common/GlassCard'
import { Spinner } from '../components/common/ProgressRing'
import { useBackButton } from '../hooks/useTelegram'

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: number
}) {
  return (
    <GlassCard className="p-4 flex flex-col gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(62,221,109,0.14)' }}
      >
        <Icon size={16} style={{ color: 'var(--color-primary-green)' }} />
      </div>
      <p className="text-[22px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </p>
    </GlassCard>
  )
}

function BarChart({ title, data }: { title: string; data: DayCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <GlassCard className="p-4">
      <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
        {title}
      </p>
      <div className="flex items-end gap-2 h-24">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end h-16">
              <div
                className="w-full rounded-md transition-all"
                style={{
                  height: `${Math.max(4, (d.count / max) * 100)}%`,
                  background: d.count > 0 ? 'var(--color-primary-green)' : 'var(--surface-border)',
                }}
              />
            </div>
            <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
              {d.date.slice(8, 10)}.{d.date.slice(5, 7)}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

export function AdminStatsScreen() {
  const navigate = useNavigate()
  useBackButton(() => navigate(-1))

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => {
        console.error('Failed to load admin stats —', err)
        setError(true)
      })
  }, [])

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
          Статистика
        </h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {error && (
          <p className="text-[13.5px]" style={{ color: 'var(--text-secondary)' }}>
            Не удалось загрузить статистику. Попробуйте позже.
          </p>
        )}

        {!stats && !error && (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} label="Зашли в приложение" value={stats.totalUsers} />
              <StatCard icon={Package} label="Активных объявлений" value={stats.totalActiveListings} />
              <StatCard icon={ShoppingBag} label="Продано вещей" value={stats.totalSoldItems} />
              <StatCard icon={Heart} label="«Написать продавцу»" value={stats.totalMessageClicks} />
            </div>

            <BarChart title="Новые пользователи · 7 дней" data={stats.signupsLast7Days} />
            <BarChart title="Новые объявления · 7 дней" data={stats.listingsLast7Days} />
          </>
        )}
      </div>
    </div>
  )
}
