import { Radio, Skull, Users, Waves, type LucideIcon } from 'lucide-react'

/** Net resource/population/score deltas applied when a choice resolves. Negative = cost/loss. */
export interface FrontierEventEffect {
  energy?: number
  alloy?: number
  crystal?: number
  population?: number
  score?: number
  /** Comm-log message describing this specific outcome. */
  summary: string
}

export interface FrontierEventChoice {
  id: string
  label: string
  description: string
  /** Flat cost paid up front regardless of outcome (0 if free, e.g. "ignore"). */
  cost: { energy?: number; alloy?: number; crystal?: number }
  /** Chance (0..1) the favorable outcome resolves; 1 = always succeeds. */
  successChance: number
  onSuccess: FrontierEventEffect
  /** Only meaningful when successChance < 1. */
  onFailure?: FrontierEventEffect
}

export interface FrontierEventDef {
  id: string
  title: string
  icon: LucideIcon
  flavor: string
  choices: FrontierEventChoice[]
}

export const FRONTIER_EVENT_DEFS: FrontierEventDef[] = [
  {
    id: 'distress-beacon',
    title: 'Distress Beacon',
    icon: Radio,
    flavor:
      'A garbled transmission cuts through the static — an unaffiliated survey crew, adrift with failing life support, pleads for aid on an open channel.',
    choices: [
      {
        id: 'send-aid',
        label: 'Dispatch a relief shuttle',
        description: 'Spend resources ferrying the crew to safety. They will remember this.',
        cost: { energy: 120, alloy: 60 },
        successChance: 1,
        onSuccess: {
          score: 25,
          summary: 'The relief shuttle reached the drifting crew in time. Word of the rescue spreads across the frontier.',
        },
      },
      {
        id: 'investigate',
        label: 'Board the vessel yourself',
        description: 'Send a security detail to investigate before committing aid — could be salvage, could be a trap.',
        cost: { energy: 40 },
        successChance: 0.6,
        onSuccess: {
          alloy: 180,
          crystal: 60,
          summary: 'The distress call was genuine. Grateful survivors handed over their remaining cargo before departing.',
        },
        onFailure: {
          population: -4,
          summary: 'It was a derelict trap — automated defenses activated, and the boarding party took losses before retreating.',
        },
      },
      {
        id: 'ignore',
        label: 'Ignore the transmission',
        description: 'Not your problem. Let the frontier sort itself out.',
        cost: {},
        successChance: 1,
        onSuccess: { summary: 'The signal fades into the static. You never learn what became of them.' },
      },
    ],
  },
  {
    id: 'derelict-wreck',
    title: 'Derelict Wreck',
    icon: Skull,
    flavor:
      'Sensors flag a long-dead hulk tumbling through your system, hull cracked open and venting frozen atmosphere. Salvage crews are eager for the order.',
    choices: [
      {
        id: 'salvage',
        label: 'Send a full salvage crew',
        description: 'Strip the wreck for parts. Higher yield, but the hulk\u2019s structure is unstable.',
        cost: { energy: 30 },
        successChance: 0.65,
        onSuccess: {
          alloy: 220,
          crystal: 40,
          summary: 'The salvage crew stripped the wreck clean, hauling back a rich load of alloy and crystal.',
        },
        onFailure: {
          population: -3,
          summary: 'A support strut gave way mid-salvage, venting the bay and costing several crew before the retreat order came.',
        },
      },
      {
        id: 'tow',
        label: 'Tow it to the scrapyard',
        description: 'Slower and safer — a modest guaranteed haul with no risk to crew.',
        cost: { energy: 60 },
        successChance: 1,
        onSuccess: {
          alloy: 90,
          summary: 'The wreck was towed in and quietly broken down at the scrapyard for a steady trickle of alloy.',
        },
      },
      {
        id: 'leave',
        label: 'Leave it adrift',
        description: 'Not worth the risk. Let it keep tumbling.',
        cost: {},
        successChance: 1,
        onSuccess: { summary: 'The hulk drifts on, untouched, into the dark between systems.' },
      },
    ],
  },
  {
    id: 'nomad-refugees',
    title: 'Nomad Convoy',
    icon: Users,
    flavor:
      'A ragged convoy of nomad transports requests docking rights, fleeing a conflict deeper in the frontier. Their engineers are skilled, but resources are already stretched thin.',
    choices: [
      {
        id: 'welcome',
        label: 'Grant them sanctuary',
        description: 'Take them in. More hands on the colony, at the cost of your reserves.',
        cost: { energy: 150, crystal: 30 },
        successChance: 1,
        onSuccess: {
          population: 18,
          summary: 'The nomad convoy settled into the colony, swelling your population with skilled new hands.',
        },
      },
      {
        id: 'trade',
        label: 'Trade supplies, send them onward',
        description: 'Offer provisions in exchange for their spare parts, then point them elsewhere.',
        cost: { energy: 50 },
        successChance: 0.8,
        onSuccess: {
          alloy: 100,
          summary: 'The nomads traded fairly, leaving behind a cache of alloy stock before continuing their journey.',
        },
        onFailure: {
          energy: -40,
          summary: 'The exchange went sour — the convoy took more than they gave before departing under thruster fire.',
        },
      },
      {
        id: 'turn-away',
        label: 'Turn the convoy away',
        description: 'The colony cannot spare the strain right now.',
        cost: {},
        successChance: 1,
        onSuccess: { summary: 'The convoy peels off toward the outer dark, engines flaring as they search for a kinder port.' },
      },
    ],
  },
  {
    id: 'anomalous-signal',
    title: 'Anomalous Signal',
    icon: Waves,
    flavor:
      'Deep-range sensors pick up a rhythmic, non-natural pulse from an uncharted stretch of your system \u2014 too structured to be noise, too faint to identify.',
    choices: [
      {
        id: 'investigate',
        label: 'Investigate directly',
        description: 'Send a survey team to the source. Could be a discovery, could be a threat.',
        cost: { energy: 50 },
        successChance: 0.55,
        onSuccess: {
          crystal: 160,
          score: 15,
          summary: 'The signal traced back to a pristine crystal deposit, undisturbed since before the frontier was settled.',
        },
        onFailure: {
          energy: -80,
          summary: 'The source turned out to be a Bloom resonance node \u2014 it flared violently as your team approached, draining nearby systems.',
        },
      },
      {
        id: 'jam',
        label: 'Deploy signal jammers',
        description: 'Neutralize the anomaly from a safe distance without engaging it directly.',
        cost: { energy: 90 },
        successChance: 1,
        onSuccess: { summary: 'The jammers silenced the pulse cleanly. Whatever it was, it will not be heard from again.' },
      },
      {
        id: 'broadcast',
        label: 'Broadcast a reply',
        description: 'Answer the signal openly and see what responds. Reckless, but the frontier rewards the bold.',
        cost: {},
        successChance: 0.4,
        onSuccess: {
          score: 30,
          summary: 'The reply was answered by a passing trade convoy, impressed enough by your boldness to spread word of your colony.',
        },
        onFailure: {
          population: -5,
          summary: 'The reply drew unwanted attention \u2014 raiders used the open channel to triangulate and strike before vanishing.',
        },
      },
    ],
  },
]

export function getFrontierEventDef(eventId: string): FrontierEventDef {
  const def = FRONTIER_EVENT_DEFS.find((e) => e.id === eventId)
  if (!def) throw new Error(`Unknown frontier event: ${eventId}`)
  return def
}

/** Roughly one eligible roll window (mirrors the disaster-state throttle). */
export const FRONTIER_EVENT_MIN_INTERVAL_MS = 45 * 60 * 1000
/** Chance per eligible tick that a colony past its cooldown spawns a pending event. */
export const FRONTIER_EVENT_ROLL_CHANCE = 0.12

/** Deterministic-ish pick, weighted evenly across the catalog. */
export function pickFrontierEvent(): FrontierEventDef {
  const idx = Math.floor(Math.random() * FRONTIER_EVENT_DEFS.length)
  return FRONTIER_EVENT_DEFS[idx]
}
