import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useOptimisticCommit } from '../../hooks/useOptimisticCommit'
import { useListMembership } from '../../hooks/useListMembership'
import { useCreateCategory } from '../../hooks/useCreateCategory'
import { FloatingAddButton } from '../FloatingAddButton'
import { Modal } from '../Modal'
import { GameForm, type GameFormValues } from '../GameForm'
import type { Game } from '../../types'

function nowIso(): string {
  return new Date().toISOString()
}

// Rendered once at the app root so "Add game" is reachable from any page,
// not just the main library view.
export function AddGameLauncher() {
  const { currentUser, canWrite } = useAuth()
  const { db } = useData()
  const { run } = useOptimisticCommit()
  const { applySelection } = useListMembership()
  const { createCategory } = useCreateCategory()
  const [open, setOpen] = useState(false)

  if (!canWrite || !db) return null

  const handleAddGame = (values: GameFormValues, listIds: string[]) => {
    const game: Game = {
      id: crypto.randomUUID(),
      ...values,
      createdBy: currentUser?.displayName ?? 'unknown',
      createdByUserId: currentUser?.id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    run(
      (current) => ({ ...current, games: [...current.games, game] }),
      `Add game: ${values.title}`,
      `Added "${values.title}"`,
      `Failed to add "${values.title}"`,
    )
    applySelection(game.id, listIds)
    setOpen(false)
  }

  return (
    <>
      {!open && <FloatingAddButton onClick={() => setOpen(true)} />}
      {open && (
        <Modal title="Add game" onClose={() => setOpen(false)}>
          <GameForm
            categories={db.categories}
            existingTitles={db.games.map((g) => g.title)}
            onCreateCategory={createCategory}
            onSubmit={handleAddGame}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  )
}
