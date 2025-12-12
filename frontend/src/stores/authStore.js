import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { api } from '../services/api'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            activeRole: null, // Track which dashboard view is currently active

            login: async (username, password) => {
                try {
                    // Login endpoint expects query parameters, not JSON body
                    const formData = new URLSearchParams()
                    formData.append('username', username)
                    formData.append('password', password)

                    const response = await api.post(`/auth/login`, formData, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })

                    const { access_token } = response.data

                    // Store token in localStorage
                    localStorage.setItem('token', access_token)

                    // Set token in axios defaults
                    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

                    // Get user info
                    const userResponse = await api.get(`/auth/me`)

                    set({
                        user: userResponse.data,
                        token: access_token,
                        isAuthenticated: true,
                    })

                    return { success: true, user: userResponse.data }
                } catch (error) {
                    console.error('Login error:', error)

                    let errorMessage = 'Login failed'
                    if (error.response?.data?.detail) {
                        const detail = error.response.data.detail
                        if (typeof detail === 'string') {
                            errorMessage = detail
                        } else if (Array.isArray(detail)) {
                            errorMessage = detail.map(err => err.msg || err).join(', ')
                        } else if (typeof detail === 'object') {
                            errorMessage = JSON.stringify(detail)
                        }
                    }

                    return {
                        success: false,
                        error: errorMessage,
                    }
                }
            },

            register: async (userData) => {
                try {
                    await api.post(`/auth/register`, userData)
                    return { success: true }
                } catch (error) {
                    let errorMessage = 'Registration failed'
                    if (error.response?.data?.detail) {
                        const detail = error.response.data.detail
                        if (typeof detail === 'string') {
                            errorMessage = detail
                        } else if (Array.isArray(detail)) {
                            errorMessage = detail.map(err => err.msg || err).join(', ')
                        } else if (typeof detail === 'object') {
                            errorMessage = JSON.stringify(detail)
                        }
                    }

                    return {
                        success: false,
                        error: errorMessage,
                    }
                }
            },

            logout: () => {
                localStorage.removeItem('token')
                delete axios.defaults.headers.common['Authorization']
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    activeRole: null,
                })
            },

            // Set active role for dashboard switching
            setActiveRole: (role) => {
                set({ activeRole: role })
            },

            refreshUser: async () => {
                try {
                    const response = await api.get(`/auth/me`)
                    set({ user: response.data })
                } catch (error) {
                    console.error('Failed to refresh user:', error)
                }
            },

            // Initialize axios with stored token
            initializeAuth: () => {
                const { token } = get()
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                }
            },
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.initializeAuth()
                }
            },
        }
    )
)
