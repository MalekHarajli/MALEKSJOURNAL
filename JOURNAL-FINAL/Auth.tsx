import { useState, type FormEvent } from 'react'
import { KeyRound, Mail, UserPlus } from 'lucide-react'
import { supabase } from './supabase'
import { ACCENT } from './colors'

type Mode = 'signin' | 'signup' | 'forgot'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [discord, setDiscord] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const reset = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const address = email.trim().toLowerCase()
    if (!address || busy) return
    setBusy(true)
    setError(null)
    setNotice(null)

    if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: window.location.origin,
      })
      if (err) setError(err.message)
      else setNotice('Reset link sent. Open it on this device to choose a new password.')
      setBusy(false)
      return
    }

    if (mode === 'signup') {
      const chosenName = name.trim()
      if (!chosenName) {
        setError('Your first name is needed.')
        setBusy(false)
        return
      }
      const { data, error: err } = await supabase.auth.signUp({ email: address, password })
      if (err) {
        setError(
          /already/i.test(err.message)
            ? 'That email already has a journal. Sign in instead, or use Forgot password.'
            : err.message,
        )
        setBusy(false)
        return
      }
      if (!data.session) {
        setError(
          'Account made, but this project still asks for email confirmation. Turn off Confirm email in Supabase.',
        )
        setBusy(false)
        return
      }
      if (data.user) {
        await supabase.from('settings').upsert({
          user_id: data.user.id,
          email: address,
          display_name: chosenName,
          discord_tag: discord.trim() || null,
        })
      }
      return
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email: address, password })
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Wrong email or password. New here? Tap Create account. Forgot it? Tap Forgot password.'
          : err.message,
      )
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
      <p className="mb-3 bg-gradient-to-r from-[#22d9ff] via-[#a78bff] to-[#ff6ec7] bg-clip-text text-[11px] font-bold uppercase tracking-[0.3em] text-transparent animate-rise">
        Trading Journal
      </p>
      <h1
        className="font-display text-4xl font-bold uppercase tracking-tight text-bone animate-rise sm:text-5xl"
        style={{ animationDelay: '70ms' }}
      >
        You are{' '}
        <span className="bg-gradient-to-r from-[#22d9ff] via-[#34f5a8] to-[#31f2a9] bg-clip-text text-transparent">
          profitable!
        </span>
      </h1>

      <form
        onSubmit={submit}
        className="mt-10 w-full max-w-sm animate-rise"
        style={{ animationDelay: '140ms' }}
      >
        {mode !== 'forgot' && (
          <div className="mb-5 flex gap-1 rounded-xl border border-edge bg-raise p-1">
            {(
              [
                { key: 'signin', label: 'Sign in' },
                { key: 'signup', label: 'Create account' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => reset(tab.key)}
                className={`seg-btn ${mode === tab.key ? 'text-base' : 'text-mist hover:text-bone'}`}
                style={mode === tab.key ? { background: ACCENT } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'forgot' && (
          <p className="mb-5 text-sm leading-relaxed text-mist">
            Enter your email and we&rsquo;ll send a link to set a new password.
          </p>
        )}

        {mode === 'signup' && (
          <>
            <input
              type="text"
              required
              autoFocus
              autoComplete="given-name"
              placeholder="Your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field mb-2.5 text-center"
              maxLength={24}
            />
            <input
              type="text"
              placeholder="Discord tag (optional)"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="field mb-2.5 text-center"
              maxLength={40}
            />
          </>
        )}

        <input
          type="email"
          required
          autoFocus={mode !== 'signup'}
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field text-center"
        />

        {mode !== 'forgot' && (
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder={mode === 'signup' ? 'Password (6+ characters)' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mt-2.5 text-center"
          />
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-display text-base
            font-bold text-base transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(120deg, ${ACCENT}, #34f5a8)`,
            boxShadow: `0 14px 36px -14px ${ACCENT}b3`,
          }}
        >
          {mode === 'signup' ? (
            <UserPlus size={17} strokeWidth={2.5} />
          ) : mode === 'forgot' ? (
            <Mail size={17} strokeWidth={2.5} />
          ) : (
            <KeyRound size={17} strokeWidth={2.5} />
          )}
          {busy
            ? 'One moment…'
            : mode === 'signup'
              ? 'Start my journal'
              : mode === 'forgot'
                ? 'Send reset link'
                : 'Sign in'}
        </button>

        {error && <p className="mt-3 text-sm text-loss">{error}</p>}
        {notice && <p className="mt-3 text-sm text-win">{notice}</p>}

        <button
          type="button"
          onClick={() => reset(mode === 'forgot' ? 'signin' : 'forgot')}
          className="mt-5 text-xs font-semibold text-mist/60 transition-colors hover:text-bone"
        >
          {mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'}
        </button>
      </form>
    </div>
  )
}
