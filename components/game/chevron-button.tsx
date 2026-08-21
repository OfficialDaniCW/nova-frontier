'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const chevronButtonVariants = cva(
  cn(
    'group relative inline-flex items-center justify-center gap-2 clip-chevron px-4 py-2',
    'border font-display text-xs font-semibold uppercase tracking-wide transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ),
  {
    variants: {
      variant: {
        concord:
          'border-panel-border bg-slate-950/70 text-concord hover:border-concord hover:text-concord hover:shadow-[0_0_18px_-4px_var(--concord)] active:bg-concord active:text-slate-950 active:border-concord',
        alloy:
          'border-panel-border bg-slate-950/70 text-alloy hover:border-alloy hover:text-alloy hover:shadow-[0_0_18px_-4px_var(--alloy)] active:bg-alloy active:text-slate-950 active:border-alloy',
        crystal:
          'border-panel-border bg-slate-950/70 text-crystal hover:border-crystal hover:text-crystal hover:shadow-[0_0_18px_-4px_var(--crystal)] active:bg-crystal active:text-slate-950 active:border-crystal',
        obsidian:
          'border-panel-border bg-slate-950/70 text-obsidian hover:border-obsidian hover:text-obsidian hover:shadow-[0_0_18px_-4px_var(--obsidian)] active:bg-obsidian active:text-slate-950 active:border-obsidian',
        bloom:
          'border-panel-border bg-slate-950/70 text-bloom hover:border-bloom hover:text-bloom hover:shadow-[0_0_18px_-4px_var(--bloom)] active:bg-bloom active:text-slate-950 active:border-bloom',
      },
      size: {
        default: 'h-10 text-xs',
        sm: 'h-8 px-3 text-[0.65rem]',
        lg: 'h-11 px-6 text-sm',
      },
    },
    defaultVariants: {
      variant: 'concord',
      size: 'default',
    },
  },
)

export interface ChevronButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>,
    VariantProps<typeof chevronButtonVariants> {
  className?: string
  children: ReactNode
  /** Locked/gated state: shows a lock icon and disables interaction. */
  locked?: boolean
  /** Optional reason shown as a title attribute when locked. */
  lockedReason?: string
}

/**
 * The primary Nova Frontier CTA: an asymmetric single-corner chamfer
 * (tab-chevron) shape with four distinct visual states — default, hover
 * (coloured border + glow + hazard stripe), active/clicked (solid fill),
 * and locked (muted, lock icon, disabled).
 */
export function ChevronButton({
  variant,
  size,
  className,
  children,
  locked = false,
  lockedReason,
  disabled,
  ...props
}: ChevronButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || locked}
      title={locked ? lockedReason : undefined}
      className={cn(chevronButtonVariants({ variant, size }), className)}
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 hazard-stripe group-hover:opacity-[0.12] group-active:opacity-0"
        aria-hidden="true"
      />
      {locked ? <Lock className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="relative">{children}</span>
    </button>
  )
}
