import { useCallback } from 'react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useDbWriter } from './useDbWriter'
import type { Db } from '../types'

// Applies nextDb to local state immediately and commits to GitHub in the
// background, reporting the outcome via toast. Reverts to previousDb if the
// commit fails, so the UI never shows a change that didn't actually save.
export function useOptimisticCommit() {
  const { applyDb } = useData()
  const { commitDb } = useDbWriter()
  const { showToast } = useToast()

  const run = useCallback(
    (previousDb: Db, nextDb: Db, message: string, successMessage: string, failureMessage: string) => {
      applyDb(nextDb)
      commitDb(nextDb, message)
        .then(() => showToast('success', successMessage))
        .catch((err) => {
          applyDb(previousDb)
          const detail = err instanceof Error ? err.message : 'unknown error'
          showToast('error', `${failureMessage}: ${detail}`)
        })
    },
    [applyDb, commitDb, showToast],
  )

  return { run }
}
