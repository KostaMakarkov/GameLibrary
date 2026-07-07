import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { token, username, permission, login, logout } = useAuth()
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setLocalError(null)
    try {
      await login(value.trim())
      navigate('/')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to verify token')
    } finally {
      setSubmitting(false)
    }
  }

  if (token && username) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-10 text-center">
        <p>
          Logged in as <strong>@{username}</strong>
        </p>
        <p className="text-sm text-slate-500">
          Repo permission: <strong>{permission ?? 'unknown'}</strong>
        </p>
        <button
          onClick={logout}
          className="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Log in with a GitHub token</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Paste a fine-grained GitHub Personal Access Token scoped to this repo with{' '}
        <strong>Contents: Read and write</strong> permission. It's stored only in your browser's
        local storage and never leaves your device except to talk to GitHub's API directly.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          autoComplete="off"
          placeholder="github_pat_…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        />
        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className="w-full rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Verifying…' : 'Log in'}
        </button>
      </form>
      {localError && <p className="text-sm text-red-600">{localError}</p>}
      <p className="text-xs text-slate-400">
        Don't have a token yet? Create one at{' '}
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          github.com/settings/personal-access-tokens/new
        </a>
        .
      </p>
    </div>
  )
}
