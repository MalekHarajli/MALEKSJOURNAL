import { useEffect, useRef, useState, type FormEvent } from 'react'
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
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const credentials = useRef<{ email: string; password: string } | null>(null)

  // While the confirmation screen is up, keep trying to sign in. The moment
  // they confirm — on this device or their phone — this tab lets them in.
  useEffect(() => {
    if (!awaitingConfirm) return
    const creds = credentials.current
    if (!creds) return

    let stopped = false
    const timer = window.setInterval(async () => {
      if (stopped) return
      const { error: err } = await supabase.auth.signInWithPassword(creds)
      if (!err) {
        stopped = true
        window.clearInterval(timer)
      }
    }, 4000)

    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [awaitingConfirm])

  const reset = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
    setAwaitingConfirm(false)
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
      else setNotice('Reset link sent. Open it and you can choose a new password.')
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

      // The name rides along on the account itself, so it survives the trip
      // through the confirmation email even if they confirm on another device.
      const { data, error: err } = await supabase.auth.signUp({
        email: address,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: chosenName, discord_tag: discord.trim() || null },
        },
      })

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
        credentials.current = { email: address, password }
        setAwaitingConfirm(true)
        setBusy(false)
        return
      }
      return // already signed in, App takes over
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email: address, password })
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Wrong email or password. New here? Tap Create account. Forgot it? Tap Forgot password.'
          : /not confirmed/i.test(err.message)
            ? 'Confirm your email first — check your inbox for the link we sent.'
            : err.message,
      )
      setBusy(false)
    }
  }

  if (awaitingConfirm) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
        <Header />
        <div className="mt-10 w-full max-w-md rounded-2xl border border-edge bg-card px-6 py-8 animate-rise">
          <Mail size={28} className="mx-auto mb-4" style={{ color: ACCENT }} />
          <h2 className="font-display text-xl font-semibold text-bone">Confirm your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            We sent a link to <span className="font-semibold text-bone">{email.trim().toLowerCase()}</span>.
            Open it on any device — phone is fine — and this page will sign you in by itself.
          </p>
          <p className="mt-4 text-xs text-mist/60">Waiting for you to confirm…</p>
          <button
            onClick={() => reset('signin')}
            className="mt-5 text-xs font-semibold text-mist transition-colors hover:text-bone"
          >
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
      <Header />

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
              placeholder="Your name"
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
              ? 'Create account'
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

function Header() {
  return (
    <>
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
    </>
  )
}
