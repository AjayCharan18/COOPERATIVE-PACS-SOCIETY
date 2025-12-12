import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cooperative-pacs-society.onrender.com'
const API_URL = `${API_BASE_URL}/api/v1`

// Create axios instance with base configuration
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export const loanApi = {
    // Get all loans
    getLoans: async (params = {}) => {
        const response = await api.get(`/loans`, { params })
        return response.data
    },

    // Get loan by ID
    getLoan: async (id) => {
        const response = await api.get(`/loans/${id}`)
        return response.data
    },

    // Search loan by number
    searchLoan: async (loanNumber) => {
        const response = await api.get(`/loans/search/${loanNumber}`)
        return response.data
    },

    // Create loan
    createLoan: async (loanData) => {
        const response = await api.post(`/loans`, loanData)
        return response.data
    },

    // Update loan
    updateLoan: async (id, loanData) => {
        const response = await api.put(`/loans/${id}`, loanData)
        return response.data
    },

    // Approve loan
    approveLoan: async (approvalData) => {
        const response = await api.post(`/loans/approve`, approvalData)
        return response.data
    },

    // Get loan summary
    getLoanSummary: async (params = {}) => {
        const response = await api.get(`/loans/summary/statistics`, { params })
        return response.data
    },

    // Get risk assessment
    getRiskAssessment: async (loanId) => {
        const response = await api.get(`/loans/${loanId}/risk-assessment`)
        return response.data
    },

    // Get loan types
    getLoanTypes: async () => {
        const response = await api.get(`/loans/config/types`)
        return response.data
    },
}

export const paymentApi = {
    // Get payments
    getPayments: async (params = {}) => {
        const response = await api.get(`/payments`, { params })
        return response.data
    },

    // Create payment
    createPayment: async (paymentData) => {
        const response = await api.post(`/payments`, paymentData)
        return response.data
    },

    // Get loan ledger
    getLoanLedger: async (loanId) => {
        const response = await api.get(`/payments/ledger/${loanId}`)
        return response.data
    },
}

export const userApi = {
    // Get current user
    getCurrentUser: async () => {
        const response = await api.get(`/auth/me`)
        return response.data
    },

    // Change password
    changePassword: async (passwordData) => {
        const response = await api.post(`/auth/change-password`, passwordData)
        return response.data
    },
}
