import { GITHUB_BRANCH, USERS_PATH } from '../config'
import { getRepoInfo } from './repoInfo'
import type { UsersDb } from '../types'

function getUsersUrl(): string {
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}users.json`
  }
  const { owner, repo } = getRepoInfo()
  return `https://raw.githubusercontent.com/${owner}/${repo}/${GITHUB_BRANCH}/${USERS_PATH}`
}

export async function fetchUsers(): Promise<UsersDb> {
  const res = await fetch(getUsersUrl(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load users (${res.status})`)
  return res.json()
}
