export function ProgressRing({ progress, size = 56 }: { progress: number; size?: number }) {
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - Math.min(Math.max(progress, 0), 1) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-primary-green)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 200ms ease' }}
      />
    </svg>
  )
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin-slow rounded-full border-2 border-white/20"
      style={{
        width: size,
        height: size,
        borderTopColor: 'var(--color-primary-green)',
      }}
    />
  )
}
