import { Route, Routes } from 'react-router'
import { Header } from './components/Header'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { AdminPage } from './pages/AdminPage'
import { UsersPage } from './pages/UsersPage'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </div>
  )
}

export default App
