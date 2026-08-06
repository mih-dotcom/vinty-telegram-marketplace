import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  strong?: boolean
  rounded?: string
  interactive?: boolean
}

export function GlassCard({
  children,
  strong,
  rounded = 'rounded-card',
  interactive,
  className = '',
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={`${strong ? 'glass-strong' : 'glass'} ${rounded} ${
        interactive ? 'press-spring cursor-pointer' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
