import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { UsersProvider } from './context/UsersContext'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { UserListsProvider } from './context/UserListsContext'
import { EditModeProvider } from './context/EditModeContext'
import { ToastProvider } from './context/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <UsersProvider>
          <AuthProvider>
            <DataProvider>
              <UserListsProvider>
                <EditModeProvider>
                  <App />
                </EditModeProvider>
              </UserListsProvider>
            </DataProvider>
          </AuthProvider>
        </UsersProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
