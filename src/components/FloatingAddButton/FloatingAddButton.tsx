interface FloatingAddButtonProps {
  onClick: () => void
  label?: string
}

export function FloatingAddButton({ onClick, label = 'Add game' }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl text-white shadow-lg hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
    >
      +
    </button>
  )
}
