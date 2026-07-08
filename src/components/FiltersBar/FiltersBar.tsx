import type { Category } from '../../types'

export type SortOption = 'title' | 'rating-desc' | 'recently-added'

export interface Filters {
  search: string
  categoryId: string | 'all'
  recommendedOnly: boolean
  minRating: number
  sort: SortOption
}

interface FiltersBarProps {
  categories: Category[]
  filters: Filters
  onChange: (filters: Filters) => void
}

export function FiltersBar({ categories, filters, onChange }: FiltersBarProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <input
        type="search"
        placeholder="Search by title…"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="min-w-[10rem] flex-1 rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
      />

      <select
        value={filters.categoryId}
        onChange={(e) => update({ categoryId: e.target.value })}
        className="rounded border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={filters.minRating}
        onChange={(e) => update({ minRating: Number(e.target.value) })}
        className="rounded border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700"
      >
        <option value={0}>Any rating</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}+ stars
          </option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value as SortOption })}
        className="rounded border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700"
      >
        <option value="title">Sort: Title</option>
        <option value="rating-desc">Sort: Rating (high to low)</option>
        <option value="recently-added">Sort: Recently added</option>
      </select>

      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={filters.recommendedOnly}
          onChange={(e) => update({ recommendedOnly: e.target.checked })}
        />
        Recommended only
      </label>
    </div>
  )
}
