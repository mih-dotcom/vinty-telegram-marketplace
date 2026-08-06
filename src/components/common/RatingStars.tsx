import { Star } from 'lucide-react'

export function RatingStars({
  rating,
  count,
  size = 13,
}: {
  rating: number
  count?: number
  size?: number
}) {
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className="fill-green-brand text-green-brand" />
      <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {rating.toFixed(1)}
      </span>
      {typeof count === 'number' && (
        <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          ({count})
        </span>
      )}
    </div>
  )
}
