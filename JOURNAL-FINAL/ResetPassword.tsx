import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { supabase } from './supabase'
import { ACCENT } from './colors'

interface Props {
  onDone: () => void
}

/** Shown after someone opens a password reset link. */
export default function ResetPassword({ onDone }: Props) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6 || busy) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setBusy(false)
      return
    }
    onDone()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-bone">
        Choose a new password
      </h1>
      <form onSubmit={submit} className="mt-8 w-full max-w-sm animate-rise">
        <input
          type="password"
          required
          autoFocus
          minLength={6}
          autoComplete="new-password"
          placeholder="New password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field text-center"
        />
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
          <KeyRound size={17} strokeWidth={2.5} />
          {busy ? 'Saving…' : 'Save password'}
        </button>
        {error && <p className="mt-3 text-sm text-loss">{error}</p>}
      </form>
    </div>
  )
}
