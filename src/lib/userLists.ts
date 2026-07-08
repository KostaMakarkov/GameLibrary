import { GITHUB_BRANCH, USER_LISTS_PATH } from '../config'
import { getRepoInfo } from './repoInfo'
import type { UserListsDb } from '../types'

function getUserListsUrl(): string {
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}userLists.json`
  }
  const { owner, repo } = getRepoInfo()
  return `https://raw.githubusercontent.com/${owner}/${repo}/${GITHUB_BRANCH}/${USER_LISTS_PATH}`
}

export async function fetchUserLists(): Promise<UserListsDb> {
  const res = await fetch(getUserListsUrl(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load personal lists (${res.status})`)
  return res.json()
}
