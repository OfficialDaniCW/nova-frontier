// No server/db imports here — this module is shared by client components
// (the colony-founding wizard) and server code (lib/game/bootstrap.ts).

export type PlanetType = 'temperate' | 'volcanic' | 'oceanic' | 'arid'

export const PLANET_TYPES: {
  id: PlanetType
  name: string
  tagline: string
  description: string
  modifiers: Partial<Record<'energyRate' | 'alloyRate' | 'crystalRate', number>>
}[] = [
  {
    id: 'temperate',
    name: 'Temperate',
    tagline: 'Balanced start',
    description:
      'Stable atmosphere, mild gravity, even yields across the board. No surprises, no edge.',
    modifiers: {},
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    tagline: '+15% Alloy, -10% Energy',
    description:
      'Fractured crust rich in ore veins. Foundries run hot and fast; solar collection suffers under the ash haze.',
    modifiers: { alloyRate: 1.15, energyRate: 0.9 },
  },
  {
    id: 'oceanic',
    name: 'Oceanic',
    tagline: '+20% Crystal, -10% Alloy',
    description:
      'Deep saline seas hold rare crystalline deposits. Surface metal is scarce without heavier extraction.',
    modifiers: { crystalRate: 1.2, alloyRate: 0.9 },
  },
  {
    id: 'arid',
    name: 'Arid',
    tagline: '+15% Energy, -15% Crystal',
    description:
      'Cloudless skies feed the solar arrays around the clock. The dry bedrock holds little worth mining.',
    modifiers: { energyRate: 1.15, crystalRate: 0.85 },
  },
]

export function planetModifiers(planetType: PlanetType) {
  return PLANET_TYPES.find((p) => p.id === planetType)?.modifiers ?? {}
}
