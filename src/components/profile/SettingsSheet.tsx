import { Bell, ChevronRight, CreditCard, LogOut } from 'lucide-react'
import { Sheet } from '../layout/Sheet'
import { telegram } from '../../services/telegram'

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rows = [
    { icon: Bell, label: 'Notifications', action: () => telegram.showAlert('Notification settings coming soon.') },
    {
      icon: CreditCard,
      label: 'Payment & shipping info',
      action: () => telegram.showAlert('Payment/shipping setup is a placeholder for now.'),
    },
  ]

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
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

        <button
          onClick={async () => {
            const ok = await telegram.showConfirm('Log out of your account?')
            if (ok) telegram.showAlert('Logged out (prototype — no real session to end).')
          }}
          className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 press-spring mt-2"
        >
          <LogOut size={18} className="text-red-400" />
          <span className="flex-1 text-left text-[14.5px] font-medium text-red-400">Log out</span>
        </button>
      </div>
    </Sheet>
  )
}
