import { runTick } from '@/lib/game/tick'
import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const result = await runTick()
  return NextResponse.json(result)
}
