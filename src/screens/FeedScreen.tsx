import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { SearchBar } from '../components/common/SearchBar'
import { CategoryChips } from '../components/common/CategoryChips'
import { ItemGrid } from '../components/item/ItemGrid'
import { FilterSheet, DEFAULT_DRAFT, type DraftFilters } from '../components/filters/FilterSheet'
import { getItems } from '../services/api'
import type { Category, Item } from '../types'

export function FeedScreen() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [filters, setFilters] = useState<DraftFilters>(DEFAULT_DRAFT)
  const [filterOpen, setFilterOpen] = useState(false)

  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(
    async (pageNum: number, replace: boolean) => {
      setLoading(true)
      const result = await getItems({
        query,
        category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice >= 200 ? undefined : filters.maxPrice,
        sizes: filters.sizes.length ? filters.sizes : undefined,
        conditions: filters.conditions.length ? filters.conditions : undefined,
        brands: filters.brands.length ? filters.brands : undefined,
        colors: filters.colors.length ? filters.colors : undefined,
        sortBy: filters.sortBy,
        page: pageNum,
        pageSize: 8,
      })
      setItems((prev) => (replace ? result.items : [...prev, ...result.items]))
      setHasMore(result.hasMore)
      setLoading(false)
    },
    [query, category, filters]
  )

  // Reload from page 1 whenever search/filter/category changes.
  useEffect(() => {
    setPage(1)
    load(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, filters])

  // Fetch subsequent pages when `page` advances past 1 (page 1 is handled by
  // the reset effect above — kept separate so state updaters above stay pure).
  useEffect(() => {
    if (page === 1) return
    load(page, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Infinite scroll via IntersectionObserver on a sentinel div — only ever
  // advances the page number; fetching itself lives in the effect above.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load(1, true)
    setRefreshing(false)
  }

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 glass safe-top px-4 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold" style={{ color: 'var(--text-primary)' }}>
            Vinty
          </h1>
          <button
            onClick={handleRefresh}
            aria-label="Refresh"
            className="w-9 h-9 rounded-full glass flex items-center justify-center press-spring"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin-slow' : ''}
              style={{ color: 'var(--text-primary)' }}
            />
          </button>
        </div>
        <SearchBar value={query} onChange={setQuery} onFilterClick={() => setFilterOpen(true)} />
        <CategoryChips active={category} onSelect={setCategory} />
      </header>

      <main className="px-4 pt-4">
        <ItemGrid items={items} loading={loading && page === 1} />
        <div ref={sentinelRef} className="h-8" />
        {loading && items.length > 0 && (
          <p className="text-center text-[13px] py-3" style={{ color: 'var(--text-tertiary)' }}>
            Loading more...
          </p>
        )}
      </main>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onApply={setFilters}
      />
    </div>
  )
}
