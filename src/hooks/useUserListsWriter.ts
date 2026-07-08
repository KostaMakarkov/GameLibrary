import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getFile, putTextFile } from '../lib/github'
import { getRepoInfo } from '../lib/repoInfo'
import { USER_LISTS_PATH, GITHUB_BRANCH } from '../config'
import type { UserListsDb } from '../types'

const EMPTY_LISTS: UserListsDb = { lists: [] }

export function useUserListsWriter() {
  const { token } = useAuth()

  // Same fresh-read-then-mutate pattern as useDbWriter/useUsersWriter: never
  // write a locally-cached snapshot, always mutate the file's real current
  // content so a stale tab can't clobber someone else's more recent edit.
  const commitLists = useCallback(
    async (mutate: (current: UserListsDb) => UserListsDb, message: string): Promise<UserListsDb> => {
      if (!token) throw new Error('Not logged in')
      const { owner, repo } = getRepoInfo()
      const current = await getFile(token, owner, repo, USER_LISTS_PATH, GITHUB_BRANCH)
      const currentLists: UserListsDb = current ? JSON.parse(current.text) : EMPTY_LISTS
      const nextLists = mutate(currentLists)
      await putTextFile(
        token,
        owner,
        repo,
        USER_LISTS_PATH,
        JSON.stringify(nextLists, null, 2) + '\n',
        message,
        GITHUB_BRANCH,
        current?.sha,
      )
      return nextLists
    },
    [token],
  )

  return { commitLists }
}
