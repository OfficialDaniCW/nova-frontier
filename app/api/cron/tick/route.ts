import { runTick } from '@/lib/game/tick'
import { closeSeasonIfDue } from '@/lib/game/seasons'
import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const result = await runTick()
  const season = await closeSeasonIfDue()
  return NextResponse.json({ ...result, season })
}
