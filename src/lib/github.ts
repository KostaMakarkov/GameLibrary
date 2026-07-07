import { IMAGES_DIR } from '../config'
import type { Permission } from '../types'

const API = 'https://api.github.com'

export class GitHubApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function ghFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new GitHubApiError(res.status, body.message ?? `GitHub API error ${res.status}`)
  }
  return res
}

export async function getAuthenticatedUser(token: string): Promise<{ login: string }> {
  const res = await ghFetch(token, '/user')
  return res.json()
}

export async function getRepoPermission(
  token: string,
  owner: string,
  repo: string,
  username: string,
): Promise<Permission> {
  const res = await ghFetch(token, `/repos/${owner}/${repo}/collaborators/${username}/permission`)
  const data = await res.json()
  return data.permission as Permission
}

export interface RemoteFile {
  text: string
  sha: string
}

export async function getFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<RemoteFile | null> {
  try {
    const res = await ghFetch(token, `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)
    const data = await res.json()
    return { text: decodeBase64Utf8(data.content), sha: data.sha }
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return null
    throw err
  }
}

export async function putTextFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  text: string,
  message: string,
  branch: string,
  sha?: string,
): Promise<void> {
  await ghFetch(token, `/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: encodeBase64Utf8(text), sha, branch }),
  })
}

export async function uploadImage(
  token: string,
  owner: string,
  repo: string,
  file: File,
  branch: string,
): Promise<string> {
  const base64 = await fileToBase64(file)
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  const path = `${IMAGES_DIR}/${filename}`
  await ghFetch(token, `/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message: `Add image ${filename}`, content: base64, branch }),
  })
  return `assets/games/${filename}`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}
