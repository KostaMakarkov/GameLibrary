import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAuthenticatedUser, getRepoPermission } from '../lib/github'
import { decryptWithPin, encryptWithPin } from '../lib/crypto'
import { clearSession, loadSession, saveSession } from '../lib/session'
import { getRepoInfo } from '../lib/repoInfo'
import { useUsers } from './UsersContext'
import { useUsersWriter } from '../hooks/useUsersWriter'
import type { Permission, StoredUser } from '../types'

interface AuthState {
  currentUser: StoredUser | null
  username: string | null
  token: string | null
  permission: Permission | null
  canWrite: boolean
  isOwner: boolean
  loading: boolean
  loginWithPin: (userId: string, pin: string) => Promise<void>
  completeFirstLogin: (userId: string, tempPin: string, newPin: string) => Promise<void>
  bootstrapOwner: (username: string, rawToken: string, pin: string) => Promise<void>
  addUser: (username: string, displayName: string, tempPin: string) => Promise<void>
  removeUser: (userId: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usersDb, loading: usersLoading, applyUsers } = useUsers()
  const { commitUsers } = useUsersWriter()
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [permission, setPermission] = useState<Permission | null>(null)
  const [loading, setLoading] = useState(true)

  // Verifies a token against GitHub and records it as the active session identity.
  const establishSession = useCallback(async (candidateToken: string) => {
    const { owner, repo } = getRepoInfo()
    const user = await getAuthenticatedUser(candidateToken)
    let repoPermission: Permission = 'none'
    try {
      repoPermission = await getRepoPermission(candidateToken, owner, repo, user.login)
    } catch {
      repoPermission = 'none'
    }
    setUsername(user.login)
    setPermission(repoPermission)
  }, [])

  useEffect(() => {
    if (usersLoading) return
    const session = loadSession()
    if (!session || !usersDb) {
      setLoading(false)
      return
    }
    const user = usersDb.users.find((u) => u.id === session.userId)
    if (!user) {
      clearSession()
      setLoading(false)
      return
    }
    setCurrentUser(user)
    setToken(session.token)
    establishSession(session.token)
      .catch(() => {
        clearSession()
        setCurrentUser(null)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [usersLoading, usersDb, establishSession])

  const loginWithPin = useCallback(
    async (userId: string, pin: string) => {
      if (!usersDb) throw new Error('Users not loaded yet')
      const user = usersDb.users.find((u) => u.id === userId)
      if (!user) throw new Error('User not found')
      const decrypted = await decryptWithPin(pin, user)
      if (!decrypted) throw new Error('Incorrect PIN')
      await establishSession(decrypted)
      setCurrentUser(user)
      setToken(decrypted)
      saveSession({ userId: user.id, token: decrypted })
    },
    [usersDb, establishSession],
  )

  const completeFirstLogin = useCallback(
    async (userId: string, tempPin: string, newPin: string) => {
      if (!usersDb) throw new Error('Users not loaded yet')
      const user = usersDb.users.find((u) => u.id === userId)
      if (!user) throw new Error('User not found')
      const decrypted = await decryptWithPin(tempPin, user)
      if (!decrypted) throw new Error('Incorrect temporary PIN')
      await establishSession(decrypted)
      const encrypted = await encryptWithPin(newPin, decrypted)
      const nextUsers = await commitUsers(
        decrypted,
        (current) => ({
          users: current.users.map((u) => (u.id === userId ? { ...u, ...encrypted, mustChangePin: false } : u)),
        }),
        `${user.displayName} set their PIN`,
      )
      applyUsers(nextUsers)
      const nextUser = nextUsers.users.find((u) => u.id === userId) ?? { ...user, ...encrypted, mustChangePin: false }
      setCurrentUser(nextUser)
      setToken(decrypted)
      saveSession({ userId: nextUser.id, token: decrypted })
    },
    [usersDb, establishSession, commitUsers, applyUsers],
  )

  const bootstrapOwner = useCallback(
    async (usernameInput: string, rawToken: string, pin: string) => {
      const { owner, repo } = getRepoInfo()
      const ghUser = await getAuthenticatedUser(rawToken)
      if (ghUser.login !== usernameInput) {
        throw new Error(`That token belongs to @${ghUser.login}, not @${usernameInput}`)
      }
      const perm = await getRepoPermission(rawToken, owner, repo, usernameInput)
      if (perm !== 'admin' && perm !== 'write') {
        throw new Error('This token does not have write access to the repo')
      }
      const encrypted = await encryptWithPin(pin, rawToken)
      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        username: usernameInput,
        displayName: usernameInput,
        isOwner: true,
        mustChangePin: false,
        ...encrypted,
      }
      const nextUsers = await commitUsers(
        rawToken,
        (current) => {
          if (current.users.length > 0) throw new Error('Someone already set up the owner account')
          return { users: [newUser] }
        },
        `Set up owner account: ${usernameInput}`,
      )
      applyUsers(nextUsers)
      setUsername(ghUser.login)
      setPermission(perm)
      setCurrentUser(newUser)
      setToken(rawToken)
      saveSession({ userId: newUser.id, token: rawToken })
    },
    [commitUsers, applyUsers],
  )

  const addUser = useCallback(
    async (usernameInput: string, displayName: string, tempPin: string) => {
      if (!token) throw new Error('Not logged in')
      // Friends without their own GitHub account share the owner's write token,
      // each encrypted under their own PIN.
      const encrypted = await encryptWithPin(tempPin, token)
      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        username: usernameInput,
        displayName,
        isOwner: false,
        mustChangePin: true,
        ...encrypted,
      }
      const nextUsers = await commitUsers(
        token,
        (current) => {
          if (current.users.some((u) => u.username.toLowerCase() === usernameInput.toLowerCase())) {
            throw new Error('That username is already taken')
          }
          return { users: [...current.users, newUser] }
        },
        `Add user: ${displayName}`,
      )
      applyUsers(nextUsers)
    },
    [token, commitUsers, applyUsers],
  )

  const removeUser = useCallback(
    async (userId: string) => {
      if (!token) throw new Error('Not logged in')
      const knownTarget = usersDb?.users.find((u) => u.id === userId)
      const nextUsers = await commitUsers(
        token,
        (current) => {
          const target = current.users.find((u) => u.id === userId)
          if (!target) return current
          if (target.isOwner) throw new Error("Can't remove the owner account")
          return { users: current.users.filter((u) => u.id !== userId) }
        },
        `Remove user: ${knownTarget?.displayName ?? userId}`,
      )
      applyUsers(nextUsers)
    },
    [usersDb, token, commitUsers, applyUsers],
  )

  const logout = useCallback(() => {
    clearSession()
    setCurrentUser(null)
    setToken(null)
    setUsername(null)
    setPermission(null)
  }, [])

  const canWrite = permission === 'admin' || permission === 'write'
  const isOwner = currentUser?.isOwner ?? false

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        username,
        token,
        permission,
        canWrite,
        isOwner,
        loading,
        loginWithPin,
        completeFirstLogin,
        bootstrapOwner,
        addUser,
        removeUser,
        logout,
      }}
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
