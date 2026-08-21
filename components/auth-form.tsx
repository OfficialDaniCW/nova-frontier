'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Hexagon } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ChevronButton } from '@/components/game/chevron-button'
import { Panel } from '@/components/game/panel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    router.push('/play/colony')
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-void px-4 font-sans">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Hexagon className="size-8 text-concord" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.15em] text-text">
            Nova <span className="text-concord">Frontier</span>
          </h1>
        </div>

        <Panel grid className="p-6">
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold tracking-wide text-text">
              {isSignUp ? 'Register Governor Credentials' : 'Governor Uplink'}
            </h2>
            <p className="mt-1 font-mono text-xs text-text-faint">
              {isSignUp
                ? 'Create an account to claim your colony in the Halcyon Verge.'
                : 'Authenticate to resume command of your colony.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <Label htmlFor="password" className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim">
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
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </ChevronButton>
          </form>
        </Panel>

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
