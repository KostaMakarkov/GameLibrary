import { useCallback } from 'react'
import { getFile, putTextFile } from '../lib/github'
import { purgeUsersCache } from '../lib/users'
import { getRepoInfo } from '../lib/repoInfo'
import { USERS_PATH, GITHUB_BRANCH } from '../config'
import type { UsersDb } from '../types'

export function useUsersWriter() {
  const commitUsers = useCallback(async (token: string, nextUsers: UsersDb, message: string) => {
    const { owner, repo } = getRepoInfo()
    const current = await getFile(token, owner, repo, USERS_PATH, GITHUB_BRANCH)
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
  }, [])

  return { commitUsers }
}
