import { useEffect, useState } from 'react'
import { SlidersHorizontal, Search } from 'lucide-react'
import { SearchBar } from '../components/common/SearchBar'
import { ItemGrid } from '../components/item/ItemGrid'
import { FACETS, getItems } from '../services/api'
import { FilterSheet, DEFAULT_DRAFT, type DraftFilters } from '../components/filters/FilterSheet'
import type { Item } from '../types'

const RECENT_KEY = 'platforma_recent_searches'

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(terms: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(terms.slice(0, 6)))
  } catch {
    /* no-op */
  }
}

function hasActiveFilters(f: DraftFilters): boolean {
  return (
    f.category !== 'All' ||
    f.subcategories.length > 0 ||
    f.genders.length > 0 ||
    f.sizes.length > 0 ||
    f.conditions.length > 0 ||
    f.brands.length > 0 ||
    f.colors.length > 0 ||
    f.minPrice > FACETS.minPrice ||
    f.maxPrice < FACETS.maxPrice
  )
}

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>(loadRecent())
  const [filters, setFilters] = useState<DraftFilters>(DEFAULT_DRAFT)
  const [filterOpen, setFilterOpen] = useState(false)

  const filtersActive = hasActiveFilters(filters)

  useEffect(() => {
    if (!query.trim() && !filtersActive) {
      setItems([])
      return
    }
    setLoading(true)
    const handle = setTimeout(() => {
      getItems({
        query: query.trim() || undefined,
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
        pageSize: 20,
      }).then((res) => {
        setItems(res.items)
        setLoading(false)
        if (query.trim()) commitSearch(query)
      })
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters])

  const commitSearch = (term: string) => {
    if (!term.trim()) return
    const next = [term, ...recent.filter((r) => r !== term)]
    setRecent(next)
    saveRecent(next)
  }

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 glass safe-top px-4 pb-3 flex items-center gap-2">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            autoFocus
            placeholder="Поиск вещей, брендов, категорий..."
          />
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          aria-label="Фильтры"
          className="relative w-10 h-10 rounded-full glass flex items-center justify-center press-spring flex-shrink-0"
        >
          <SlidersHorizontal size={17} style={{ color: 'var(--text-primary)' }} />
          {filtersActive && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--color-primary-green)' }}
            />
          )}
        </button>
      </header>

      <main className="px-4 pt-4">
        {!query.trim() && !filtersActive ? (
          <div className="flex flex-col gap-6">
            {recent.length > 0 && (
              <section>
                <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Недавние запросы
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="glass rounded-pill px-3.5 py-2 text-[13px] font-medium press-spring"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section>
              <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Популярные бренды
              </h3>
              <div className="flex flex-wrap gap-2">
                {FACETS.brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setQuery(b)
                      commitSearch(b)
                    }}
                    className="glass rounded-pill px-3.5 py-2 text-[13px] font-medium press-spring"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </section>
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Search size={32} style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                Ищите вещи, бренды или категории — или откройте фильтры справа от поиска
              </p>
            </div>
          </div>
        ) : (
          <ItemGrid items={items} loading={loading} emptyLabel={`Ничего не найдено${query.trim() ? ` по запросу «${query}»` : ''}`} />
        )}
      </main>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onApply={(f) => {
          setFilters(f)
          setFilterOpen(false)
        }}
      />
    </div>
  )
}
