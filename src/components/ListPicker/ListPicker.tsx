import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUserLists } from '../../context/UserListsContext'
import { useOptimisticListsCommit } from '../../hooks/useOptimisticListsCommit'

interface ListPickerProps {
  gameId: string
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function ListPicker({ gameId }: ListPickerProps) {
  const { currentUser } = useAuth()
  const { listsDb } = useUserLists()
  const { run } = useOptimisticListsCommit()
  const [open, setOpen] = useState(false)
  const [newListName, setNewListName] = useState('')

  if (!currentUser || !listsDb) return null

  const myLists = listsDb.lists.filter((l) => l.ownerId === currentUser.id)

  const toggleGame = (listId: string, name: string, inList: boolean) => {
    run(
      (current) => ({
        lists: current.lists.map((l) =>
          l.id === listId
            ? {
                ...l,
                gameIds: inList ? l.gameIds.filter((id) => id !== gameId) : [...l.gameIds, gameId],
              }
            : l,
        ),
      }),
      inList ? `Remove game from list: ${name}` : `Add game to list: ${name}`,
      inList ? `Removed from "${name}"` : `Added to "${name}"`,
      'Failed to update list',
    )
  }

  const handleCreateList = () => {
    const name = newListName.trim()
    if (!name) return
    const newList = { id: crypto.randomUUID(), ownerId: currentUser.id, name, gameIds: [gameId] }
    run(
      (current) => ({ lists: [...current.lists, newList] }),
      `Create list: ${name}`,
      `Created "${name}"`,
      'Failed to create list',
    )
    setNewListName('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Add to list"
        aria-expanded={open}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <BookmarkIcon />
      </button>
      {open && (
        <>
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="absolute right-0 z-30 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            {myLists.length === 0 && <p className="px-2 py-1 text-xs text-slate-400">No lists yet</p>}
            {myLists.map((list) => {
              const inList = list.gameIds.includes(gameId)
              return (
                <label
                  key={list.id}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={inList}
                    onChange={() => toggleGame(list.id, list.name, inList)}
                  />
                  {list.name}
                </label>
              )
            })}
            <div className="mt-1 flex gap-1 border-t border-slate-200 pt-1 dark:border-slate-800">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list…"
                className="flex-1 rounded border border-slate-300 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
              />
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="rounded bg-slate-800 px-2 py-1 text-xs text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
