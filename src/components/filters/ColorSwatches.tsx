import { FACETS } from '../../services/api'
import { Check } from 'lucide-react'

export function ColorSwatches({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {FACETS.colors.map(({ name, hex }) => {
        const active = selected.includes(name)
        return (
          <button
            key={name}
            onClick={() => onToggle(name)}
            aria-label={name}
            title={name}
            className="press-spring w-9 h-9 rounded-full flex items-center justify-center border"
            style={{
              backgroundColor: hex,
              borderColor: active ? 'var(--color-primary-green)' : 'var(--surface-border)',
              borderWidth: active ? 2 : 1,
            }}
          >
            {active && (
              <Check
                size={16}
                color={hex === '#FFFFFF' || hex === '#E4D4B4' || hex === '#FACC15' ? '#111' : '#fff'}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
