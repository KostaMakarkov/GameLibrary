import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchUsers } from '../lib/users'
import type { UsersDb } from '../types'

interface UsersState {
  usersDb: UsersDb | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  applyUsers: (usersDb: UsersDb) => void
}

const UsersContext = createContext<UsersState | null>(null)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [usersDb, setUsersDb] = useState<UsersDb | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setUsersDb(await fetchUsers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyUsers = useCallback((next: UsersDb) => setUsersDb(next), [])

  return (
    <UsersContext.Provider value={{ usersDb, loading, error, refresh, applyUsers }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers(): UsersState {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used within UsersProvider')
  return ctx
}
