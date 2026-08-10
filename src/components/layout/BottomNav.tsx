import { Heart, Home, Plus, Search, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/', label: 'Главная', icon: Home, elevated: false },
  { path: '/search', label: 'Поиск', icon: Search, elevated: false },
  { path: '/sell', label: 'Продать', icon: Plus, elevated: true },
  { path: '/charity', label: 'Добро', icon: Heart, elevated: false },
  { path: '/profile', label: 'Профиль', icon: User, elevated: false },
] as const

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none safe-bottom px-4">
      <div className="pointer-events-auto glass-strong rounded-pill flex items-center gap-1 px-2 py-2 mb-2 shadow-glass-lg max-w-[420px] w-full justify-between">
        {TABS.map(({ path, label, icon: Icon, elevated }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

          if (elevated) {
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                aria-label={label}
                className="press-spring cta-gradient w-14 h-14 rounded-full flex items-center justify-center shadow-glass-lg -mt-6 border-4"
                style={{ borderColor: 'var(--bg-app)' }}
              >
                <Icon size={26} className="text-white" strokeWidth={2.5} />
              </button>
            )
          }

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-label={label}
              className="press-spring flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-2xl"
            >
              <Icon
                size={22}
                className={active ? 'fill-green-brand/20' : ''}
                style={{ color: active ? 'var(--color-primary-green)' : 'var(--text-tertiary)' }}
                strokeWidth={active ? 2.4 : 2}
              />
              {active && (
                <span
                  className="text-[10px] font-semibold animate-fade-in"
                  style={{ color: 'var(--color-primary-green)' }}
                >
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
