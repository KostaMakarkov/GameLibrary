import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchUserLists } from '../lib/userLists'
import type { UserListsDb } from '../types'

interface UserListsState {
  listsDb: UserListsDb | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  applyLists: (listsDb: UserListsDb) => void
}

const UserListsContext = createContext<UserListsState | null>(null)

export function UserListsProvider({ children }: { children: ReactNode }) {
  const [listsDb, setListsDb] = useState<UserListsDb | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setListsDb(await fetchUserLists())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personal lists')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyLists = useCallback((next: UserListsDb) => setListsDb(next), [])

  return (
    <UserListsContext.Provider value={{ listsDb, loading, error, refresh, applyLists }}>
      {children}
    </UserListsContext.Provider>
  )
}

export function useUserLists(): UserListsState {
  const ctx = useContext(UserListsContext)
  if (!ctx) throw new Error('useUserLists must be used within UserListsProvider')
  return ctx
}
