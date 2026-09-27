import { Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/truenorthtech'

interface CoffeeButtonProps {
  variant?: 'solid' | 'ghost'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Nova Frontier is a free, one-person project. This link is the only ask
 * anywhere in the app — kept quiet and consistent wherever it appears.
 */
export function CoffeeButton({ variant = 'ghost', size = 'md', className }: CoffeeButtonProps) {
  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'clip-chevron-sm inline-flex items-center gap-2 border font-display uppercase tracking-wide transition-colors',
        size === 'sm' ? 'px-2.5 py-1.5 text-[0.65rem]' : 'px-4 py-2 text-xs',
        variant === 'solid'
          ? 'border-devotion/60 bg-devotion/15 text-devotion hover:bg-devotion/25'
          : 'border-panel-border bg-slate-950/60 text-text-dim hover:border-devotion/50 hover:text-devotion',
        className,
      )}
    >
      <Coffee className={size === 'sm' ? 'size-3' : 'size-3.5'} strokeWidth={1.5} aria-hidden="true" />
      Buy me a coffee
    </a>
  )
}
