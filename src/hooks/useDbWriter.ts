import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getFile, putTextFile } from '../lib/github'
import { getRepoInfo } from '../lib/repoInfo'
import { DB_PATH, GITHUB_BRANCH } from '../config'
import type { Db } from '../types'

const EMPTY_DB: Db = { categories: [], games: [] }

export function useDbWriter() {
  const { token } = useAuth()

  // mutate receives the file's CURRENT content, fetched fresh right before the
  // write - never the caller's possibly-stale local copy - so a write from a
  // browser tab that hasn't seen someone else's newer edit can't clobber it.
  const commitDb = useCallback(
    async (mutate: (current: Db) => Db, message: string): Promise<Db> => {
      if (!token) throw new Error('Not logged in')
      const { owner, repo } = getRepoInfo()
      const current = await getFile(token, owner, repo, DB_PATH, GITHUB_BRANCH)
      const currentDb: Db = current ? JSON.parse(current.text) : EMPTY_DB
      const nextDb = mutate(currentDb)
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
      return nextDb
    },
    [token],
  )

  return { commitDb }
}
