import type { Item } from '../../types'
import { ItemCard } from './ItemCard'
import { Spinner } from '../common/ProgressRing'
import { PackageSearch } from 'lucide-react'

export function ItemGrid({
  items,
  loading,
  emptyLabel = 'No items found',
}: {
  items: Item[]
  loading?: boolean
  emptyLabel?: string
}) {
  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <PackageSearch size={40} style={{ color: 'var(--text-tertiary)' }} />
        <p style={{ color: 'var(--text-secondary)' }} className="text-[14px]">
          {emptyLabel}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="glass rounded-card aspect-[3/4] animate-pulse" />
        ))}
      {loading && items.length === 0 && (
        <div className="col-span-2 flex justify-center py-10">
          <Spinner />
        </div>
      )}
    </div>
  )
}
