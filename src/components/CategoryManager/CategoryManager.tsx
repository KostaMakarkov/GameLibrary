import { useState } from 'react'
import { CategoryForm } from '../CategoryForm'
import { ConfirmDialog } from '../ConfirmDialog'
import type { Category } from '../../types'

interface CategoryManagerProps {
  categories: Category[]
  gamesCountByCategory: (categoryId: string) => number
  onAdd: (name: string) => void
  onEdit: (category: Category, name: string) => void
  onDelete: (category: Category) => void
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

  return (
    <div className="space-y-3">
      {categories.map((category) =>
        editing?.id === category.id ? (
          <CategoryForm
            key={category.id}
            initial={category}
            onSubmit={(name) => {
              onEdit(category, name)
              setEditing(null)
            }}
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
          onSubmit={(name) => {
            onAdd(name)
            setAdding(false)
          }}
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
          onConfirm={() => {
            onDelete(deleting)
            setDeleting(null)
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
