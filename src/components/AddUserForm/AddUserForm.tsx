import { useState, type FormEvent } from 'react'
import { PinInput } from '../PinInput'

export interface AddUserFormValues {
  username: string
  displayName: string
  tempPin: string
}

interface AddUserFormProps {
  onSubmit: (values: AddUserFormValues) => void
  onCancel: () => void
  submitting?: boolean
}

export function AddUserForm({ onSubmit, onCancel, submitting }: AddUserFormProps) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tempPin, setTempPin] = useState('')

  const valid = username.trim() && displayName.trim() && tempPin.length === 4

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSubmit({ username: username.trim(), displayName: displayName.trim(), tempPin })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        No GitHub account needed — just pick a username for them. Choose a temporary 4-digit PIN
        and share it with them separately; they'll be asked to replace it with their own PIN the
        first time they log in.
      </p>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Username</label>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Display name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Temporary PIN</label>
        <PinInput value={tempPin} onChange={setTempPin} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !valid}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add user'}
        </button>
      </div>
    </form>
  )
}
