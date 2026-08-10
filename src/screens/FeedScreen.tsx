import { useCallback, useEffect, useRef, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HomeHeader } from '../components/layout/HomeHeader'
import { PromoBanner, type PromoSlide } from '../components/common/PromoBanner'
import { CategoryIconRow } from '../components/common/CategoryIconRow'
import { QuickFilterChips } from '../components/common/QuickFilterChips'
import { ItemGrid } from '../components/item/ItemGrid'
import { Spinner } from '../components/common/ProgressRing'
import { FilterSheet, DEFAULT_DRAFT, type DraftFilters } from '../components/filters/FilterSheet'
import { FACETS, getItems } from '../services/api'
import type { Item } from '../types'
import { useApp } from '../context/AppContext'
import { usePullToRefresh } from '../hooks/usePullToRefresh'

export function FeedScreen() {
  const navigate = useNavigate()
  const { currentUser } = useApp()

  const [filters, setFilters] = useState<DraftFilters>(DEFAULT_DRAFT)
  const [filterOpen, setFilterOpen] = useState(false)

  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(
    async (pageNum: number, replace: boolean) => {
      setLoading(true)
      const result = await getItems({
        category: filters.category,
        subcategories: filters.subcategories.length ? filters.subcategories : undefined,
        genders: filters.genders.length ? filters.genders : undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice >= FACETS.maxPrice ? undefined : filters.maxPrice,
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
    [filters]
  )

  // Reload from page 1 whenever the filters (including category) change.
  useEffect(() => {
    setPage(1)
    load(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

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

  const { pulling, pullDistance } = usePullToRefresh(() => load(1, true))

  const slides: PromoSlide[] = [
    {
      id: 'new-arrivals',
      label: 'Новинки',
      title: 'Найди свой стиль',
      cta: 'В магазин',
      image: 'https://picsum.photos/seed/promo-newarrivals/640/400',
      onAction: () => setFilters((f) => ({ ...f, sortBy: 'newest' })),
    },
    {
      id: 'give-back',
      label: 'Добро',
      title: 'Отдай вещи на пользу',
      cta: 'Организации',
      image: 'https://picsum.photos/seed/promo-charity/640/400',
      onAction: () => navigate('/charity'),
    },
    {
      id: 'trending',
      label: 'В тренде',
      title: 'Смотри, что популярно',
      cta: 'Смотреть',
      image: 'https://picsum.photos/seed/promo-trending/640/400',
      onAction: () => setFilters((f) => ({ ...f, sortBy: 'relevant' })),
    },
  ]

  return (
    <div className="pb-28">
      <HomeHeader user={currentUser} />

      {/* Индикатор pull-to-refresh */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pulling ? 40 : pullDistance }}
      >
        <Spinner size={20} />
      </div>

      <main className="px-4 pt-3 flex flex-col gap-5">
        <PromoBanner slides={slides} />

        <CategoryIconRow
          active={filters.category}
          onSelect={(category) => setFilters((f) => ({ ...f, category, subcategories: [] }))}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <QuickFilterChips
              active={filters.sortBy}
              onSelect={(sortBy) => setFilters((f) => ({ ...f, sortBy }))}
            />
            <button
              onClick={() => setFilterOpen(true)}
              aria-label="Все фильтры"
              className="shrink-0 ml-2 w-9 h-9 rounded-full flex items-center justify-center press-spring"
              style={{ background: 'var(--surface-alt)' }}
            >
              <SlidersHorizontal size={15} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>

          <ItemGrid items={items} loading={loading && page === 1} />
          <div ref={sentinelRef} className="h-8" />
          {loading && items.length > 0 && (
            <p className="text-center text-[13px] py-3" style={{ color: 'var(--text-tertiary)' }}>
              Загружаем ещё...
            </p>
          )}
        </div>
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
