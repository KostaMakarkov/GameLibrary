import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useDbWriter } from '../hooks/useDbWriter'
import { CategoryForm } from '../components/CategoryForm'
import { GameForm, type GameFormValues } from '../components/GameForm'
import { GameCard } from '../components/GameCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { slugify } from '../lib/slug'
import type { Category, Game } from '../types'

type Tab = 'games' | 'categories'

function nowIso(): string {
  return new Date().toISOString()
}

export function AdminPage() {
  const { username, canWrite, loading } = useAuth()
  const { db } = useData()
  const { commitDb } = useDbWriter()
  const [tab, setTab] = useState<Tab>('games')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [addingCategory, setAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const [addingGame, setAddingGame] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [deletingGame, setDeletingGame] = useState<Game | null>(null)

  if (loading) return <p className="p-8 text-center text-slate-500">Checking access…</p>

  if (!username) {
    return (
      <p className="p-8 text-center">
        You need to <Link to="/login" className="underline">log in</Link> to make changes.
      </p>
    )
  }

  if (!canWrite) {
    return (
      <p className="p-8 text-center text-slate-600 dark:text-slate-300">
        @{username} doesn't have write access to this repo, so admin actions are unavailable.
      </p>
    )
  }

  if (!db) return null

  const runCommit = async (nextDb: typeof db, message: string) => {
    setSaving(true)
    setSaveError(null)
    try {
      await commitDb(nextDb, message)
      return true
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async (name: string) => {
    const category: Category = { id: crypto.randomUUID(), name, slug: slugify(name) }
    const ok = await runCommit(
      { ...db, categories: [...db.categories, category] },
      `Add category: ${name}`,
    )
    if (ok) setAddingCategory(false)
  }

  const handleEditCategory = async (name: string) => {
    if (!editingCategory) return
    const nextCategories = db.categories.map((c) =>
      c.id === editingCategory.id ? { ...c, name, slug: slugify(name) } : c,
    )
    const ok = await runCommit({ ...db, categories: nextCategories }, `Update category: ${name}`)
    if (ok) setEditingCategory(null)
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return
    const nextCategories = db.categories.filter((c) => c.id !== deletingCategory.id)
    const ok = await runCommit(
      { ...db, categories: nextCategories },
      `Delete category: ${deletingCategory.name}`,
    )
    if (ok) setDeletingCategory(null)
  }

  const handleAddGame = async (values: GameFormValues) => {
    const game: Game = {
      id: crypto.randomUUID(),
      ...values,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    const ok = await runCommit({ ...db, games: [...db.games, game] }, `Add game: ${values.title}`)
    if (ok) setAddingGame(false)
  }

  const handleEditGame = async (values: GameFormValues) => {
    if (!editingGame) return
    const nextGames = db.games.map((g) =>
      g.id === editingGame.id ? { ...g, ...values, updatedAt: nowIso() } : g,
    )
    const ok = await runCommit({ ...db, games: nextGames }, `Update game: ${values.title}`)
    if (ok) setEditingGame(null)
  }

  const handleDeleteGame = async () => {
    if (!deletingGame) return
    const nextGames = db.games.filter((g) => g.id !== deletingGame.id)
    const ok = await runCommit({ ...db, games: nextGames }, `Delete game: ${deletingGame.title}`)
    if (ok) setDeletingGame(null)
  }

  const gamesInCategory = (categoryId: string) => db.games.filter((g) => g.categoryId === categoryId).length

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {(['games', 'categories'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-b-2 border-slate-800 dark:border-slate-100'
                : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      {tab === 'categories' && (
        <div className="space-y-3">
          {db.categories.map((category) =>
            editingCategory?.id === category.id ? (
              <CategoryForm
                key={category.id}
                initial={category}
                submitting={saving}
                onSubmit={handleEditCategory}
                onCancel={() => setEditingCategory(null)}
              />
            ) : (
              <div
                key={category.id}
                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <div>
                  <span className="font-medium">{category.name}</span>{' '}
                  <span className="text-xs text-slate-400">
                    ({gamesInCategory(category.id)} games)
                  </span>
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => setEditingCategory(category)} className="underline">
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingCategory(category)}
                    disabled={gamesInCategory(category.id) > 0}
                    title={
                      gamesInCategory(category.id) > 0
                        ? 'Reassign or delete games in this category first'
                        : undefined
                    }
                    className="text-red-600 underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline dark:disabled:text-slate-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}

          {addingCategory ? (
            <CategoryForm
              submitting={saving}
              onSubmit={handleAddCategory}
              onCancel={() => setAddingCategory(false)}
            />
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
            >
              + Add category
            </button>
          )}
        </div>
      )}

      {tab === 'games' && (
        <div className="space-y-4">
          {addingGame && (
            <GameForm
              categories={db.categories}
              submitting={saving}
              onSubmit={handleAddGame}
              onCancel={() => setAddingGame(false)}
            />
          )}

          {!addingGame && !editingGame && (
            <button
              onClick={() => setAddingGame(true)}
              disabled={db.categories.length === 0}
              className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              + Add game
            </button>
          )}
          {db.categories.length === 0 && (
            <p className="text-xs text-slate-400">Create a category first.</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {db.games.map((game) =>
              editingGame?.id === game.id ? (
                <div key={game.id} className="sm:col-span-2 lg:col-span-3">
                  <GameForm
                    categories={db.categories}
                    initial={game}
                    submitting={saving}
                    onSubmit={handleEditGame}
                    onCancel={() => setEditingGame(null)}
                  />
                </div>
              ) : (
                <GameCard
                  key={game.id}
                  game={game}
                  categoryName={
                    db.categories.find((c) => c.id === game.categoryId)?.name ?? 'Uncategorized'
                  }
                  actions={
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => setEditingGame(game)} className="underline">
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingGame(game)}
                        className="text-red-600 underline"
                      >
                        Delete
                      </button>
                    </div>
                  }
                />
              ),
            )}
          </div>
        </div>
      )}

      {deletingCategory && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deletingCategory.name}"? This can't be undone.`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}

      {deletingGame && (
        <ConfirmDialog
          title="Delete game"
          message={`Delete "${deletingGame.title}"? This can't be undone.`}
          onConfirm={handleDeleteGame}
          onCancel={() => setDeletingGame(null)}
        />
      )}
    </div>
  )
}
