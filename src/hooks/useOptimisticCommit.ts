import { useCallback } from 'react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useDbWriter } from './useDbWriter'
import type { Db } from '../types'

// Applies mutate() to local state immediately for instant feedback, then
// commits in the background against the file's actual current content (not
// the possibly-stale local copy) and reconciles local state with whatever
// really landed. Reverts to the pre-change state and toasts an error if the
// commit fails.
export function useOptimisticCommit() {
  const { db, applyDb } = useData()
  const { commitDb } = useDbWriter()
  const { showToast } = useToast()

  const run = useCallback(
    (mutate: (current: Db) => Db, message: string, successMessage: string, failureMessage: string) => {
      if (!db) return
      const previousDb = db
      applyDb(mutate(db))
      commitDb(mutate, message)
        .then((committedDb) => {
          applyDb(committedDb)
          showToast('success', successMessage)
        })
        .catch((err) => {
          applyDb(previousDb)
          const detail = err instanceof Error ? err.message : 'unknown error'
          showToast('error', `${failureMessage}: ${detail}`)
        })
    },
    [db, applyDb, commitDb, showToast],
  )

  return { run }
}
