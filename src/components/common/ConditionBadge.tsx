import type { Condition } from '../../types'

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <span
      className="glass text-[12px] font-semibold px-3 py-1.5 rounded-pill"
      style={{ color: 'var(--text-primary)' }}
    >
      {condition}
    </span>
  )
}

export function InfoChip({ label }: { label: string }) {
  return (
    <span
      className="glass text-[12px] font-medium px-3 py-1.5 rounded-pill"
      style={{ color: 'var(--text-secondary)' }}
    >
      {label}
    </span>
  )
}
