import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { UsersProvider } from './context/UsersContext'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { EditModeProvider } from './context/EditModeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <UsersProvider>
        <AuthProvider>
          <DataProvider>
            <EditModeProvider>
              <App />
            </EditModeProvider>
          </DataProvider>
        </AuthProvider>
      </UsersProvider>
    </BrowserRouter>
  </StrictMode>,
)
