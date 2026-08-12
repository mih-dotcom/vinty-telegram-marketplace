import { useEffect, useState } from 'react'
import { Sheet } from '../layout/Sheet'
import { PriceRangeSlider } from './PriceRangeSlider'
import { ChipSelect } from './ChipSelect'
import { FACETS, searchBrands } from '../../services/api'
import type { Category, Condition, Gender, ItemFilters } from '../../types'

const SORT_OPTIONS: { value: NonNullable<ItemFilters['sortBy']>; label: string }[] = [
  { value: 'newest', label: 'По дате' },
  { value: 'price_low', label: 'Дешевле' },
  { value: 'price_high', label: 'Дороже' },
]

const CATEGORY_OPTIONS: { value: Category | 'All'; label: string }[] = [
  { value: 'All', label: 'Все' },
  ...FACETS.categories.map((c) => ({ value: c as Category | 'All', label: c })),
]

export interface DraftFilters {
  category: Category | 'All'
  subcategories: string[]
  genders: Gender[]
  minPrice: number
  maxPrice: number
  sizes: string[]
  conditions: Condition[]
  brands: string[]
  colors: string[]
  sortBy: NonNullable<ItemFilters['sortBy']>
}

export const DEFAULT_DRAFT: DraftFilters = {
  category: 'All',
  subcategories: [],
  genders: [],
  minPrice: FACETS.minPrice,
  maxPrice: FACETS.maxPrice,
  sizes: [],
  conditions: [],
  brands: [],
  colors: [],
  sortBy: 'newest',
}

type MultiKey = 'subcategories' | 'genders' | 'sizes' | 'conditions' | 'brands' | 'colors'

export function FilterSheet({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean
  onClose: () => void
  value: DraftFilters
  onApply: (filters: DraftFilters) => void
}) {
  const [draft, setDraft] = useState<DraftFilters>(value)
  const [brandQuery, setBrandQuery] = useState('')

  const toggle = (key: MultiKey, item: string) => {
    setDraft((d) => {
      const list = d[key] as string[]
      const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
      return { ...d, [key]: next } as DraftFilters
    })
  }

  const setCategory = (category: Category | 'All') => {
    setDraft((d) => ({ ...d, category, subcategories: [], sizes: [] }))
  }

  const [filteredBrands, setFilteredBrands] = useState<string[]>([])
  useEffect(() => {
    let cancelled = false
    const handle = setTimeout(() => {
      searchBrands(brandQuery).then((results) => {
        if (!cancelled) setFilteredBrands(results)
      })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [brandQuery])

  const subcategoryOptions =
    draft.category !== 'All' ? FACETS.subcategoriesByCategory[draft.category] : []

  const sizeOptions =
    draft.category !== 'All' ? FACETS.sizesByCategory[draft.category] : FACETS.sizes

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Фильтры"
      footer={
        <div className="flex items-center gap-3 pb-1">
          <button
            onClick={() => setDraft(DEFAULT_DRAFT)}
            className="text-[14px] font-semibold press-spring"
            style={{ color: 'var(--text-secondary)' }}
          >
            Очистить всё
          </button>
          <button
            onClick={() => {
              onApply(draft)
              onClose()
            }}
            className="flex-1 cta-gradient text-white font-bold text-[15px] rounded-pill py-3.5 press-spring shadow-glass"
          >
            Применить фильтры
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Пол
          </h3>
          <ChipSelect
            options={FACETS.genders}
            selected={draft.genders}
            onToggle={(v) => toggle('genders', v)}
          />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Категория
          </h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const active = draft.category === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className="press-spring rounded-pill px-3.5 py-2 text-[13px] font-semibold"
                  style={{
                    background: active ? 'var(--color-primary-green)' : 'var(--surface)',
                    color: active ? '#fff' : 'var(--text-primary)',
                    border: active ? 'none' : '1px solid var(--surface-border)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>

        {subcategoryOptions.length > 0 && (
          <section>
            <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Подкатегория
            </h3>
            <ChipSelect
              options={subcategoryOptions}
              selected={draft.subcategories}
              onToggle={(v) => toggle('subcategories', v)}
            />
          </section>
        )}

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Цена
          </h3>
          <PriceRangeSlider
            min={draft.minPrice}
            max={draft.maxPrice}
            onChange={(min, max) => setDraft((d) => ({ ...d, minPrice: min, maxPrice: max }))}
          />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Размер
          </h3>
          <ChipSelect options={sizeOptions} selected={draft.sizes} onToggle={(v) => toggle('sizes', v)} />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Состояние вещи
          </h3>
          <ChipSelect
            options={FACETS.conditions}
            selected={draft.conditions}
            onToggle={(v) => toggle('conditions', v)}
          />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Бренд
          </h3>
          <input
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            placeholder="Поиск по бренду..."
            className="glass rounded-pill px-4 py-2 text-[14px] w-full outline-none mb-3 placeholder:opacity-60"
            style={{ color: 'var(--text-primary)' }}
          />
          <ChipSelect options={filteredBrands} selected={draft.brands} onToggle={(v) => toggle('brands', v)} />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Сортировка
          </h3>
          <div className="flex flex-col gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDraft((d) => ({ ...d, sortBy: opt.value }))}
                className="flex items-center justify-between glass rounded-2xl px-4 py-3 press-spring"
              >
                <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {opt.label}
                </span>
                <span
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor:
                      draft.sortBy === opt.value ? 'var(--color-primary-green)' : 'var(--surface-border)',
                  }}
                >
                  {draft.sortBy === opt.value && (
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary-green)' }} />
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  )
}
