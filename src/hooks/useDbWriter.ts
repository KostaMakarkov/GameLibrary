import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getFile, putTextFile } from '../lib/github'
import { purgeDbCache } from '../lib/db'
import { getRepoInfo } from '../lib/repoInfo'
import { DB_PATH, GITHUB_BRANCH } from '../config'
import type { Db } from '../types'

export function useDbWriter() {
  const { token } = useAuth()
  const { applyDb } = useData()

  const commitDb = useCallback(
    async (nextDb: Db, message: string) => {
      if (!token) throw new Error('Not logged in')
      const { owner, repo } = getRepoInfo()
      const current = await getFile(token, owner, repo, DB_PATH, GITHUB_BRANCH)
      await putTextFile(
        token,
        owner,
        repo,
        DB_PATH,
        JSON.stringify(nextDb, null, 2) + '\n',
        message,
        GITHUB_BRANCH,
        current?.sha,
      )
      purgeDbCache()
      applyDb(nextDb)
    },
    [token, applyDb],
  )

  return { commitDb }
}
