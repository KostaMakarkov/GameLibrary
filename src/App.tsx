import { Route, Routes } from 'react-router'
import { Header } from './components/Header'
import { ToastContainer } from './components/ToastContainer'
import { AddGameLauncher } from './components/AddGameLauncher'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { UsersPage } from './pages/UsersPage'
import { PersonalPage } from './pages/PersonalPage'
import { CommunityPage } from './pages/CommunityPage'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/u/:userId" element={<PersonalPage />} />
      </Routes>
      <AddGameLauncher />
      <ToastContainer />
    </div>
  )
}

export default App
