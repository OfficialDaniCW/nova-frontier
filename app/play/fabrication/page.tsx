import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { colonies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function FabricationIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, session.user.id)).limit(1)
  if (!colony) redirect('/sign-in')

  redirect(`/play/fabrication/${colony.id}`)
}
