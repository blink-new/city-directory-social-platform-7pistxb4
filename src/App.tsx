import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { UserProfilePage } from './pages/UserProfilePage'
import { ChatPage } from './pages/ChatPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user/:username" element={<UserProfilePage />} />
          <Route path="/chat/:username" element={<ChatPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App