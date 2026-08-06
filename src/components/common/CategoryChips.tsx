import type { Category } from '../../types'

const CATEGORIES: (Category | 'All')[] = [
  'All',
  'Women',
  'Men',
  'Kids',
  'Shoes',
  'Bags',
  'Accessories',
]

export function CategoryChips({
  active,
  onSelect,
}: {
  active: Category | 'All'
  onSelect: (c: Category | 'All') => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 -mx-4">
      {CATEGORIES.map((cat) => {
        const isActive = cat === active
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`shrink-0 press-spring rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors ${
              isActive ? 'cta-gradient text-white shadow-glass' : 'glass'
            }`}
            style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
