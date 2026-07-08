import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserLists } from '../context/UserListsContext'
import { useOptimisticListsCommit } from './useOptimisticListsCommit'

// Reconciles the current user's own lists to match listIds for one game,
// touching only lists that actually need to change.
export function useListMembership() {
  const { currentUser } = useAuth()
  const { listsDb } = useUserLists()
  const { run } = useOptimisticListsCommit()

  const applySelection = useCallback(
    (gameId: string, listIds: string[]) => {
      if (!currentUser || !listsDb) return
      const myLists = listsDb.lists.filter((l) => l.ownerId === currentUser.id)
      const needsUpdate = myLists.some((l) => l.gameIds.includes(gameId) !== listIds.includes(l.id))
      if (!needsUpdate) return
      run(
        (current) => ({
          lists: current.lists.map((l) => {
            if (l.ownerId !== currentUser.id) return l
            const shouldContain = listIds.includes(l.id)
            const contains = l.gameIds.includes(gameId)
            if (shouldContain === contains) return l
            return {
              ...l,
              gameIds: shouldContain ? [...l.gameIds, gameId] : l.gameIds.filter((id) => id !== gameId),
            }
          }),
        }),
        'Update list membership',
        'Updated your lists',
        'Failed to update your lists',
      )
    },
    [currentUser, listsDb, run],
  )

  return { applySelection }
}
