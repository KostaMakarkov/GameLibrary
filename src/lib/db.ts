import { GITHUB_BRANCH } from '../config'
import { getRepoInfo } from './repoInfo'
import type { Db } from '../types'

// raw.githubusercontent.com is used instead of jsDelivr: its cache window is
// short and predictable (~5 min), with no separate branch-pointer cache to
// go stale independently of file content, and no purge step required.
function getDbUrl(): string {
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}db.json`
  }
  const { owner, repo } = getRepoInfo()
  return `https://raw.githubusercontent.com/${owner}/${repo}/${GITHUB_BRANCH}/public/db.json`
}

export async function fetchDb(): Promise<Db> {
  const res = await fetch(getDbUrl(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load library data (${res.status})`)
  return res.json()
}

export function getImageUrl(imagePath?: string): string | undefined {
  if (!imagePath) return undefined
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}${imagePath}`
  }
  const { owner, repo } = getRepoInfo()
  return `https://raw.githubusercontent.com/${owner}/${repo}/${GITHUB_BRANCH}/public/${imagePath}`
}
