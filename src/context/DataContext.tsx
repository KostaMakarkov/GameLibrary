import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchDb } from '../lib/db'
import type { Db } from '../types'

interface DataState {
  db: Db | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  applyDb: (db: Db) => void
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDb(await fetchDb())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyDb = useCallback((next: Db) => setDb(next), [])

  return (
    <DataContext.Provider value={{ db, loading, error, refresh, applyDb }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
