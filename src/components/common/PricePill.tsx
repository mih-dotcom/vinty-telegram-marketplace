import { formatPrice } from '../../utils/format'

export function PricePill({ price, currency = '$' }: { price: number; currency?: string }) {
  return (
    <span className="cta-gradient text-white text-[13px] font-bold px-2.5 py-1 rounded-pill shadow-glass">
      {formatPrice(price, currency)}
    </span>
  )
}

export function SoldBadge() {
  return (
    <span className="bg-black/70 text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-pill backdrop-blur-sm">
      Sold
    </span>
  )
}
