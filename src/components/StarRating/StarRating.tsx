interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={`text-lg leading-none ${onChange ? 'cursor-pointer' : 'cursor-default'} ${
            star <= value ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
