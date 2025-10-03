import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const API_BASE = 'http://localhost:5000/api'

  // Configure axios to include tokens in all requests



// In your AuthContext.jsx, add this:
useEffect(() => {
  // Set up axios interceptor to include token in all requests
  const interceptor = axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return () => {
    axios.interceptors.request.eject(interceptor);
  };
}, []);




  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setCurrentUser({ token })
      // Set default authorization header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const updateAxiosToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/login`, { email, password })
      const { token, user_id, is_premium } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user_id', user_id)
      setCurrentUser({ token, user_id, is_premium })
      updateAxiosToken(token)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const register = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/register`, { email, password })
      const { token, user_id } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user_id', user_id)
      setCurrentUser({ token, user_id })
      updateAxiosToken(token)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    setCurrentUser(null)
    updateAxiosToken(null)
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    API_BASE
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}