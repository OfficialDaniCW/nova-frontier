import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

/**
 * Resolve the current user id from the Better Auth session.
 * Every server action that touches user data MUST go through this helper.
 */
export async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}
