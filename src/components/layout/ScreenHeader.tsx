import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ScreenHeader({
  title,
  onBack,
  right,
  sticky = true,
}: {
  title: string
  onBack?: boolean | (() => void)
  right?: ReactNode
  sticky?: boolean
}) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof onBack === 'function') onBack()
    else navigate(-1)
  }

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-30' : ''} safe-top glass px-4 pb-3 flex items-center justify-between gap-3`}
      style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            onClick={handleBack}
            aria-label="Back"
            className="w-9 h-9 rounded-full glass flex items-center justify-center press-spring shrink-0"
          >
            <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
        )}
        <h1 className="text-[22px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </header>
  )
}
