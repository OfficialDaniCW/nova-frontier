import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * A small "?" affordance that reveals a short mechanic explanation on
 * hover/focus. Used next to controls whose consequence isn't obvious from
 * the label alone (fleet mission buttons, market posting, queue gating).
 */
export function InfoTooltip({
  children,
  label = 'More info',
  className,
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-text-faint transition-colors hover:text-concord focus-visible:text-concord',
          className,
        )}
        aria-label={label}
      >
        <CircleHelp className="size-full" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent className="max-w-64 border-panel-border bg-slate-950 font-mono text-[0.7rem] leading-relaxed text-text">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
