import { redirect } from 'next/navigation'
import { colonyInfo } from '@/lib/game-data'

export default function ColonyIndexPage() {
  redirect(`/play/colony/${colonyInfo.id}`)
}
