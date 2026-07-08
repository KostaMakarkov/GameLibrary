import { useCallback } from 'react'
import { getFile, putTextFile } from '../lib/github'
import { purgeUsersCache } from '../lib/users'
import { getRepoInfo } from '../lib/repoInfo'
import { USERS_PATH, GITHUB_BRANCH } from '../config'
import type { UsersDb } from '../types'

const EMPTY_USERS: UsersDb = { users: [] }

export function useUsersWriter() {
  // mutate receives the file's CURRENT content, fetched fresh right before the
  // write, so a stale local copy of the user list can't clobber someone else's
  // more recent change (e.g. two add-user actions in close succession).
  const commitUsers = useCallback(
    async (token: string, mutate: (current: UsersDb) => UsersDb, message: string): Promise<UsersDb> => {
      const { owner, repo } = getRepoInfo()
      const current = await getFile(token, owner, repo, USERS_PATH, GITHUB_BRANCH)
      const currentUsers: UsersDb = current ? JSON.parse(current.text) : EMPTY_USERS
      const nextUsers = mutate(currentUsers)
      await putTextFile(
        token,
        owner,
        repo,
        USERS_PATH,
        JSON.stringify(nextUsers, null, 2) + '\n',
        message,
        GITHUB_BRANCH,
        current?.sha,
      )
      purgeUsersCache()
      return nextUsers
    },
    [],
  )

  return { commitUsers }
}
