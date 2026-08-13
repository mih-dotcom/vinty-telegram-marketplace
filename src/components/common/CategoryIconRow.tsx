import type { ComponentType } from 'react'
import {
  Baby,
  Briefcase,
  Footprints,
  Gem,
  HeartPulse,
  LayoutGrid,
  PawPrint,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
} from 'lucide-react'
import type { Category } from '../../types'

type IconComponent = ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string }>

const ITEMS: { key: Category | 'All'; label: string; icon: IconComponent }[] = [
  { key: 'All', label: 'Все', icon: LayoutGrid },
  { key: 'Одежда', label: 'Одежда', icon: Shirt },
  { key: 'Обувь', label: 'Обувь', icon: Footprints },
  { key: 'Аксессуары', label: 'Аксессуары', icon: Gem },
  { key: 'Питомцы', label: 'Питомцы', icon: PawPrint },
  { key: 'Дети', label: 'Дети', icon: Baby },
  { key: 'Электроника и бытовая техника', label: 'Электроника', icon: Smartphone },
  { key: 'Товары для дома и дачи', label: 'Дом и дача', icon: Sofa },
  { key: 'Красота и здоровье', label: 'Красота', icon: HeartPulse },
  { key: 'Продукты питания', label: 'Продукты', icon: ShoppingBasket },
  { key: 'Услуги репетиторов и поиск персонала', label: 'Услуги', icon: Briefcase },
]

export function CategoryIconRow({
  active,
  onSelect,
}: {
  active: Category | 'All'
  onSelect: (c: Category | 'All') => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
          Категории
        </h2>
        <button
          onClick={() => onSelect('All')}
          className="text-[13px] font-semibold press-spring"
          style={{ color: 'var(--color-primary-green)' }}
        >
          Все ›
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 -mx-4">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="flex flex-col items-center gap-1.5 shrink-0 press-spring w-16"
            >
              <span
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: isActive ? 'var(--color-primary-green)' : 'var(--surface-alt)',
                }}
              >
                <Icon size={22} color={isActive ? '#fff' : 'var(--text-secondary)'} strokeWidth={2} />
              </span>
              <span
                className="text-[11px] font-medium text-center leading-tight"
                style={{ color: isActive ? 'var(--color-primary-green)' : 'var(--text-secondary)' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
