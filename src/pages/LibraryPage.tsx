import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useEditMode } from '../context/EditModeContext'
import { useDbWriter } from '../hooks/useDbWriter'
import { GameCard } from '../components/GameCard'
import { FiltersBar, type Filters } from '../components/FiltersBar'
import { FloatingAddButton } from '../components/FloatingAddButton'
import { Modal } from '../components/Modal'
import { GameForm, type GameFormValues } from '../components/GameForm'
import { CategoryManager } from '../components/CategoryManager'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { slugify } from '../lib/slug'
import type { Category, Db, Game } from '../types'

const DEFAULT_FILTERS: Filters = {
  search: '',
  categoryId: 'all',
  recommendedOnly: false,
  minRating: 0,
  sort: 'title',
}

function nowIso(): string {
  return new Date().toISOString()
}

function sortGames(games: Game[], sort: Filters['sort']): Game[] {
  const sorted = [...games]
  switch (sort) {
    case 'rating-desc':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'recently-added':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    default:
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
  }
}

export function LibraryPage() {
  const { currentUser, canWrite } = useAuth()
  const { db, loading, error } = useData()
  const { editMode } = useEditMode()
  const { commitDb } = useDbWriter()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const [addingGame, setAddingGame] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [deletingGame, setDeletingGame] = useState<Game | null>(null)
  const [managingCategories, setManagingCategories] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    db?.categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [db])

  const filteredGames = useMemo(() => {
    if (!db) return []
    const search = filters.search.trim().toLowerCase()
    const filtered = db.games.filter((game) => {
      if (filters.categoryId !== 'all' && game.categoryId !== filters.categoryId) return false
      if (filters.recommendedOnly && !game.recommended) return false
      if (game.rating < filters.minRating) return false
      if (search && !game.title.toLowerCase().includes(search)) return false
      return true
    })
    return sortGames(filtered, filters.sort)
  }, [db, filters])

  if (loading) {
    return <p className="p-8 text-center text-slate-500">Loading library…</p>
  }

  if (error) {
    return <p className="p-8 text-center text-red-600">{error}</p>
  }

  if (!db) return null

  const runCommit = async (nextDb: Db, message: string) => {
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

  const handleAddGame = async (values: GameFormValues) => {
    const game: Game = {
      id: crypto.randomUUID(),
      ...values,
      createdBy: currentUser?.displayName ?? 'unknown',
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

  const handleCreateCategory = async (name: string): Promise<Category> => {
    const category: Category = { id: crypto.randomUUID(), name, slug: slugify(name) }
    await commitDb({ ...db, categories: [...db.categories, category] }, `Add category: ${name}`)
    return category
  }

  const handleAddCategory = async (name: string) => {
    await handleCreateCategory(name)
  }

  const handleEditCategory = async (category: Category, name: string) => {
    const nextCategories = db.categories.map((c) =>
      c.id === category.id ? { ...c, name, slug: slugify(name) } : c,
    )
    await commitDb({ ...db, categories: nextCategories }, `Update category: ${name}`)
  }

  const handleDeleteCategory = async (category: Category) => {
    const nextCategories = db.categories.filter((c) => c.id !== category.id)
    await commitDb({ ...db, categories: nextCategories }, `Delete category: ${category.name}`)
  }

  const gamesInCategory = (categoryId: string) => db.games.filter((g) => g.categoryId === categoryId).length

  const canEdit = canWrite && editMode

  const renderGameCard = (game: Game) => (
    <GameCard
      key={game.id}
      game={game}
      categoryName={categoryNameById.get(game.categoryId) ?? 'Uncategorized'}
      actions={
        canEdit ? (
          <div className="flex gap-2 text-xs">
            <button onClick={() => setEditingGame(game)} className="underline">
              Edit
            </button>
            <button onClick={() => setDeletingGame(game)} className="text-red-600 underline">
              Delete
            </button>
          </div>
        ) : undefined
      }
    />
  )

  const recentlyAdded = sortGames(db.games, 'recently-added').slice(0, 3)

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24">
      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      {recentlyAdded.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recently added
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyAdded.map(renderGameCard)}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-3">
        <FiltersBar categories={db.categories} filters={filters} onChange={setFilters} />
      </div>

      {canEdit && (
        <button
          onClick={() => setManagingCategories(true)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Manage categories
        </button>
      )}

      {filteredGames.length === 0 ? (
        <p className="py-12 text-center text-slate-500">No games match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map(renderGameCard)}
        </div>
      )}

      {canWrite && <FloatingAddButton onClick={() => setAddingGame(true)} />}

      {(addingGame || editingGame) && (
        <Modal title={editingGame ? 'Edit game' : 'Add game'} onClose={() => (editingGame ? setEditingGame(null) : setAddingGame(false))}>
          <GameForm
            categories={db.categories}
            initial={editingGame ?? undefined}
            submitting={saving}
            onCreateCategory={handleCreateCategory}
            onSubmit={editingGame ? handleEditGame : handleAddGame}
            onCancel={() => (editingGame ? setEditingGame(null) : setAddingGame(false))}
          />
        </Modal>
      )}

      {managingCategories && (
        <Modal title="Manage categories" onClose={() => setManagingCategories(false)}>
          <CategoryManager
            categories={db.categories}
            gamesCountByCategory={gamesInCategory}
            onAdd={handleAddCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </Modal>
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
