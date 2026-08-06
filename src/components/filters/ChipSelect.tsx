export function ChipSelect<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: readonly T[]
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`press-spring rounded-pill px-3.5 py-2 text-[13px] font-semibold ${
              active ? 'cta-gradient text-white' : 'glass'
            }`}
            style={!active ? { color: 'var(--text-secondary)' } : undefined}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
