import { useState } from 'react'
import { Sheet } from '../layout/Sheet'
import { PriceRangeSlider } from './PriceRangeSlider'
import { ChipSelect } from './ChipSelect'
import { ColorSwatches } from './ColorSwatches'
import { FACETS } from '../../services/api'
import type { Condition, ItemFilters } from '../../types'

const SORT_OPTIONS: { value: NonNullable<ItemFilters['sortBy']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'relevant', label: 'Most relevant' },
]

export interface DraftFilters {
  minPrice: number
  maxPrice: number
  sizes: string[]
  conditions: Condition[]
  brands: string[]
  colors: string[]
  sortBy: NonNullable<ItemFilters['sortBy']>
}

export const DEFAULT_DRAFT: DraftFilters = {
  minPrice: 0,
  maxPrice: 200,
  sizes: [],
  conditions: [],
  brands: [],
  colors: [],
  sortBy: 'newest',
}

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

  const toggle = (key: 'sizes' | 'conditions' | 'brands' | 'colors', item: string) => {
    setDraft((d) => {
      const list = d[key] as string[]
      const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
      return { ...d, [key]: next } as DraftFilters
    })
  }

  const filteredBrands = FACETS.brands.filter((b) =>
    b.toLowerCase().includes(brandQuery.toLowerCase())
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex items-center gap-3 pb-1">
          <button
            onClick={() => setDraft(DEFAULT_DRAFT)}
            className="text-[14px] font-semibold press-spring"
            style={{ color: 'var(--text-secondary)' }}
          >
            Clear all
          </button>
          <button
            onClick={() => {
              onApply(draft)
              onClose()
            }}
            className="flex-1 cta-gradient text-white font-bold text-[15px] rounded-pill py-3.5 press-spring shadow-glass"
          >
            Apply filters
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Price range
          </h3>
          <PriceRangeSlider
            min={draft.minPrice}
            max={draft.maxPrice}
            onChange={(min, max) => setDraft((d) => ({ ...d, minPrice: min, maxPrice: max }))}
          />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Size
          </h3>
          <ChipSelect options={FACETS.sizes} selected={draft.sizes} onToggle={(v) => toggle('sizes', v)} />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Condition
          </h3>
          <ChipSelect
            options={FACETS.conditions}
            selected={draft.conditions}
            onToggle={(v) => toggle('conditions', v)}
          />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Brand
          </h3>
          <input
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            placeholder="Search brands..."
            className="glass rounded-pill px-4 py-2 text-[14px] w-full outline-none mb-3 placeholder:opacity-60"
            style={{ color: 'var(--text-primary)' }}
          />
          <ChipSelect options={filteredBrands} selected={draft.brands} onToggle={(v) => toggle('brands', v)} />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Color
          </h3>
          <ColorSwatches selected={draft.colors} onToggle={(v) => toggle('colors', v)} />
        </section>

        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Sort by
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
                      draft.sortBy === opt.value ? 'var(--color-primary-green)' : 'var(--glass-border)',
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
