import { createContext, useContext, useState, type ReactNode } from 'react'

interface EditModeState {
  editMode: boolean
  toggle: () => void
}

const EditModeContext = createContext<EditModeState | null>(null)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false)
  return (
    <EditModeContext.Provider value={{ editMode, toggle: () => setEditMode((v) => !v) }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode(): EditModeState {
  const ctx = useContext(EditModeContext)
  if (!ctx) throw new Error('useEditMode must be used within EditModeProvider')
  return ctx
}
