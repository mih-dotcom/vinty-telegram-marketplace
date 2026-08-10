import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Item } from '../../types'
import { PricePill, SoldBadge } from '../common/PricePill'
import { useApp } from '../../context/AppContext'

export function ItemCard({ item }: { item: Item }) {
  const navigate = useNavigate()
  const { isFavorited, toggleFavorite } = useApp()
  const favorited = isFavorited(item.id)

  return (
    <div
      onClick={() => navigate(`/item/${item.id}`)}
      className="glass rounded-card overflow-hidden press-spring cursor-pointer animate-pop-in"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <img
          src={item.images[0]}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(item)
          }}
          aria-label="В избранное"
          className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center press-spring"
        >
          <Heart
            size={16}
            className={favorited ? 'fill-green-brand text-green-brand' : 'text-white'}
            strokeWidth={2}
          />
        </button>
        <div className="absolute bottom-2 left-2">
          {item.sold ? <SoldBadge /> : <PricePill price={item.price} currency={item.currency} />}
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {item.title}
        </p>
        <p className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
          {item.brand} · {item.size}
        </p>
      </div>
    </div>
  )
}
