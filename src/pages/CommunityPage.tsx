import { Link } from 'react-router'
import { useUsers } from '../context/UsersContext'

export function CommunityPage() {
  const { usersDb, loading } = useUsers()

  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>
  if (!usersDb) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold">Community</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {usersDb.users.map((user) => (
          <Link
            key={user.id}
            to={`/u/${user.id}`}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold dark:bg-slate-800">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium">{user.displayName}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
