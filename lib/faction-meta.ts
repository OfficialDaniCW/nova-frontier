import { Biohazard, Flag, Radio, Recycle, ShieldAlert, Waypoints } from 'lucide-react'

export type Faction = 'kessler' | 'obsidian' | 'hollow' | 'bloom' | 'unclaimed' | 'concord'

export const FACTION_META: Record<
  Faction,
  {
    label: string
    icon: typeof Recycle
    textClass: string
    borderClass: string
    bgClass: string
    statColor: 'kessler' | 'obsidian' | 'hollow' | 'concord'
  }
> = {
  kessler: {
    label: 'Kessler Remnant',
    icon: Recycle,
    textClass: 'text-kessler',
    borderClass: 'border-kessler/30',
    bgClass: 'bg-kessler/5',
    statColor: 'kessler',
  },
  obsidian: {
    label: 'Obsidian Vanguard',
    icon: ShieldAlert,
    textClass: 'text-obsidian',
    borderClass: 'border-obsidian/30',
    bgClass: 'bg-obsidian/5',
    statColor: 'obsidian',
  },
  hollow: {
    label: 'Hollow Choir',
    icon: Radio,
    textClass: 'text-hollow',
    borderClass: 'border-hollow/30',
    bgClass: 'bg-hollow/5',
    statColor: 'hollow',
  },
  bloom: {
    label: 'The Bloom',
    icon: Biohazard,
    textClass: 'text-bloom',
    borderClass: 'border-bloom/40',
    bgClass: 'bg-bloom/5',
    statColor: 'concord',
  },
  unclaimed: {
    label: 'Unclaimed',
    icon: Waypoints,
    textClass: 'text-text-dim',
    borderClass: 'border-panel-border',
    bgClass: 'bg-slate-950/40',
    statColor: 'concord',
  },
  concord: {
    label: 'Concord Compact',
    icon: Flag,
    textClass: 'text-concord',
    borderClass: 'border-concord/40',
    bgClass: 'bg-concord/5',
    statColor: 'concord',
  },
}
