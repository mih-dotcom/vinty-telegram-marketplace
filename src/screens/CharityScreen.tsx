import { Heart } from 'lucide-react'
import { ScreenHeader } from '../components/layout/ScreenHeader'

export function CharityScreen() {
  return (
    <div className="pb-28">
      <ScreenHeader title="Добро" sticky={false} />
      <div className="px-4 pt-1">
        <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
          Подарите ненужным вещам вторую жизнь — эти организации принимают
          пожертвования рядом с вами.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,200,83,0.12)' }}
          >
            <Heart size={26} style={{ color: 'var(--color-primary-green)' }} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Скоро будет
          </p>
          <p className="text-[13px] max-w-[240px]" style={{ color: 'var(--text-tertiary)' }}>
            Мы собираем список организаций, принимающих пожертвования. Загляните сюда позже.
          </p>
        </div>
      </div>
    </div>
  )
}
