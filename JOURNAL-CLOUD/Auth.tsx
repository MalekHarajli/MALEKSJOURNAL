import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { supabase } from './supabase'
import { ACCENT } from './colors'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const address = email.trim()
    if (!address || status === 'sending') return
    setStatus('sending')
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: window.location.origin },
    })
    if (err) {
      setError(err.message)
      setStatus('idle')
      return
    }
    setStatus('sent')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
      <p className="mb-3 bg-gradient-to-r from-[#22d9ff] via-[#a78bff] to-[#ff6ec7] bg-clip-text text-[11px] font-bold uppercase tracking-[0.3em] text-transparent animate-rise">
        Malek&rsquo;s Trading Journal
      </p>
      <h1
        className="font-display text-4xl font-bold uppercase tracking-tight text-bone animate-rise sm:text-5xl"
        style={{ animationDelay: '70ms' }}
      >
        Malek, you are{' '}
        <span className="bg-gradient-to-r from-[#22d9ff] via-[#34f5a8] to-[#31f2a9] bg-clip-text text-transparent">
          profitable!
        </span>
      </h1>

      {status === 'sent' ? (
        <div
          className="mt-10 w-full max-w-md rounded-2xl border border-edge bg-card px-6 py-8 animate-rise"
          style={{ animationDelay: '140ms' }}
        >
          <Mail size={28} className="mx-auto mb-4" style={{ color: ACCENT }} />
          <h2 className="font-display text-xl font-semibold text-bone">Check your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            A sign-in link is on its way to{' '}
            <span className="font-semibold text-bone">{email.trim()}</span>. Open it on this device
            and you&rsquo;ll land straight in your journal.
          </p>
          <button
            onClick={() => {
              setStatus('idle')
              setError(null)
            }}
            className="mt-5 text-xs font-semibold text-mist transition-colors hover:text-bone"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-10 w-full max-w-md animate-rise"
          style={{ animationDelay: '140ms' }}
        >
          <p className="mb-5 text-sm leading-relaxed text-mist">
            Sign in and your trades follow you to every device.
          </p>
          <input
            type="email"
            required
            autoFocus
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field text-center"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-3 w-full rounded-xl px-6 py-3 font-display text-base font-bold text-base transition-all
              hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: `linear-gradient(120deg, ${ACCENT}, #34f5a8)`,
              boxShadow: `0 14px 36px -14px ${ACCENT}b3`,
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
          {error && <p className="mt-3 text-sm text-loss">{error}</p>}
          <p className="mt-5 text-xs leading-relaxed text-mist/50">
            No password. Every sign-in uses a fresh link sent to your inbox.
          </p>
        </form>
      )}
    </div>
  )
}
