import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { useEditMode } from '../../context/EditModeContext'
import { useTheme } from '../../context/ThemeContext'

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}

export function Header() {
  const { currentUser, canWrite, isOwner, loading, logout } = useAuth()
  const { editMode, toggle } = useEditMode()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span>🎮</span>
          <span className="hidden sm:inline">Game Library</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link to="/community" className="hover:underline">
            Community
          </Link>
          {isOwner && (
            <Link to="/users" className="hover:underline">
              Users
            </Link>
          )}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {canWrite && (
            <button
              onClick={toggle}
              aria-label={editMode ? 'Exit edit mode' : 'Edit games and categories'}
              aria-pressed={editMode}
              className={`rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                editMode ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'
              }`}
            >
              <EditIcon />
            </button>
          )}
          {loading ? (
            <span className="text-slate-400">Checking…</span>
          ) : currentUser ? (
            <div className="flex items-center gap-1.5">
              <Link
                to={`/u/${currentUser.id}`}
                aria-label="My page"
                className="flex items-center gap-1.5 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <ProfileIcon />
                <span className="hidden sm:inline">{currentUser.displayName}</span>
              </Link>
              <button
                onClick={logout}
                aria-label="Log out"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <LogoutIcon />
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
