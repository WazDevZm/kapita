import { create } from 'zustand'
import { authAPI } from '../services/api'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const response = await authAPI.login(credentials)
      const { access, refresh } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Get user profile
      const profileResponse = await authAPI.getProfile()
      set({ 
        user: profileResponse.data, 
        isAuthenticated: true, 
        loading: false 
      })
      
      return { success: true }
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Login failed', 
        loading: false 
      })
      return { success: false, error: error.response?.data }
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null })
    try {
      await authAPI.register(userData)
      set({ loading: false })
      return { success: true }
    } catch (error) {
      set({ 
        error: error.response?.data || 'Registration failed', 
        loading: false 
      })
      return { success: false, error: error.response?.data }
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    try {
      const response = await authAPI.getProfile()
      set({ user: response.data })
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await authAPI.updateProfile(data)
      set({ user: response.data })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data }
    }
  },
}))
