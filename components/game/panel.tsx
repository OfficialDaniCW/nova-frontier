import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  children: ReactNode
  className?: string
  /** Render the faint interior grid texture fill. */
  grid?: boolean
  /** Render the animated scanline overlay. */
  scanline?: boolean
  /** Use the smaller corner-clip radius. */
  size?: 'default' | 'sm'
  as?: 'div' | 'section' | 'article'
}

/**
 * The default Nova Frontier surface: an angular clipped-corner panel with a
 * translucent slate fill, hairline border, and optional interior grid
 * texture / scanline animation. This is the base shape for every card,
 * header, and readout in the app.
 */
export function Panel({
  children,
  className,
  grid = false,
  scanline = false,
  size = 'default',
  as: Tag = 'div',
}: PanelProps) {
  return (
    <Tag
      className={cn(
        'relative border border-panel-border bg-panel',
        size === 'default' ? 'clip-panel' : 'clip-panel-sm',
        scanline && 'scanline-overlay',
        className,
      )}
    >
      {grid && (
        <div className="pointer-events-none absolute inset-0 grid-texture" aria-hidden="true" />
      )}
      <div className="relative">{children}</div>
    </Tag>
  )
}
