import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useUsers } from '../context/UsersContext'
import { AddUserForm, type AddUserFormValues } from '../components/AddUserForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { StoredUser } from '../types'

export function UsersPage() {
  const { currentUser, isOwner, loading, addUser, removeUser } = useAuth()
  const { usersDb } = useUsers()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<StoredUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <p className="p-8 text-center text-slate-500">Checking access…</p>

  if (!currentUser) {
    return (
      <p className="p-8 text-center">
        You need to <Link to="/login" className="underline">log in</Link> to manage users.
      </p>
    )
  }

  if (!isOwner) {
    return (
      <p className="p-8 text-center text-slate-600 dark:text-slate-300">
        Only the owner can manage users.
      </p>
    )
  }

  if (!usersDb) return null

  const handleAdd = async (values: AddUserFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await addUser(values.username, values.displayName, values.tempPin)
      setAdding(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async () => {
    if (!removing) return
    setSubmitting(true)
    setError(null)
    try {
      await removeUser(removing.id)
      setRemoving(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold">Users</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {usersDb.users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-800"
          >
            <div>
              <span className="font-medium">{user.displayName}</span>{' '}
              <span className="text-xs text-slate-400">@{user.username}</span>
              {user.isOwner && (
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                  Owner
                </span>
              )}
              {user.mustChangePin && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Pending setup
                </span>
              )}
            </div>
            {!user.isOwner && (
              <button onClick={() => setRemoving(user)} className="text-sm text-red-600 underline">
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <AddUserForm submitting={submitting} onSubmit={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          + Add user
        </button>
      )}

      {removing && (
        <ConfirmDialog
          title="Remove user"
          message={`Remove "${removing.displayName}"? They'll no longer be able to log in.`}
          onConfirm={handleRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  )
}
