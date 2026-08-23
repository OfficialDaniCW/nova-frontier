import { Flame, Sparkles, Leaf, Swords, type LucideIcon } from 'lucide-react'
import type { Faction } from '@/lib/faction-meta'

/**
 * Creed & Allegiance definitions.
 *
 * A governor may pledge a political **Allegiance** to an NPC faction (passive
 * bonus + Zeal/Dissent combat modifiers) and adopt a spiritual **Creed** (a
 * religion powered by the Devotion resource and a tree of purchasable
 * Doctrines). Both feed multiplicative modifiers into the real-time economy and
 * combat loop via `creedModifiers` / `allegianceModifiers`.
 */

export type CreedId = 'ember' | 'void' | 'verdant' | 'iron'

// The multiplier bundle every creed/doctrine/allegiance contributes. All values
// are 1-based multipliers (1 = no effect) except additive combat deltas.
export interface Modifiers {
  energyMult: number
  alloyMult: number
  crystalMult: number
  devotionMult: number
  fleetAttackMult: number
  fleetDefenseMult: number
  bloomResistMult: number
  shipTimeMult: number
}

export function emptyModifiers(): Modifiers {
  return {
    energyMult: 1,
    alloyMult: 1,
    crystalMult: 1,
    devotionMult: 1,
    fleetAttackMult: 1,
    fleetDefenseMult: 1,
    bloomResistMult: 1,
    shipTimeMult: 1,
  }
}

export type DoctrineEffect = Partial<Omit<Modifiers, never>>

export interface DoctrineDef {
  id: string
  name: string
  description: string
  maxLevel: number
  baseCost: number // Devotion for level 1
  costGrowth: number // multiplier per level
  /** Per-level effect. Multipliers are applied as (1 + (mult-1) * level). */
  effectPerLevel: DoctrineEffect
}

export interface CreedDef {
  id: CreedId
  name: string
  epithet: string
  description: string
  icon: LucideIcon
  /** Tailwind text color token used across the creed UI. */
  colorClass: string
  borderClass: string
  bgClass: string
  /** Signature passive granted just for adopting the creed. */
  signature: DoctrineEffect
  signatureLabel: string
  doctrines: DoctrineDef[]
}

export const CREEDS: CreedDef[] = [
  {
    id: 'ember',
    name: 'Ember Communion',
    epithet: 'The Forgefaithful',
    description:
      'Industry as worship. The Ember Communion tends the great foundries, believing alloy poured is prayer answered.',
    icon: Flame,
    colorClass: 'text-obsidian',
    borderClass: 'border-obsidian/40',
    bgClass: 'bg-obsidian/5',
    signature: { alloyMult: 1.1 },
    signatureLabel: '+10% Alloy output',
    doctrines: [
      {
        id: 'ember-foundry-rites',
        name: 'Foundry Rites',
        description: 'Ritualized smelting cadence lifts alloy yield.',
        maxLevel: 5,
        baseCost: 120,
        costGrowth: 1.6,
        effectPerLevel: { alloyMult: 1.06 },
      },
      {
        id: 'ember-tempered-hulls',
        name: 'Tempered Hulls',
        description: 'Blessed metallurgy speeds ship construction.',
        maxLevel: 5,
        baseCost: 160,
        costGrowth: 1.6,
        effectPerLevel: { shipTimeMult: 0.95 },
      },
      {
        id: 'ember-wrath-of-the-forge',
        name: 'Wrath of the Forge',
        description: 'Weapons quenched in sacred fire strike harder.',
        maxLevel: 5,
        baseCost: 200,
        costGrowth: 1.65,
        effectPerLevel: { fleetAttackMult: 1.05 },
      },
      {
        id: 'ember-eternal-flame',
        name: 'Eternal Flame',
        description: 'A perpetual pyre deepens the colony\u2019s devotion.',
        maxLevel: 4,
        baseCost: 260,
        costGrowth: 1.7,
        effectPerLevel: { devotionMult: 1.08 },
      },
    ],
  },
  {
    id: 'void',
    name: 'Void Choir',
    epithet: 'The Listeners',
    description:
      'Knowledge drawn from the silence between stars. The Void Choir hears meaning in the dark and refines it into crystal-clear insight.',
    icon: Sparkles,
    colorClass: 'text-hollow',
    borderClass: 'border-hollow/40',
    bgClass: 'bg-hollow/5',
    signature: { crystalMult: 1.1 },
    signatureLabel: '+10% Crystal output',
    doctrines: [
      {
        id: 'void-resonant-veins',
        name: 'Resonant Veins',
        description: 'Attuned extractors coax more crystal from the deep.',
        maxLevel: 5,
        baseCost: 120,
        costGrowth: 1.6,
        effectPerLevel: { crystalMult: 1.06 },
      },
      {
        id: 'void-silent-insight',
        name: 'Silent Insight',
        description: 'Meditative computation multiplies research crystal.',
        maxLevel: 5,
        baseCost: 170,
        costGrowth: 1.6,
        effectPerLevel: { crystalMult: 1.04, devotionMult: 1.04 },
      },
      {
        id: 'void-hymn-of-focus',
        name: 'Hymn of Focus',
        description: 'Harmonized crews channel more power to the grid.',
        maxLevel: 5,
        baseCost: 200,
        costGrowth: 1.65,
        effectPerLevel: { energyMult: 1.05 },
      },
      {
        id: 'void-echoing-chant',
        name: 'Echoing Chant',
        description: 'The Choir\u2019s endless hymn amplifies devotion.',
        maxLevel: 4,
        baseCost: 260,
        costGrowth: 1.7,
        effectPerLevel: { devotionMult: 1.1 },
      },
    ],
  },
  {
    id: 'verdant',
    name: 'Verdant Path',
    epithet: 'The Cultivators',
    description:
      'Life as the highest law. The Verdant Path terraforms and tends, holding that a colony must grow like a garden — and resist the Bloom that would choke it.',
    icon: Leaf,
    colorClass: 'text-concord',
    borderClass: 'border-concord/40',
    bgClass: 'bg-concord/5',
    signature: { energyMult: 1.1 },
    signatureLabel: '+10% Energy output',
    doctrines: [
      {
        id: 'verdant-living-grid',
        name: 'Living Grid',
        description: 'Bio-integrated reactors raise energy output.',
        maxLevel: 5,
        baseCost: 120,
        costGrowth: 1.6,
        effectPerLevel: { energyMult: 1.06 },
      },
      {
        id: 'verdant-warding-groves',
        name: 'Warding Groves',
        description: 'Cultivated flora hardens the colony against Bloom spread.',
        maxLevel: 5,
        baseCost: 160,
        costGrowth: 1.6,
        effectPerLevel: { bloomResistMult: 1.12 },
      },
      {
        id: 'verdant-rite-of-renewal',
        name: 'Rite of Renewal',
        description: 'Seasonal rites deepen the faithful\u2019s devotion.',
        maxLevel: 5,
        baseCost: 200,
        costGrowth: 1.65,
        effectPerLevel: { devotionMult: 1.08 },
      },
      {
        id: 'verdant-abundance',
        name: 'Abundance',
        description: 'A thriving biosphere lifts every harvest a little.',
        maxLevel: 4,
        baseCost: 280,
        costGrowth: 1.7,
        effectPerLevel: { energyMult: 1.03, alloyMult: 1.03, crystalMult: 1.03 },
      },
    ],
  },
  {
    id: 'iron',
    name: 'Iron Creed',
    epithet: 'The Bulwark',
    description:
      'Discipline and the shield-wall. The Iron Creed holds that faith is proven in battle and that a defended people is a devout one.',
    icon: Swords,
    colorClass: 'text-kessler',
    borderClass: 'border-kessler/40',
    bgClass: 'bg-kessler/5',
    signature: { fleetDefenseMult: 1.12 },
    signatureLabel: '+12% Fleet defense',
    doctrines: [
      {
        id: 'iron-shieldwall',
        name: 'Shield-Wall Doctrine',
        description: 'Drilled formations absorb more incoming fire.',
        maxLevel: 5,
        baseCost: 140,
        costGrowth: 1.6,
        effectPerLevel: { fleetDefenseMult: 1.06 },
      },
      {
        id: 'iron-warpriest',
        name: 'War-Priest Cadre',
        description: 'Zealot officers push fleets to strike harder.',
        maxLevel: 5,
        baseCost: 180,
        costGrowth: 1.65,
        effectPerLevel: { fleetAttackMult: 1.06 },
      },
      {
        id: 'iron-spoils-of-faith',
        name: 'Spoils of Faith',
        description: 'Consecrated raids yield more alloy salvage.',
        maxLevel: 5,
        baseCost: 200,
        costGrowth: 1.65,
        effectPerLevel: { alloyMult: 1.05 },
      },
      {
        id: 'iron-martial-devotion',
        name: 'Martial Devotion',
        description: 'The warrior\u2019s discipline is itself an act of worship.',
        maxLevel: 4,
        baseCost: 260,
        costGrowth: 1.7,
        effectPerLevel: { devotionMult: 1.08 },
      },
    ],
  },
]

export function getCreed(id: string | null | undefined): CreedDef | undefined {
  if (!id) return undefined
  return CREEDS.find((c) => c.id === id)
}

export function getDoctrine(id: string): { creed: CreedDef; doctrine: DoctrineDef } | undefined {
  for (const creed of CREEDS) {
    const doctrine = creed.doctrines.find((d) => d.id === id)
    if (doctrine) return { creed, doctrine }
  }
  return undefined
}

export function doctrineCostAtLevel(def: DoctrineDef, targetLevel: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, targetLevel - 1))
}

// --- Allegiance -----------------------------------------------------------

/** Factions a governor can pledge to (NPC powers). */
export const PLEDGEABLE_FACTIONS: Faction[] = ['concord', 'obsidian', 'kessler', 'hollow']

/** Rival map — attacking your rival triggers Zeal; attacking your own faction triggers Dissent. */
export const FACTION_RIVAL: Partial<Record<Faction, Faction>> = {
  concord: 'obsidian',
  obsidian: 'concord',
  kessler: 'hollow',
  hollow: 'kessler',
}

// Passive economic/combat bonus granted just for pledging to a faction.
export const ALLEGIANCE_SIGNATURE: Record<string, { label: string; effect: DoctrineEffect }> = {
  concord: { label: '+8% Energy output', effect: { energyMult: 1.08 } },
  obsidian: { label: '+8% Fleet attack', effect: { fleetAttackMult: 1.08 } },
  kessler: { label: '+8% Alloy output', effect: { alloyMult: 1.08 } },
  hollow: { label: '+8% Crystal output', effect: { crystalMult: 1.08 } },
}

export const ZEAL_ATTACK_BONUS = 0.15 // +15% attack vs your rival's holdings
export const DISSENT_ATTACK_PENALTY = 0.2 // -20% attack vs your own faction's holdings

function applyEffect(mods: Modifiers, effect: DoctrineEffect, level: number) {
  for (const [key, value] of Object.entries(effect) as [keyof Modifiers, number][]) {
    // Multipliers compound per level: (1 + (value - 1) * level).
    const perLevel = 1 + (value - 1) * level
    mods[key] *= perLevel
  }
}

/**
 * Compute the combined economic/fleet modifiers from a governor's creed +
 * unlocked doctrines + allegiance signature. Combat *situational* modifiers
 * (Zeal/Dissent) are handled separately by `allegianceCombatMultiplier`.
 */
export function creedModifiers(
  creedId: string | null | undefined,
  doctrineLevels: { doctrineId: string; level: number }[],
  allegiance: string | null | undefined,
): Modifiers {
  const mods = emptyModifiers()

  const creed = getCreed(creedId)
  if (creed) {
    applyEffect(mods, creed.signature, 1)
    for (const row of doctrineLevels) {
      if (row.level <= 0) continue
      const match = creed.doctrines.find((d) => d.id === row.doctrineId)
      if (match) applyEffect(mods, match.effectPerLevel, row.level)
    }
  }

  if (allegiance && ALLEGIANCE_SIGNATURE[allegiance]) {
    applyEffect(mods, ALLEGIANCE_SIGNATURE[allegiance].effect, 1)
  }

  return mods
}

/**
 * Situational attack multiplier applied when a governor with an allegiance
 * attacks a sector of a given faction. Returns { mult, kind } where kind is
 * 'zeal' | 'dissent' | null for UI messaging.
 */
export function allegianceCombatMultiplier(
  allegiance: string | null | undefined,
  targetFaction: string | null | undefined,
): { mult: number; kind: 'zeal' | 'dissent' | null } {
  if (!allegiance || !targetFaction) return { mult: 1, kind: null }
  if (targetFaction === allegiance) return { mult: 1 - DISSENT_ATTACK_PENALTY, kind: 'dissent' }
  if (FACTION_RIVAL[allegiance as Faction] === targetFaction) {
    return { mult: 1 + ZEAL_ATTACK_BONUS, kind: 'zeal' }
  }
  return { mult: 1, kind: null }
}
