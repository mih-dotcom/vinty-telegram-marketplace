export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly T[]
  active: T
  onChange: (tab: T) => void
}) {
  return (
    <div className="glass rounded-pill p-1 flex gap-1">
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex-1 press-spring rounded-pill py-2 text-[12.5px] font-semibold transition-colors ${
              isActive ? 'cta-gradient text-white' : ''
            }`}
            style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}
