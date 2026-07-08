import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'

export function Header() {
  const { currentUser, canWrite, isOwner, loading, logout } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          🎮 Game Library
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:underline">
            Library
          </Link>
          {canWrite && (
            <Link to="/admin" className="hover:underline">
              Admin
            </Link>
          )}
          {isOwner && (
            <Link to="/users" className="hover:underline">
              Users
            </Link>
          )}
          {loading ? (
            <span className="text-slate-400">Checking…</span>
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">{currentUser.displayName}</span>
              <button onClick={logout} className="text-slate-500 underline hover:text-slate-800 dark:hover:text-slate-200">
                Log out
              </button>
            </div>
          ) : (
            <Link to="/login" className="hover:underline">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
