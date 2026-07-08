import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useUsers } from '../context/UsersContext'
import { PinInput } from '../components/PinInput'
import type { StoredUser } from '../types'

type View = { kind: 'grid' } | { kind: 'pin'; user: StoredUser }

function BootstrapForm() {
  const { bootstrapOwner } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = username.trim() && token.trim() && pin.length === 4 && pin === confirmPin

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError(null)
    try {
      await bootstrapOwner(username.trim(), token.trim(), pin)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up owner account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Set up the first account</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        No one is registered yet. Set yourself up as the owner — you'll be the only one who can
        add other users afterward. This needs your own GitHub fine-grained PAT for this repo
        (Contents: Read and write) just this once; friends you add later won't need a GitHub
        account at all.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">GitHub username</label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">GitHub PAT</label>
          <input
            type="password"
            autoComplete="off"
            placeholder="github_pat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Choose a 4-digit PIN</label>
          <PinInput value={pin} onChange={setPin} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Confirm PIN</label>
          <PinInput value={confirmPin} onChange={setConfirmPin} />
        </div>
        <button
          type="submit"
          disabled={submitting || !valid}
          className="w-full rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Setting up…' : 'Create owner account'}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function PinView({ user }: { user: StoredUser }) {
  const { loginWithPin, completeFirstLogin } = useAuth()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFirstLogin = user.mustChangePin

  const valid = isFirstLogin
    ? pin.length === 4 && newPin.length === 4 && newPin === confirmNewPin
    : pin.length === 4

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError(null)
    try {
      if (isFirstLogin) {
        await completeFirstLogin(user.id, pin, newPin)
      } else {
        await loginWithPin(user.id, pin)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Hi, {user.displayName}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {isFirstLogin ? 'Temporary PIN' : 'PIN'}
          </label>
          <PinInput value={pin} onChange={setPin} autoFocus />
        </div>
        {isFirstLogin && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              First time logging in — choose your own PIN to replace the temporary one.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">New PIN</label>
              <PinInput value={newPin} onChange={setNewPin} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Confirm new PIN</label>
              <PinInput value={confirmNewPin} onChange={setConfirmNewPin} />
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={submitting || !valid}
          className="w-full rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Checking…' : 'Log in'}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function LoginPage() {
  const { usersDb, loading: usersLoading } = useUsers()
  const [view, setView] = useState<View>({ kind: 'grid' })

  if (usersLoading) {
    return <p className="p-8 text-center text-slate-500">Loading…</p>
  }

  if (!usersDb) {
    return <p className="p-8 text-center text-red-600">Failed to load user list.</p>
  }

  if (usersDb.users.length === 0) {
    return <BootstrapForm />
  }

  if (view.kind === 'pin') {
    return <PinView user={view.user} />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-xl font-semibold">Who's logging in?</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {usersDb.users.map((user) => (
          <button
            key={user.id}
            onClick={() => setView({ kind: 'pin', user })}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold dark:bg-slate-800">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium">{user.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
