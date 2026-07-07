import { DEV_GITHUB_OWNER, DEV_GITHUB_REPO } from '../config'

export interface RepoInfo {
  owner: string
  repo: string
}

// On GitHub Pages, the site is served from https://<owner>.github.io/<repo>/,
// so owner/repo can be read straight off the URL instead of hardcoding them.
export function getRepoInfo(): RepoInfo {
  if (import.meta.env.DEV) {
    return { owner: DEV_GITHUB_OWNER, repo: DEV_GITHUB_REPO }
  }
  const owner = window.location.hostname.split('.')[0]
  const repo = window.location.pathname.split('/').filter(Boolean)[0] ?? DEV_GITHUB_REPO
  return { owner, repo }
}
