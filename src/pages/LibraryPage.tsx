import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { GameCard } from '../components/GameCard'
import { FiltersBar, type Filters } from '../components/FiltersBar'
import type { Game } from '../types'

const DEFAULT_FILTERS: Filters = {
  search: '',
  categoryId: 'all',
  recommendedOnly: false,
  minRating: 0,
  sort: 'title',
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
  const { db, loading, error } = useData()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <FiltersBar categories={db.categories} filters={filters} onChange={setFilters} />

      {filteredGames.length === 0 ? (
        <p className="py-12 text-center text-slate-500">No games match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              categoryName={categoryNameById.get(game.categoryId) ?? 'Uncategorized'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
