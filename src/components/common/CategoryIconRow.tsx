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
  Wind,
} from 'lucide-react'
import type { Category } from '../../types'

type IconComponent = ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string }>

// lucide-react has no literal "trousers" icon, so this is a small custom
// line icon drawn in the same stroke style (2px, round joins) as the rest.
function PantsIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: {
  size?: number | string
  color?: string
  strokeWidth?: number | string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3v18h3l.5-13M17 3v18h-3l-.5-13M7 3h10" />
    </svg>
  )
}

const ITEMS: { key: Category | 'All'; label: string; icon: IconComponent }[] = [
  { key: 'All', label: 'Все', icon: LayoutGrid },
  { key: 'Обувь', label: 'Обувь', icon: Footprints },
  { key: 'Верхняя одежда', label: 'Верхняя одежда', icon: Wind },
  { key: 'Верх', label: 'Верх', icon: Shirt },
  { key: 'Низ', label: 'Низ', icon: PantsIcon },
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
