export interface ResourceState {
  energy: number
  alloy: number
  crystal: number
  energyRate: number
  alloyRate: number
  crystalRate: number
}

export interface BuildingDef {
  id: string
  name: string
  description: string
  level: number
  /** Production rate per second at the current level, if applicable. */
  productionRate?: { resource: 'energy' | 'alloy' | 'crystal'; amount: number }
  /** Storage capacity, if applicable (Storage Depot). */
  storageCapacity?: number
  cost: { energy?: number; alloy?: number; crystal?: number }
  buildTimeSec: number
  maxLevel: number
}

export const colonyInfo = {
  id: 'kepler-11c',
  name: 'Kepler-11c',
  score: 4820,
}

export const resourceState: ResourceState = {
  energy: 8420,
  alloy: 3190,
  crystal: 1240,
  energyRate: 24.6,
  alloyRate: 11.2,
  crystalRate: 4.8,
}

export const activeConstruction = {
  buildingId: 'fabrication-bay',
  buildingName: 'Fabrication Bay',
  targetLevel: 4,
  startedAtMs: Date.now() - 5 * 60_000,
  etaMs: Date.now() + 20 * 60_000,
}

export const buildings: BuildingDef[] = [
  {
    id: 'command-spire',
    name: 'Command Spire',
    description: 'Seat of colony administration. Governs max building level and queue capacity.',
    level: 6,
    cost: { energy: 2200, alloy: 1400, crystal: 600 },
    buildTimeSec: 480,
    maxLevel: 20,
  },
  {
    id: 'fusion-reactor',
    name: 'Fusion Reactor',
    description: 'Converts raw isotopes into grid Energy. Primary power source for the colony.',
    level: 8,
    productionRate: { resource: 'energy', amount: 24.6 },
    cost: { energy: 1200, alloy: 800 },
    buildTimeSec: 300,
    maxLevel: 30,
  },
  {
    id: 'alloy-foundry',
    name: 'Alloy Foundry',
    description: 'Smelts ore deposits into structural Alloy for construction and fabrication.',
    level: 7,
    productionRate: { resource: 'alloy', amount: 11.2 },
    cost: { energy: 900, alloy: 1100 },
    buildTimeSec: 300,
    maxLevel: 30,
  },
  {
    id: 'crystal-extractor',
    name: 'Crystal Extractor',
    description: 'Draws resonant Crystal from subsurface veins. Feeds research and shipyards.',
    level: 4,
    productionRate: { resource: 'crystal', amount: 4.8 },
    cost: { energy: 1400, crystal: 500 },
    buildTimeSec: 360,
    maxLevel: 30,
  },
  {
    id: 'storage-depot',
    name: 'Storage Depot',
    description: 'Hardened silos that cap resource storage before overflow is lost.',
    level: 5,
    storageCapacity: 25_000,
    cost: { energy: 1000, alloy: 1000 },
    buildTimeSec: 300,
    maxLevel: 25,
  },
  {
    id: 'research-lab',
    name: 'Research Lab',
    description: 'Enables technology research. Higher levels unlock advanced tech tiers.',
    level: 3,
    cost: { energy: 1600, crystal: 900 },
    buildTimeSec: 420,
    maxLevel: 20,
  },
  {
    id: 'fabrication-bay',
    name: 'Fabrication Bay',
    description: 'Produces ground units. Level gates access to heavier unit classes.',
    level: 3,
    cost: { energy: 1800, alloy: 1600 },
    buildTimeSec: 420,
    maxLevel: 20,
  },
  {
    id: 'shipyard',
    name: 'Shipyard',
    description: 'Constructs starships. Level gates access to larger hull classes.',
    level: 2,
    cost: { energy: 2400, alloy: 2000, crystal: 400 },
    buildTimeSec: 540,
    maxLevel: 20,
  },
  {
    id: 'shield-generator',
    name: 'Shield Generator',
    description: 'Projects a defensive envelope over the colony, reducing incoming raid losses.',
    level: 4,
    cost: { energy: 2000, alloy: 1200 },
    buildTimeSec: 360,
    maxLevel: 20,
  },
  {
    id: 'sensor-array',
    name: 'Sensor Array',
    description: 'Long-range detection grid. Extends scan range and incursion warning time.',
    level: 3,
    cost: { energy: 1500, crystal: 700 },
    buildTimeSec: 300,
    maxLevel: 20,
  },
]

export type Faction = 'kessler' | 'obsidian' | 'hollow' | 'bloom'

export interface SectorDef {
  id: string
  name: string
  x: number
  y: number
  faction: Faction
  /** Defence rating out of 100. For Hollow Choir this is only exact once scanned. */
  defense: number
  scanned: boolean
  garrison: { unit: string; count: number }[]
  resourceCache: { energy?: number; alloy?: number; crystal?: number }
  cleared: boolean
}

const FACTION_NAMES: Record<Faction, string> = {
  kessler: 'Kessler Remnant',
  obsidian: 'Obsidian Vanguard',
  hollow: 'Hollow Choir',
  bloom: 'The Bloom',
}

export const factionNames = FACTION_NAMES

export const sectors: SectorDef[] = [
  {
    id: 'sector-04',
    name: 'Ashwreck Drift',
    x: 1,
    y: 1,
    faction: 'kessler',
    defense: 18,
    scanned: true,
    garrison: [
      { unit: 'Salvage Drone', count: 12 },
      { unit: 'Hauler Frame', count: 4 },
    ],
    resourceCache: { energy: 1200, alloy: 2400 },
    cleared: false,
  },
  {
    id: 'sector-11',
    name: 'Cindergate', 
    x: 2,
    y: 0,
    faction: 'obsidian',
    defense: 74,
    scanned: true,
    garrison: [
      { unit: 'War Hull', count: 9 },
      { unit: 'Picket Drone', count: 20 },
    ],
    resourceCache: { energy: 600, alloy: 900, crystal: 300 },
    cleared: false,
  },
  {
    id: 'sector-17',
    name: 'Static Choir Relay',
    x: 0,
    y: 2,
    faction: 'hollow',
    defense: 45,
    scanned: false,
    garrison: [{ unit: 'Signal Warden', count: 6 }],
    resourceCache: { crystal: 3100 },
    cleared: false,
  },
  {
    id: 'sector-23',
    name: 'Deep Verge Node 9',
    x: 3,
    y: 2,
    faction: 'bloom',
    defense: 61,
    scanned: false,
    garrison: [
      { unit: 'Spore Drone', count: 40 },
      { unit: 'Gorger', count: 3 },
    ],
    resourceCache: {},
    cleared: false,
  },
  {
    id: 'sector-02',
    name: 'Hollowmere Wreck',
    x: 0,
    y: 0,
    faction: 'kessler',
    defense: 9,
    scanned: true,
    garrison: [{ unit: 'Salvage Drone', count: 5 }],
    resourceCache: { alloy: 800 },
    cleared: true,
  },
  {
    id: 'sector-29',
    name: 'Ironline Bastion',
    x: 1,
    y: 3,
    faction: 'obsidian',
    defense: 88,
    scanned: true,
    garrison: [
      { unit: 'War Hull', count: 16 },
      { unit: 'Siege Platform', count: 4 },
    ],
    resourceCache: { energy: 1800, alloy: 2200 },
    cleared: false,
  },
  {
    id: 'sector-31',
    name: 'Chorus Wellspring',
    x: 3,
    y: 0,
    faction: 'hollow',
    defense: 52,
    scanned: false,
    garrison: [
      { unit: 'Signal Warden', count: 10 },
      { unit: 'Choir Drone', count: 22 },
    ],
    resourceCache: { crystal: 4200 },
    cleared: false,
  },
  {
    id: 'sector-08',
    name: 'Rimfall Anchorage',
    x: 2,
    y: 3,
    faction: 'kessler',
    defense: 22,
    scanned: true,
    garrison: [{ unit: 'Hauler Frame', count: 8 }],
    resourceCache: { energy: 900, alloy: 1300 },
    cleared: false,
  },
  {
    id: 'sector-14',
    name: 'Deep Verge Node 4',
    x: 0,
    y: 3,
    faction: 'bloom',
    defense: 38,
    scanned: false,
    garrison: [{ unit: 'Spore Drone', count: 24 }],
    resourceCache: {},
    cleared: false,
  },
]
