import { useId } from 'react'

const MIN = 100
const MAX = 500000
const STEP = 100

export function PriceRangeSlider({
  min,
  max,
  onChange,
}: {
  min: number
  max: number
  onChange: (min: number, max: number) => void
}) {
  const id = useId()
  const minPct = ((min - MIN) / (MAX - MIN)) * 100
  const maxPct = ((max - MIN) / (MAX - MIN)) * 100

  return (
    <div className="pt-1 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="glass rounded-pill px-3 py-1.5 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {min.toLocaleString('ru-RU')} ₽
        </div>
        <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          до
        </span>
        <div className="glass rounded-pill px-3 py-1.5 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {max.toLocaleString('ru-RU')} ₽
          {max >= MAX ? '+' : ''}
        </div>
      </div>

      <div className="relative h-6 flex items-center">
        <div className="absolute left-0 right-0 h-1.5 rounded-pill" style={{ background: 'var(--divider)' }} />
        <div
          className="absolute h-1.5 rounded-pill"
          style={{
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
            background: 'var(--color-primary-green)',
          }}
        />
        <input
          id={`${id}-min`}
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max - STEP), max)}
          className="range-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
        />
        <input
          id={`${id}-max`}
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + STEP))}
          className="range-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
        />
      </div>

      <style>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #fff;
          border: 3px solid var(--color-primary-green);
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #fff;
          border: 3px solid var(--color-primary-green);
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
        }
        .range-thumb::-webkit-slider-runnable-track { background: transparent; }
        .range-thumb::-moz-range-track { background: transparent; }
      `}</style>
    </div>
  )
}
