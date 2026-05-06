import { cn } from '@/lib/utils'
import type { UrgencyLevel } from '@/lib/types'

const urgencyConfig: Record<UrgencyLevel, { label: string; classes: string }> = {
  critical: { label: 'Critical', classes: 'bg-red-500/10 text-red-400 border-red-500/25 ring-red-500/20' },
  high:     { label: 'High',     classes: 'bg-amber-500/10 text-amber-400 border-amber-500/25 ring-amber-500/20' },
  medium:   { label: 'Medium',   classes: 'bg-blue-500/10 text-blue-400 border-blue-500/25 ring-blue-500/20' },
  low:      { label: 'Low',      classes: 'bg-slate-500/10 text-slate-400 border-slate-500/25 ring-slate-500/20' },
}

export function UrgencyBadge({
  urgency,
  size = 'sm',
  className,
}: {
  urgency: UrgencyLevel
  size?: 'xs' | 'sm'
  className?: string
}) {
  const config = urgencyConfig[urgency]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-medium',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  )
}
