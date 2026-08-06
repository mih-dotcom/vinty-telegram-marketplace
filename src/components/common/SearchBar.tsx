import { Search, SlidersHorizontal } from 'lucide-react'

export function SearchBar({
  value,
  onChange,
  onFilterClick,
  placeholder = 'Search items, brands...',
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  onFilterClick?: () => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="glass rounded-pill flex items-center gap-2 px-4 py-2.5 flex-1">
        <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-[15px] placeholder:opacity-60"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          aria-label="Filters"
          className="glass rounded-pill w-11 h-11 flex items-center justify-center press-spring shrink-0"
        >
          <SlidersHorizontal size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
      )}
    </div>
  )
}
