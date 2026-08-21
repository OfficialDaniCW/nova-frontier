import { db } from '@/lib/db'
import { sectors } from '@/lib/db/schema'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

const SEED_SECTORS = [
  { name: 'Ashwreck Drift', faction: 'kessler', garrisonStrength: 18, positionX: 1, positionY: 1, energyReward: 1200, alloyReward: 2400, crystalReward: 0 },
  { name: 'Cindergate', faction: 'obsidian', garrisonStrength: 74, positionX: 2, positionY: 0, energyReward: 600, alloyReward: 900, crystalReward: 300 },
  { name: 'Static Choir Relay', faction: 'hollow', garrisonStrength: 45, positionX: 0, positionY: 2, energyReward: 0, alloyReward: 0, crystalReward: 3100 },
  { name: 'Deep Verge Node 9', faction: 'bloom', garrisonStrength: 61, positionX: 3, positionY: 2, energyReward: 0, alloyReward: 0, crystalReward: 0 },
  { name: 'Hollowmere Wreck', faction: 'kessler', garrisonStrength: 0, positionX: 0, positionY: 0, energyReward: 0, alloyReward: 800, crystalReward: 0 },
  { name: 'Ironline Bastion', faction: 'obsidian', garrisonStrength: 88, positionX: 1, positionY: 3, energyReward: 1800, alloyReward: 2200, crystalReward: 0 },
  { name: 'Chorus Wellspring', faction: 'hollow', garrisonStrength: 52, positionX: 3, positionY: 0, energyReward: 0, alloyReward: 0, crystalReward: 4200 },
  { name: 'Rimfall Anchorage', faction: 'kessler', garrisonStrength: 22, positionX: 2, positionY: 3, energyReward: 900, alloyReward: 1300, crystalReward: 0 },
  { name: 'Deep Verge Node 4', faction: 'bloom', garrisonStrength: 38, positionX: 0, positionY: 3, energyReward: 0, alloyReward: 0, crystalReward: 0 },
  { name: 'Kessler Anchor Point', faction: 'kessler', garrisonStrength: 9, positionX: 2, positionY: 1, energyReward: 500, alloyReward: 700, crystalReward: 0 },
] as const

/** Idempotent: seeds the shared galaxy sector map if it hasn't been created yet. */
export async function ensureGalaxySeeded() {
  const existing = await db.select({ id: sectors.id }).from(sectors).limit(1)
  if (existing.length > 0) return

  for (const s of SEED_SECTORS) {
    await db.insert(sectors).values({
      id: newId('sec'),
      name: s.name,
      faction: s.faction,
      sectorType: 'outpost',
      garrisonStrength: s.garrisonStrength,
      bloomIntensity: s.faction === 'bloom' ? 20 : 0,
      ownerColonyId: null,
      ownerUserId: null,
      energyReward: s.energyReward,
      alloyReward: s.alloyReward,
      crystalReward: s.crystalReward,
      positionX: s.positionX,
      positionY: s.positionY,
    })
  }
}
