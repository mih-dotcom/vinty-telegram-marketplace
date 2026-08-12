import { Sparkles, Star } from 'lucide-react'
import type { ItemFilters } from '../../types'

type QuickSort = NonNullable<ItemFilters['sortBy']>

const OPTIONS: { key: QuickSort; label: string; icon: typeof Sparkles }[] = [
  { key: 'newest', label: 'Новое', icon: Sparkles },
  { key: 'price_low', label: 'Недорого', icon: Star },
]

export function QuickFilterChips({
  active,
  onSelect,
}: {
  active: QuickSort
  onSelect: (sort: QuickSort) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 -mx-4">
      {OPTIONS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="shrink-0 press-spring rounded-pill pl-3 pr-4 py-2 text-[13px] font-semibold flex items-center gap-1.5"
            style={{
              background: isActive ? 'var(--color-primary-green)' : 'var(--surface)',
              color: isActive ? '#fff' : 'var(--text-primary)',
              border: isActive ? 'none' : '1px solid var(--surface-border)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
