import { useCallback } from 'react'
import { useUserLists } from '../context/UserListsContext'
import { useToast } from '../context/ToastContext'
import { useUserListsWriter } from './useUserListsWriter'
import type { UserListsDb } from '../types'

export function useOptimisticListsCommit() {
  const { listsDb, applyLists } = useUserLists()
  const { commitLists } = useUserListsWriter()
  const { showToast } = useToast()

  const run = useCallback(
    (
      mutate: (current: UserListsDb) => UserListsDb,
      message: string,
      successMessage: string,
      failureMessage: string,
    ) => {
      if (!listsDb) return
      const previousLists = listsDb
      applyLists(mutate(listsDb))
      commitLists(mutate, message)
        .then((committed) => {
          applyLists(committed)
          showToast('success', successMessage)
        })
        .catch((err) => {
          applyLists(previousLists)
          const detail = err instanceof Error ? err.message : 'unknown error'
          showToast('error', `${failureMessage}: ${detail}`)
        })
    },
    [listsDb, applyLists, commitLists, showToast],
  )

  return { run }
}
