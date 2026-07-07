import { useState } from 'react'
import { getImageUrl } from '../lib/db'
import { StarRating } from './StarRating'
import { RecommendedBadge } from './RecommendedBadge'
import type { Game } from '../types'

interface GameCardProps {
  game: Game
  categoryName: string
  actions?: React.ReactNode
}

export function GameCard({ game, categoryName, actions }: GameCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = getImageUrl(game.imagePath)

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-36 items-center justify-center bg-slate-100 dark:bg-slate-800">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={game.title}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-4xl font-semibold text-slate-300 dark:text-slate-600">
            {game.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold">{game.title}</h3>
          {game.recommended && <RecommendedBadge />}
        </div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {categoryName}
        </p>
        <p className="line-clamp-3 flex-1 text-sm text-slate-600 dark:text-slate-300">
          {game.description}
        </p>
        {(game.platform || game.tags.length > 0) && (
          <div className="flex flex-wrap gap-1 text-xs text-slate-500 dark:text-slate-400">
            {game.platform && <span>{game.platform}</span>}
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <StarRating value={game.rating} />
          {actions}
        </div>
      </div>
    </div>
  )
}
