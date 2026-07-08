import { useState } from 'react'
import { CategoryForm } from '../CategoryForm'
import { ConfirmDialog } from '../ConfirmDialog'
import type { Category } from '../../types'

interface CategoryManagerProps {
  categories: Category[]
  gamesCountByCategory: (categoryId: string) => number
  onAdd: (name: string) => Promise<void>
  onEdit: (category: Category, name: string) => Promise<void>
  onDelete: (category: Category) => Promise<void>
}

export function CategoryManager({
  categories,
  gamesCountByCategory,
  onAdd,
  onEdit,
  onDelete,
}: CategoryManagerProps) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>, onDone: () => void) => {
    setSubmitting(true)
    setError(null)
    try {
      await fn()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {categories.map((category) =>
        editing?.id === category.id ? (
          <CategoryForm
            key={category.id}
            initial={category}
            submitting={submitting}
            onSubmit={(name) => run(() => onEdit(category, name), () => setEditing(null))}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div
            key={category.id}
            className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-800"
          >
            <div>
              <span className="font-medium">{category.name}</span>{' '}
              <span className="text-xs text-slate-400">
                ({gamesCountByCategory(category.id)} games)
              </span>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => setEditing(category)} className="underline">
                Edit
              </button>
              <button
                onClick={() => setDeleting(category)}
                disabled={gamesCountByCategory(category.id) > 0}
                title={
                  gamesCountByCategory(category.id) > 0
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

      {adding ? (
        <CategoryForm
          submitting={submitting}
          onSubmit={(name) => run(() => onAdd(name), () => setAdding(false))}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          + Add category
        </button>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleting.name}"? This can't be undone.`}
          onConfirm={() => run(() => onDelete(deleting), () => setDeleting(null))}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
