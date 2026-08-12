import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../common/Avatar'
import type { User } from '../../types'
import { getGreeting } from '../../utils/format'

export function HomeHeader({ user }: { user: User | null }) {
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] ?? 'Гость'

  return (
    <header className="sticky top-0 z-30 glass safe-top px-4 pb-3 flex items-center justify-between">
      <div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {getGreeting()},
        </p>
        <h1 className="text-[20px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {firstName} 👋
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/subscriptions')}
          aria-label="Уведомления"
          className="relative w-10 h-10 rounded-full flex items-center justify-center press-spring"
          style={{ background: 'var(--surface-alt)' }}
        >
          <Bell size={18} style={{ color: 'var(--text-primary)' }} />
          <span
            className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-primary-green)' }}
          />
        </button>
        <button onClick={() => navigate('/profile')} aria-label="Профиль" className="press-spring">
          <Avatar src={user?.avatarUrl} name={user?.name ?? '?'} size={40} />
        </button>
      </div>
    </header>
  )
}
