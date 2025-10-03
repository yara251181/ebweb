import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import PremiumHeader from './components/PremiumHeader'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Notes from './pages/Notes'
import ViewNote from './pages/ViewNote'
import './index.css'

function App() {
  const { currentUser } = useAuth()
  const { isDark } = useTheme()

  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        <PremiumHeader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={currentUser ? <Navigate to="/notes" /> : <Login />} />
          <Route path="/register" element={currentUser ? <Navigate to="/notes" /> : <Register />} />
          <Route path="/notes" element={currentUser ? <Notes /> : <Navigate to="/login" />} />
          <Route path="/notes/:id" element={currentUser ? <ViewNote /> : <Navigate to="/login" />} />
          <Route path="/subjects" element={<Navigate to="/notes" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App