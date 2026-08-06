import { useEffect, useState } from 'react'
import { SearchBar } from '../components/common/SearchBar'
import { ItemGrid } from '../components/item/ItemGrid'
import { FACETS, getItems } from '../services/api'
import type { Item } from '../types'
import { Search } from 'lucide-react'

const RECENT_KEY = 'vinty_recent_searches'

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

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>(loadRecent())

  useEffect(() => {
    if (!query.trim()) {
      setItems([])
      return
    }
    setLoading(true)
    const handle = setTimeout(() => {
      getItems({ query, pageSize: 20 }).then((res) => {
        setItems(res.items)
        setLoading(false)
        commitSearch(query)
      })
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const commitSearch = (term: string) => {
    if (!term.trim()) return
    const next = [term, ...recent.filter((r) => r !== term)]
    setRecent(next)
    saveRecent(next)
  }

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 glass safe-top px-4 pb-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          autoFocus
          placeholder="Search items, brands, categories..."
        />
      </header>

      <main className="px-4 pt-4">
        {!query.trim() ? (
          <div className="flex flex-col gap-6">
            {recent.length > 0 && (
              <section>
                <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Recent searches
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
                Popular brands
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
                Search for items, brands, or categories
              </p>
            </div>
          </div>
        ) : (
          <ItemGrid items={items} loading={loading} emptyLabel={`No results for "${query}"`} />
        )}
      </main>
    </div>
  )
}
