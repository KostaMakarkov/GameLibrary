import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useUsers } from '../context/UsersContext'
import { useUserLists } from '../context/UserListsContext'
import { useOptimisticListsCommit } from '../hooks/useOptimisticListsCommit'
import { GameCard } from '../components/GameCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { PersonalList } from '../types'

type Tab = { kind: 'uploaded' } | { kind: 'list'; list: PersonalList }

export function PersonalPage() {
  const { userId } = useParams<{ userId: string }>()
  const { currentUser } = useAuth()
  const { db, loading: dbLoading } = useData()
  const { usersDb, loading: usersLoading } = useUsers()
  const { listsDb, loading: listsLoading } = useUserLists()
  const { run } = useOptimisticListsCommit()

  const [tab, setTab] = useState<Tab>({ kind: 'uploaded' })
  const [newListName, setNewListName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleting, setDeleting] = useState<PersonalList | null>(null)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    db?.categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [db])

  if (dbLoading || usersLoading || listsLoading) {
    return <p className="p-8 text-center text-slate-500">Loading…</p>
  }

  const targetUser = usersDb?.users.find((u) => u.id === userId)

  if (!db || !usersDb || !listsDb || !targetUser) {
    return <p className="p-8 text-center text-slate-500">User not found.</p>
  }

  const isOwnPage = currentUser?.id === userId

  const uploadedGames = db.games.filter(
    (g) => g.createdByUserId === userId || (!g.createdByUserId && g.createdBy === targetUser.displayName),
  )
  const myLists = listsDb.lists.filter((l) => l.ownerId === userId)

  const activeGames = tab.kind === 'uploaded' ? uploadedGames : db.games.filter((g) => tab.list.gameIds.includes(g.id))

  const handleCreateList = () => {
    const name = newListName.trim()
    if (!name || !currentUser) return
    const newList: PersonalList = { id: crypto.randomUUID(), ownerId: currentUser.id, name, gameIds: [] }
    run(
      (current) => ({ lists: [...current.lists, newList] }),
      `Create list: ${name}`,
      `Created "${name}"`,
      'Failed to create list',
    )
    setNewListName('')
  }

  const handleRenameList = () => {
    if (tab.kind !== 'list') return
    const name = renameValue.trim()
    if (!name) return
    const listId = tab.list.id
    run(
      (current) => ({ lists: current.lists.map((l) => (l.id === listId ? { ...l, name } : l)) }),
      `Rename list to: ${name}`,
      `Renamed to "${name}"`,
      'Failed to rename list',
    )
    setTab({ kind: 'list', list: { ...tab.list, name } })
    setRenaming(false)
  }

  const handleDeleteList = () => {
    if (!deleting) return
    const listId = deleting.id
    run(
      (current) => ({ lists: current.lists.filter((l) => l.id !== listId) }),
      `Delete list: ${deleting.name}`,
      `Deleted "${deleting.name}"`,
      'Failed to delete list',
    )
    setTab({ kind: 'uploaded' })
    setDeleting(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold">{targetUser.displayName}'s library</h1>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab({ kind: 'uploaded' })}
          className={`px-3 py-2 text-sm font-medium ${
            tab.kind === 'uploaded' ? 'border-b-2 border-slate-800 dark:border-slate-100' : 'text-slate-500'
          }`}
        >
          Uploaded
        </button>
        {myLists.map((list) => (
          <button
            key={list.id}
            onClick={() => setTab({ kind: 'list', list })}
            className={`px-3 py-2 text-sm font-medium ${
              tab.kind === 'list' && tab.list.id === list.id
                ? 'border-b-2 border-slate-800 dark:border-slate-100'
                : 'text-slate-500'
            }`}
          >
            {list.name}
          </button>
        ))}
      </div>

      {isOwnPage && tab.kind === 'list' && (
        <div className="flex items-center gap-3 text-sm">
          {renaming ? (
            <>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="rounded border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-700"
              />
              <button onClick={handleRenameList} className="underline">
                Save
              </button>
              <button onClick={() => setRenaming(false)} className="text-slate-500">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setRenameValue(tab.list.name)
                  setRenaming(true)
                }}
                className="underline"
              >
                Rename list
              </button>
              <button onClick={() => setDeleting(tab.list)} className="text-red-600 underline">
                Delete list
              </button>
            </>
          )}
        </div>
      )}

      {isOwnPage && tab.kind === 'uploaded' && (
        <div className="flex gap-2">
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name…"
            className="rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
          />
          <button
            onClick={handleCreateList}
            disabled={!newListName.trim()}
            className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          >
            + New list
          </button>
        </div>
      )}

      {activeGames.length === 0 ? (
        <p className="py-12 text-center text-slate-500">
          {tab.kind === 'uploaded' ? 'No games uploaded yet.' : 'No games in this list yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              categoryName={categoryNameById.get(game.categoryId) ?? 'Uncategorized'}
            />
          ))}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete list"
          message={`Delete "${deleting.name}"? This can't be undone.`}
          onConfirm={handleDeleteList}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
