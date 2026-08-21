'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Hexagon, Dices, Flame, Waves, Sun, Globe2, ArrowLeft, ArrowRight } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { suggestCallsign, foundNewColony } from '@/app/actions/founding'
import { PLANET_TYPES, type PlanetType } from '@/lib/game/planets'
import { ChevronButton } from '@/components/game/chevron-button'
import { Panel } from '@/components/game/panel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PLANET_ICON: Record<PlanetType, typeof Globe2> = {
  temperate: Globe2,
  volcanic: Flame,
  oceanic: Waves,
  arid: Sun,
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const isSignUp = mode === 'sign-up'

  // Step 1: account credentials. Step 2 (sign-up only): colony founding.
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [colonyName, setColonyName] = useState('')
  const [callsign, setCallsign] = useState('')
  const [planetType, setPlanetType] = useState<PlanetType>('temperate')

  useEffect(() => {
    if (isSignUp) {
      suggestCallsign().then(setCallsign)
    }
  }, [isSignUp])

  const rerollCallsign = async () => {
    setCallsign(await suggestCallsign())
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!isSignUp) {
      const { error } = await authClient.signIn.email({ email, password })
      setLoading(false)
      if (error) {
        setError(error.message ?? 'Something went wrong')
        return
      }
      router.push('/play/colony')
      router.refresh()
      return
    }

    const { error: signUpError } = await authClient.signUp.email({ email, password, name })
    if (signUpError) {
      setLoading(false)
      setError(signUpError.message ?? 'Something went wrong')
      return
    }

    try {
      await foundNewColony({
        callsign: callsign.trim() || 'Unnamed Governor',
        colonyName: colonyName.trim() || 'Kepler-11c',
        planetType,
      })
    } catch {
      // Non-fatal: /play/layout.tsx will bootstrap defaults if this failed.
    }

    setLoading(false)
    router.push('/play/colony')
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-void px-4 py-10 font-sans">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Hexagon className="size-8 text-concord" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.15em] text-text">
            Nova <span className="text-concord">Frontier</span>
          </h1>
        </div>

        {isSignUp && (
          <div className="flex items-center justify-center gap-2 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            <span className={cn('flex items-center gap-1.5', step === 1 && 'text-concord')}>
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border',
                  step === 1 ? 'border-concord text-concord' : 'border-text-faint',
                )}
              >
                1
              </span>
              Credentials
            </span>
            <span className="h-px w-8 bg-panel-border" aria-hidden="true" />
            <span className={cn('flex items-center gap-1.5', step === 2 && 'text-concord')}>
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border',
                  step === 2 ? 'border-concord text-concord' : 'border-text-faint',
                )}
              >
                2
              </span>
              Found Colony
            </span>
          </div>
        )}

        {step === 1 && (
          <Panel grid className="p-6">
            <div className="mb-6">
              <h2 className="font-display text-lg font-semibold tracking-wide text-text">
                {isSignUp ? 'Register Governor Credentials' : 'Governor Uplink'}
              </h2>
              <p className="mt-1 font-mono text-xs text-text-faint">
                {isSignUp
                  ? 'The Concord Charter requires a verified identity before it will recognize your claim in the Halcyon Verge.'
                  : 'Authenticate to resume command of your colony.'}
              </p>
            </div>

            <form onSubmit={isSignUp ? handleContinue : handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="border-panel-border bg-slate-950/60 font-mono text-sm text-text"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-panel-border bg-slate-950/60 font-mono text-sm text-text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="password"
                  className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="border-panel-border bg-slate-950/60 font-mono text-sm text-text"
                />
              </div>

              {error && (
                <p className="font-mono text-xs text-obsidian" role="alert">
                  {error}
                </p>
              )}

              <ChevronButton type="submit" variant="concord" disabled={loading} className="mt-2 w-full">
                {loading ? 'Please wait...' : isSignUp ? (
                  <span className="inline-flex items-center gap-1.5">
                    Continue to founding <ArrowRight className="size-3.5" />
                  </span>
                ) : (
                  'Sign in'
                )}
              </ChevronButton>
            </form>
          </Panel>
        )}

        {step === 2 && isSignUp && (
          <Panel grid className="p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-semibold tracking-wide text-text">
                Found Your Colony
              </h2>
              <p className="mt-1.5 font-mono text-xs leading-relaxed text-text-faint">
                {"RC 108. Convoy Eleven's descendants have held the Halcyon Verge for a generation. The Concord Charter binds you to no state, no crown \u2014 only to the rule that a claim is only as real as your ability to hold it. Name your world. Choose your callsign. The Fireholder fragments are already watching."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="colonyName"
                  className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim"
                >
                  Colony name
                </Label>
                <Input
                  id="colonyName"
                  value={colonyName}
                  onChange={(e) => setColonyName(e.target.value)}
                  placeholder="Kepler-11c"
                  maxLength={40}
                  className="border-panel-border bg-slate-950/60 font-mono text-sm text-text"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="callsign"
                  className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim"
                >
                  Governor callsign
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="callsign"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    maxLength={30}
                    className="border-panel-border bg-slate-950/60 font-mono text-sm text-text"
                  />
                  <button
                    type="button"
                    onClick={rerollCallsign}
                    title="Reroll callsign"
                    aria-label="Reroll callsign"
                    className="flex size-10 shrink-0 items-center justify-center border border-panel-border bg-slate-950/60 text-text-dim transition-colors hover:border-concord hover:text-concord"
                  >
                    <Dices className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim">
                  Homeworld type
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PLANET_TYPES.map((p) => {
                    const Icon = PLANET_ICON[p.id]
                    const selected = planetType === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlanetType(p.id)}
                        className={cn(
                          'clip-panel-sm flex flex-col gap-1 border p-3 text-left transition-colors',
                          selected
                            ? 'border-concord bg-concord/10'
                            : 'border-panel-border bg-slate-950/40 hover:border-text-faint',
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <Icon
                            className={cn('size-4', selected ? 'text-concord' : 'text-text-dim')}
                            aria-hidden="true"
                          />
                          <span
                            className={cn(
                              'font-display text-xs font-semibold uppercase tracking-wide',
                              selected ? 'text-concord' : 'text-text',
                            )}
                          >
                            {p.name}
                          </span>
                        </span>
                        <span className="font-mono text-[0.65rem] text-text-faint">{p.tagline}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1 font-mono text-[0.65rem] leading-relaxed text-text-faint">
                  {PLANET_TYPES.find((p) => p.id === planetType)?.description}
                </p>
              </div>

              {error && (
                <p className="font-mono text-xs text-obsidian" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-1 flex gap-2">
                <ChevronButton
                  type="button"
                  variant="obsidian"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-32"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowLeft className="size-3.5" /> Back
                  </span>
                </ChevronButton>
                <ChevronButton type="submit" variant="concord" disabled={loading} className="flex-1">
                  {loading ? 'Founding colony...' : 'Claim this world'}
                </ChevronButton>
              </div>
            </form>
          </Panel>
        )}

        <p className="text-center font-mono text-xs text-text-faint">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-concord underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </main>
  )
}
