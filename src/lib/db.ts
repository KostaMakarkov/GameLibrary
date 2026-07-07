import { DB_PATH, GITHUB_BRANCH } from '../config'
import { getRepoInfo } from './repoInfo'
import type { Db } from '../types'

function getDbUrl(): string {
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}db.json`
  }
  const { owner, repo } = getRepoInfo()
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${GITHUB_BRANCH}/${DB_PATH}`
}

export async function fetchDb(): Promise<Db> {
  const res = await fetch(getDbUrl(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load library data (${res.status})`)
  return res.json()
}

// jsDelivr caches by branch for a while; purge after a write so readers see it right away.
export function purgeDbCache(): void {
  if (import.meta.env.DEV) return
  const { owner, repo } = getRepoInfo()
  fetch(`https://purge.jsdelivr.net/gh/${owner}/${repo}@${GITHUB_BRANCH}/${DB_PATH}`).catch(() => {})
}

export function getImageUrl(imagePath?: string): string | undefined {
  if (!imagePath) return undefined
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}${imagePath}`
  }
  const { owner, repo } = getRepoInfo()
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${GITHUB_BRANCH}/public/${imagePath}`
}
