import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Factory,
  FlaskConical,
  Gem,
  Layers,
  Rocket,
  Satellite,
  ShieldCheck,
  Warehouse,
  Zap,
  Atom,
  Cpu,
  Radiation,
  Telescope,
  Swords,
  Shield,
} from 'lucide-react'

export type Resource = 'energy' | 'alloy' | 'crystal'
export type Cost = Partial<Record<Resource, number>>

// --- Buildings ---------------------------------------------------------

export interface BuildingDef {
  id: string
  name: string
  description: string
  icon: LucideIcon
  maxLevel: number
  baseCost: Cost
  costGrowth: number // multiplier per level
  baseBuildTimeSec: number
  buildTimeGrowth: number
  /** Production rate per second at level 1, if applicable, scaling linearly with level. */
  productionPerLevel?: { resource: Resource; amount: number }
  storagePerLevel?: number
}

export const BUILDING_DEFS: BuildingDef[] = [
  {
    id: 'command-spire',
    name: 'Command Spire',
    description: 'Seat of colony administration. Governs max building level and queue capacity.',
    icon: Building2,
    maxLevel: 20,
    baseCost: { energy: 2200, alloy: 1400, crystal: 600 },
    costGrowth: 1.55,
    baseBuildTimeSec: 480,
    buildTimeGrowth: 1.35,
  },
  {
    id: 'fusion-reactor',
    name: 'Fusion Reactor',
    description: 'Converts raw isotopes into grid Energy. Primary power source for the colony.',
    icon: Zap,
    maxLevel: 30,
    baseCost: { energy: 1200, alloy: 800 },
    costGrowth: 1.5,
    baseBuildTimeSec: 300,
    buildTimeGrowth: 1.3,
    productionPerLevel: { resource: 'energy', amount: 3.2 },
  },
  {
    id: 'alloy-foundry',
    name: 'Alloy Foundry',
    description: 'Smelts ore deposits into structural Alloy for construction and fabrication.',
    icon: Layers,
    maxLevel: 30,
    baseCost: { energy: 900, alloy: 1100 },
    costGrowth: 1.5,
    baseBuildTimeSec: 300,
    buildTimeGrowth: 1.3,
    productionPerLevel: { resource: 'alloy', amount: 1.5 },
  },
  {
    id: 'crystal-extractor',
    name: 'Crystal Extractor',
    description: 'Draws resonant Crystal from subsurface veins. Feeds research and shipyards.',
    icon: Gem,
    maxLevel: 30,
    baseCost: { energy: 1400, crystal: 500 },
    costGrowth: 1.55,
    baseBuildTimeSec: 360,
    buildTimeGrowth: 1.3,
    productionPerLevel: { resource: 'crystal', amount: 0.65 },
  },
  {
    id: 'storage-depot',
    name: 'Storage Depot',
    description: 'Hardened silos that cap resource storage before overflow is lost.',
    icon: Warehouse,
    maxLevel: 25,
    baseCost: { energy: 1000, alloy: 1000 },
    costGrowth: 1.45,
    baseBuildTimeSec: 300,
    buildTimeGrowth: 1.25,
    storagePerLevel: 600,
  },
  {
    id: 'research-lab',
    name: 'Research Lab',
    description: 'Enables technology research. Higher levels unlock advanced tech tiers.',
    icon: FlaskConical,
    maxLevel: 20,
    baseCost: { energy: 1600, crystal: 900 },
    costGrowth: 1.5,
    baseBuildTimeSec: 420,
    buildTimeGrowth: 1.3,
  },
  {
    id: 'fabrication-bay',
    name: 'Fabrication Bay',
    description: 'Produces ground units. Level gates access to heavier unit classes.',
    icon: Factory,
    maxLevel: 20,
    baseCost: { energy: 1800, alloy: 1600 },
    costGrowth: 1.5,
    baseBuildTimeSec: 420,
    buildTimeGrowth: 1.3,
  },
  {
    id: 'shipyard',
    name: 'Shipyard',
    description: 'Constructs starships. Level gates access to larger hull classes.',
    icon: Rocket,
    maxLevel: 20,
    baseCost: { energy: 2400, alloy: 2000, crystal: 400 },
    costGrowth: 1.55,
    baseBuildTimeSec: 540,
    buildTimeGrowth: 1.35,
  },
  {
    id: 'shield-generator',
    name: 'Shield Generator',
    description: 'Projects a defensive envelope over the colony, reducing incoming raid losses.',
    icon: ShieldCheck,
    maxLevel: 20,
    baseCost: { energy: 2000, alloy: 1200 },
    costGrowth: 1.5,
    baseBuildTimeSec: 360,
    buildTimeGrowth: 1.3,
  },
  {
    id: 'sensor-array',
    name: 'Sensor Array',
    description: 'Long-range detection grid. Extends scan range and incursion warning time.',
    icon: Satellite,
    maxLevel: 20,
    baseCost: { energy: 1500, crystal: 700 },
    costGrowth: 1.45,
    baseBuildTimeSec: 300,
    buildTimeGrowth: 1.25,
  },
]

export function getBuildingDef(id: string): BuildingDef {
  const def = BUILDING_DEFS.find((b) => b.id === id)
  if (!def) throw new Error(`Unknown building: ${id}`)
  return def
}

export function buildingCostAtLevel(def: BuildingDef, targetLevel: number): Cost {
  const mult = Math.pow(def.costGrowth, targetLevel - 1)
  const cost: Cost = {}
  for (const [k, v] of Object.entries(def.baseCost)) {
    cost[k as Resource] = Math.round((v as number) * mult)
  }
  return cost
}

export function buildingTimeAtLevel(def: BuildingDef, targetLevel: number): number {
  return Math.round(def.baseBuildTimeSec * Math.pow(def.buildTimeGrowth, targetLevel - 1))
}

// --- Research ------------------------------------------------------------

export interface ResearchDef {
  id: string
  name: string
  description: string
  icon: LucideIcon
  maxLevel: number
  baseCost: Cost
  costGrowth: number
  baseTimeSec: number
  timeGrowth: number
  requiresBuilding: { id: string; level: number }
  /** Effect summary shown in UI. */
  effect: string
}

export const RESEARCH_DEFS: ResearchDef[] = [
  {
    id: 'grid-efficiency',
    name: 'Grid Efficiency',
    description: 'Optimized power routing across the colony grid.',
    icon: Zap,
    maxLevel: 15,
    baseCost: { energy: 800, crystal: 400 },
    costGrowth: 1.5,
    baseTimeSec: 360,
    timeGrowth: 1.3,
    requiresBuilding: { id: 'research-lab', level: 1 },
    effect: '+4% Energy production per level',
  },
  {
    id: 'metallurgy',
    name: 'Applied Metallurgy',
    description: 'Advanced alloys reduce waste in the foundry smelting process.',
    icon: Atom,
    maxLevel: 15,
    baseCost: { energy: 600, alloy: 700, crystal: 300 },
    costGrowth: 1.5,
    baseTimeSec: 420,
    timeGrowth: 1.3,
    requiresBuilding: { id: 'research-lab', level: 2 },
    effect: '+4% Alloy production per level',
  },
  {
    id: 'crystal-resonance',
    name: 'Crystal Resonance',
    description: 'Tuned extraction harmonics pull more Crystal per cycle.',
    icon: Gem,
    maxLevel: 15,
    baseCost: { energy: 900, crystal: 600 },
    costGrowth: 1.55,
    baseTimeSec: 480,
    timeGrowth: 1.3,
    requiresBuilding: { id: 'research-lab', level: 3 },
    effect: '+4% Crystal production per level',
  },
  {
    id: 'hull-plating',
    name: 'Hull Plating',
    description: 'Reinforced composite plating improves fleet survivability in combat.',
    icon: Shield,
    maxLevel: 12,
    baseCost: { alloy: 1200, crystal: 500 },
    costGrowth: 1.5,
    baseTimeSec: 540,
    timeGrowth: 1.3,
    requiresBuilding: { id: 'research-lab', level: 4 },
    effect: '+3% fleet defense per level',
  },
  {
    id: 'weapons-systems',
    name: 'Weapons Systems',
    description: 'Higher-yield ordnance and targeting computers.',
    icon: Swords,
    maxLevel: 12,
    baseCost: { alloy: 1000, crystal: 700 },
    costGrowth: 1.5,
    baseTimeSec: 540,
    timeGrowth: 1.3,
    requiresBuilding: { id: 'research-lab', level: 5 },
    effect: '+3% fleet attack per level',
  },
  {
    id: 'sensor-calibration',
    name: 'Sensor Calibration',
    description: 'Deep-field scanning algorithms reveal exact garrison composition sooner.',
    icon: Telescope,
    maxLevel: 10,
    baseCost: { energy: 700, crystal: 900 },
    costGrowth: 1.45,
    baseTimeSec: 420,
    timeGrowth: 1.25,
    requiresBuilding: { id: 'sensor-array', level: 2 },
    effect: 'Reveals garrison composition at lower Sensor Array levels',
  },
  {
    id: 'fabrication-automation',
    name: 'Fabrication Automation',
    description: 'Automated assembly lines speed up hull fabrication.',
    icon: Cpu,
    maxLevel: 10,
    baseCost: { energy: 1100, alloy: 1400 },
    costGrowth: 1.5,
    baseTimeSec: 480,
    timeGrowth: 1.3,
    requiresBuilding: { id: 'fabrication-bay', level: 3 },
    effect: '-3% ship build time per level',
  },
  {
    id: 'bloom-countermeasures',
    name: 'Bloom Countermeasures',
    description: 'Experimental xenobiology research into suppressing Bloom incursions.',
    icon: Radiation,
    maxLevel: 8,
    baseCost: { energy: 1500, alloy: 900, crystal: 1200 },
    costGrowth: 1.6,
    baseTimeSec: 720,
    timeGrowth: 1.35,
    requiresBuilding: { id: 'research-lab', level: 6 },
    effect: '-5% Bloom intensity growth per level (flavor)',
  },
]

export function getResearchDef(id: string): ResearchDef {
  const def = RESEARCH_DEFS.find((r) => r.id === id)
  if (!def) throw new Error(`Unknown tech: ${id}`)
  return def
}

export function researchCostAtLevel(def: ResearchDef, targetLevel: number): Cost {
  const mult = Math.pow(def.costGrowth, targetLevel - 1)
  const cost: Cost = {}
  for (const [k, v] of Object.entries(def.baseCost)) {
    cost[k as Resource] = Math.round((v as number) * mult)
  }
  return cost
}

export function researchTimeAtLevel(def: ResearchDef, targetLevel: number): number {
  return Math.round(def.baseTimeSec * Math.pow(def.timeGrowth, targetLevel - 1))
}

// --- Ships -----------------------------------------------------------------

export interface ShipDef {
  id: string
  name: string
  description: string
  icon: LucideIcon
  cost: Cost
  buildTimeSec: number
  attack: number
  defense: number
  cargo: number
  requiresBuilding: { id: string; level: number }
}

export const SHIP_DEFS: ShipDef[] = [
  {
    id: 'scout-probe',
    name: 'Scout Probe',
    description: 'Unarmed reconnaissance drone. Fast and expendable.',
    icon: Satellite,
    cost: { energy: 200, alloy: 150 },
    buildTimeSec: 60,
    attack: 0,
    defense: 1,
    cargo: 0,
    requiresBuilding: { id: 'shipyard', level: 1 },
  },
  {
    id: 'interceptor',
    name: 'Interceptor',
    description: 'Light strike craft. Cheap and fast to mass-produce.',
    icon: Rocket,
    cost: { energy: 400, alloy: 350 },
    buildTimeSec: 180,
    attack: 12,
    defense: 6,
    cargo: 20,
    requiresBuilding: { id: 'shipyard', level: 1 },
  },
  {
    id: 'gunship',
    name: 'Gunship',
    description: 'Medium hull with a balanced weapons loadout.',
    icon: Swords,
    cost: { energy: 900, alloy: 800, crystal: 100 },
    buildTimeSec: 420,
    attack: 32,
    defense: 20,
    cargo: 40,
    requiresBuilding: { id: 'shipyard', level: 4 },
  },
  {
    id: 'hauler',
    name: 'Hauler',
    description: 'Bulk cargo frame for salvage and trade runs. Lightly armed.',
    icon: Warehouse,
    cost: { energy: 600, alloy: 700 },
    buildTimeSec: 300,
    attack: 2,
    defense: 8,
    cargo: 250,
    requiresBuilding: { id: 'shipyard', level: 2 },
  },
  {
    id: 'siege-cruiser',
    name: 'Siege Cruiser',
    description: 'Heavy hull built to crack fortified garrisons.',
    icon: ShieldCheck,
    cost: { energy: 2200, alloy: 2400, crystal: 800 },
    buildTimeSec: 900,
    attack: 90,
    defense: 70,
    cargo: 60,
    requiresBuilding: { id: 'shipyard', level: 8 },
  },
]

export function getShipDef(id: string): ShipDef {
  const def = SHIP_DEFS.find((s) => s.id === id)
  if (!def) throw new Error(`Unknown ship: ${id}`)
  return def
}

// --- Factions --------------------------------------------------------------

/** Defense multiplier applied to a sector's raw garrisonStrength during combat resolution. */
export const FACTION_DEFENSE_MULTIPLIER: Record<string, number> = {
  kessler: 0.85,
  obsidian: 1.35,
  hollow: 1.1,
  bloom: 1.2,
  unclaimed: 0.5,
}

export const SECTOR_DISTANCE_SPEED_SEC_PER_UNIT = 45
