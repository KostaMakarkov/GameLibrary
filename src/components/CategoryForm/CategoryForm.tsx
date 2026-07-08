import { useState, type FormEvent } from 'react'
import type { Category } from '../../types'

interface CategoryFormProps {
  initial?: Category
  onSubmit: (name: string) => void
  onCancel: () => void
  submitting?: boolean
}

export function CategoryForm({ initial, onSubmit, onCancel, submitting }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="flex-1 rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
      />
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
    </form>
  )
}
