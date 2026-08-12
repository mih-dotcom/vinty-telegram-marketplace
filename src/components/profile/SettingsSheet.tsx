import { Bell, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sheet } from '../layout/Sheet'

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()

  const rows = [
    {
      icon: Bell,
      label: 'Уведомления',
      action: () => {
        onClose()
        navigate('/subscriptions')
      },
    },
  ]

  return (
    <Sheet open={open} onClose={onClose} title="Настройки">
      <div className="flex flex-col gap-2">
        {rows.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 press-spring"
          >
            <Icon size={18} style={{ color: 'var(--color-primary-green)' }} />
            <span className="flex-1 text-left text-[14.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {label}
            </span>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        ))}
      </div>
    </Sheet>
  )
}
