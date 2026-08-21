import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  // Required by Better Auth 1.7+: account identity is scoped by issuer
  // (e.g. 'local:credential' for email/password accounts).
  issuer: text('issuer').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- Nova Frontier app tables -----------------------------------------------
// All scoped by a plain `userId` column (no FK — see neon-on-vercel skill).

export const governors = pgTable('governors', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  callsign: text('callsign').notNull(),
  score: integer('score').notNull().default(0),
  tutorialDismissedAt: timestamp('tutorialDismissedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const colonies = pgTable('colonies', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  governorId: text('governorId').notNull(),
  name: text('name').notNull(),
  planetType: text('planetType').notNull().default('temperate'),
  homeSystemId: text('homeSystemId'),
  resourcePriority: text('resourcePriority').notNull().default('balanced'),
  energy: doublePrecision('energy').notNull().default(500),
  alloy: doublePrecision('alloy').notNull().default(300),
  crystal: doublePrecision('crystal').notNull().default(100),
  energyCap: doublePrecision('energyCap').notNull().default(2000),
  alloyCap: doublePrecision('alloyCap').notNull().default(2000),
  crystalCap: doublePrecision('crystalCap').notNull().default(1000),
  energyRate: doublePrecision('energyRate').notNull().default(12),
  alloyRate: doublePrecision('alloyRate').notNull().default(8),
  crystalRate: doublePrecision('crystalRate').notNull().default(2),
  population: integer('population').notNull().default(120),
  populationCap: integer('populationCap').notNull().default(500),
  lastTickAt: timestamp('lastTickAt').notNull().defaultNow(),
  lastDeepScanAt: timestamp('lastDeepScanAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const buildings = pgTable('buildings', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  colonyId: text('colonyId').notNull(),
  buildingType: text('buildingType').notNull(),
  level: integer('level').notNull().default(0),
  queuedLevel: integer('queuedLevel'),
  queueStartedAt: timestamp('queueStartedAt'),
  queueEtaAt: timestamp('queueEtaAt'),
})

export const research = pgTable('research', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  governorId: text('governorId').notNull(),
  techId: text('techId').notNull(),
  level: integer('level').notNull().default(0),
  queuedLevel: integer('queuedLevel'),
  queueStartedAt: timestamp('queueStartedAt'),
  queueEtaAt: timestamp('queueEtaAt'),
})

export const ships = pgTable('ships', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  colonyId: text('colonyId').notNull(),
  shipType: text('shipType').notNull(),
  count: integer('count').notNull().default(0),
  queuedCount: integer('queuedCount'),
  queueStartedAt: timestamp('queueStartedAt'),
  queueEtaAt: timestamp('queueEtaAt'),
})

export const sectors = pgTable('sectors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  faction: text('faction').notNull(),
  sectorType: text('sectorType').notNull().default('outpost'),
  // Planet fields — a sector is now a planet belonging to a star system.
  systemId: text('systemId'),
  planetType: text('planetType').notNull().default('rocky'),
  traits: jsonb('traits').notNull().default([]),
  slot: integer('slot').notNull().default(0),
  garrisonStrength: integer('garrisonStrength').notNull().default(0),
  bloomIntensity: integer('bloomIntensity').notNull().default(0),
  ownerColonyId: text('ownerColonyId'),
  ownerUserId: text('ownerUserId'),
  energyReward: doublePrecision('energyReward').notNull().default(0),
  alloyReward: doublePrecision('alloyReward').notNull().default(0),
  crystalReward: doublePrecision('crystalReward').notNull().default(0),
  positionX: integer('positionX').notNull().default(0),
  positionY: integer('positionY').notNull().default(0),
})

export const starSystems = pgTable('star_systems', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  quadrant: text('quadrant').notNull(),
  positionX: integer('positionX').notNull(),
  positionY: integer('positionY').notNull(),
  starType: text('starType').notNull(),
  siteType: text('siteType'),
  factionHint: text('factionHint').notNull().default('unclaimed'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const systemDiscoveries = pgTable('system_discoveries', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  systemId: text('systemId').notNull(),
  level: text('level').notNull().default('detected'),
  discoveredAt: timestamp('discoveredAt').notNull().defaultNow(),
})

export const fleets = pgTable('fleets', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  colonyId: text('colonyId').notNull(),
  sectorId: text('sectorId').notNull(),
  mission: text('mission').notNull(),
  shipCounts: jsonb('shipCounts').notNull().default({}),
  departedAt: timestamp('departedAt').notNull().defaultNow(),
  arrivesAt: timestamp('arrivesAt').notNull(),
  status: text('status').notNull().default('en_route'),
  resolved: boolean('resolved').notNull().default(false),
})

export const combatLogs = pgTable('combat_logs', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  sectorId: text('sectorId').notNull(),
  sectorName: text('sectorName').notNull(),
  faction: text('faction').notNull(),
  outcome: text('outcome').notNull(),
  attackerPower: doublePrecision('attackerPower').notNull().default(0),
  defenderPower: doublePrecision('defenderPower').notNull().default(0),
  shipsLost: jsonb('shipsLost').notNull().default({}),
  energyLooted: doublePrecision('energyLooted').notNull().default(0),
  alloyLooted: doublePrecision('alloyLooted').notNull().default(0),
  crystalLooted: doublePrecision('crystalLooted').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const marketOrders = pgTable('market_orders', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  colonyId: text('colonyId').notNull(),
  side: text('side').notNull(), // 'sell'
  resource: text('resource').notNull(), // 'energy' | 'alloy' | 'crystal'
  quantity: doublePrecision('quantity').notNull(),
  remainingQuantity: doublePrecision('remainingQuantity').notNull(),
  pricePerUnit: doublePrecision('pricePerUnit').notNull(),
  paymentResource: text('paymentResource').notNull().default('energy'),
  status: text('status').notNull().default('open'), // 'open' | 'filled' | 'cancelled'
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const compacts = pgTable('compacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tag: text('tag').notNull(),
  leaderUserId: text('leaderUserId').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const compactMembers = pgTable('compact_members', {
  id: text('id').primaryKey(),
  compactId: text('compactId').notNull(),
  userId: text('userId').notNull(),
  joinedAt: timestamp('joinedAt').notNull().defaultNow(),
})

export const bloomState = pgTable('bloom_state', {
  id: text('id').primaryKey(),
  lastSpreadAt: timestamp('lastSpreadAt').notNull().defaultNow(),
})

export const commLog = pgTable('comm_log', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  category: text('category').notNull(), // 'construction' | 'research' | 'fleet' | 'combat' | 'trade' | 'system'
  severity: text('severity').notNull().default('info'), // 'info' | 'success' | 'warning' | 'danger'
  message: text('message').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
