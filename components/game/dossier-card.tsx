import { cn } from '@/lib/utils'

interface DossierCardProps {
  name: string
  meta: string
  traits: string[]
  about: string
  goal: string
  accentClass: string
  rotateClass: string
  borderClass: string
  className?: string
}

/**
 * Governor persona card, styled as a physical ID card: name, meta line,
 * trait tags, a short bio, and a goal callout. Designed to overlap a
 * sibling card at a slight rotation on wide screens (see DossierRow).
 */
export function DossierCard({
  name,
  meta,
  traits,
  about,
  goal,
  accentClass,
  rotateClass,
  borderClass,
  className,
}: DossierCardProps) {
  return (
    <div
      className={cn(
        'clip-panel-sm w-full border bg-slate-950/85 p-5 sm:absolute sm:w-72',
        borderClass,
        rotateClass,
        className,
      )}
    >
      <h3 className={cn('font-display text-sm font-semibold', accentClass)}>{name}</h3>
      <p className="mt-1 font-mono text-[0.6rem] text-text-faint">{meta}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {traits.map((t) => (
          <span
            key={t}
            className="border border-panel-border px-2 py-0.5 font-mono text-[0.6rem] text-text-dim"
          >
            {t}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[0.7rem] leading-relaxed text-text-dim">{about}</p>
      <p className="mt-2 text-[0.7rem] font-medium text-bloom">Goal: {goal}</p>
    </div>
  )
}
