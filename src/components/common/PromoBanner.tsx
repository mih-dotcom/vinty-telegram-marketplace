import { useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'

export interface PromoSlide {
  id: string
  label: string
  title: string
  cta: string
  image: string
  onAction: () => void
}

/**
 * Swipeable "stories"-style promo carousel — full-bleed image cards with a
 * headline + CTA pill, dot pagination like an Instagram story progress bar.
 */
export function PromoBanner({ slides }: { slides: PromoSlide[] }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const el = trackRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActive(Math.min(Math.max(index, 0), slides.length - 1))
  }

  if (slides.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory rounded-card"
      >
        {slides.map((slide) => (
          <button
            key={slide.id}
            onClick={slide.onAction}
            className="relative w-full shrink-0 snap-center h-[168px] rounded-card overflow-hidden press-spring text-left bg-black"
          >
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-75"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)' }}
            />
            <div className="relative h-full flex flex-col justify-center gap-2 px-5 py-5 max-w-[70%]">
              <span
                className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-pill w-fit"
                style={{ background: 'var(--color-primary-green)', color: '#fff' }}
              >
                {slide.label}
              </span>
              <h2 className="text-[22px] font-bold text-white leading-tight">{slide.title}</h2>
              <span
                className="inline-flex items-center gap-1 bg-white text-[13px] font-semibold px-3 py-2 rounded-pill w-fit mt-1"
                style={{ color: '#0b120e' }}
              >
                {slide.cta}
                <ChevronRight size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
          {slides.map((slide, i) => (
            <span
              key={slide.id}
              className="h-1.5 rounded-pill transition-all"
              style={{
                width: i === active ? 16 : 6,
                background: i === active ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
