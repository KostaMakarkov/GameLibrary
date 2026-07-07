import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { GitHubApiError, getAuthenticatedUser, getRepoPermission } from '../lib/github'
import { clearToken, loadToken, saveToken } from '../lib/tokenStorage'
import { getRepoInfo } from '../lib/repoInfo'
import type { Permission } from '../types'

interface AuthState {
  token: string | null
  username: string | null
  permission: Permission | null
  canWrite: boolean
  loading: boolean
  error: string | null
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [permission, setPermission] = useState<Permission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (candidateToken: string) => {
    const { owner, repo } = getRepoInfo()
    const user = await getAuthenticatedUser(candidateToken)
    let repoPermission: Permission = 'none'
    try {
      repoPermission = await getRepoPermission(candidateToken, owner, repo, user.login)
    } catch (err) {
      // Repo permission lookup fails for non-collaborators; treat as read-only.
      repoPermission = 'none'
    }
    setUsername(user.login)
    setPermission(repoPermission)
  }, [])

  useEffect(() => {
    const stored = loadToken()
    if (!stored) {
      setLoading(false)
      return
    }
    setToken(stored)
    verify(stored)
      .catch((err) => {
        setError(err instanceof GitHubApiError ? err.message : 'Failed to verify token')
        clearToken()
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [verify])

  const login = useCallback(
    async (candidateToken: string) => {
      setLoading(true)
      setError(null)
      try {
        await verify(candidateToken)
        saveToken(candidateToken)
        setToken(candidateToken)
      } catch (err) {
        setError(err instanceof GitHubApiError ? err.message : 'Failed to verify token')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [verify],
  )

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    setUsername(null)
    setPermission(null)
  }, [])

  const canWrite = permission === 'admin' || permission === 'write'

  return (
    <AuthContext.Provider
      value={{ token, username, permission, canWrite, loading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
