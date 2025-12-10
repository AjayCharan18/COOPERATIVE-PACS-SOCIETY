import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineManager } from './OfflineManager';

// Base configuration
// For development: use local IP
// For production: use your production domain
const API_BASE_URL = __DEV__
    ? 'http://192.168.0.106:8001/api/v1'  // Development
    : 'https://api.yourdomain.com/api/v1'; // Production - CHANGE THIS!

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            async config => {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            error => Promise.reject(error),
        );

        // Response interceptor for offline handling
        this.client.interceptors.response.use(
            response => response,
            async error => {
                if (!error.response) {
                    // Network error - might be offline
                    const originalRequest = error.config;

                    // Queue request for later if it's a mutation
                    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(originalRequest.method.toUpperCase())) {
                        await offlineManager.queueRequest(originalRequest);
                        return Promise.reject({
                            offline: true,
                            message: 'Request queued for when you\'re back online',
                        });
                    }

                    // Try to get cached data for GET requests
                    const cachedData = await offlineManager.getCachedData(originalRequest.url);
                    if (cachedData) {
                        return { data: cachedData, fromCache: true };
                    }
                }
                return Promise.reject(error);
            },
        );
    }

    setAuthToken(token) {
        if (token) {
            this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete this.client.defaults.headers.common.Authorization;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await this.client.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        // Cache user data
        await offlineManager.cacheData('/auth/me', response.data.user);

        return response;
    }

    async register(userData) {
        return this.client.post('/auth/register', userData);
    }

    async getCurrentUser() {
        try {
            const response = await this.client.get('/auth/me');
            await offlineManager.cacheData('/auth/me', response.data);
            return response;
        } catch (error) {
            // Return cached user if offline
            const cachedUser = await offlineManager.getCachedData('/auth/me');
            if (cachedUser) {
                return { data: cachedUser, fromCache: true };
            }
            throw error;
        }
    }

    // Dashboard endpoints
    async getDashboardStats() {
        try {
            const response = await this.client.get('/dashboard/stats');
            await offlineManager.cacheData('/dashboard/stats', response.data);
            return response;
        } catch (error) {
            const cached = await offlineManager.getCachedData('/dashboard/stats');
            if (cached) return { data: cached, fromCache: true };
            throw error;
        }
    }

    // Loan endpoints
    async getMyLoans() {
        try {
            const response = await this.client.get('/loans/');
            await offlineManager.cacheData('/loans/', response.data);
            return response;
        } catch (error) {
            const cached = await offlineManager.getCachedData('/loans/');
            if (cached) return { data: cached, fromCache: true };
            throw error;
        }
    }

    async getLoanById(loanId) {
        try {
            const response = await this.client.get(`/loans/${loanId}`);
            await offlineManager.cacheData(`/loans/${loanId}`, response.data);
            return response;
        } catch (error) {
            const cached = await offlineManager.getCachedData(`/loans/${loanId}`);
            if (cached) return { data: cached, fromCache: true };
            throw error;
        }
    }

    async applyForLoan(loanData) {
        return this.client.post('/loans/apply', loanData);
    }

    async getLoanTypes() {
        try {
            const response = await this.client.get('/loans/loan-types');
            await offlineManager.cacheData('/loans/loan-types', response.data);
            return response;
        } catch (error) {
            const cached = await offlineManager.getCachedData('/loans/loan-types');
            if (cached) return { data: cached, fromCache: true };
            throw error;
        }
    }

    // EMI endpoints
    async getEMISchedule(loanId) {
        try {
            const response = await this.client.get(`/loans/${loanId}/emi-schedule`);
            await offlineManager.cacheData(`/loans/${loanId}/emi-schedule`, response.data);
            return response;
        } catch (error) {
            const cached = await offlineManager.getCachedData(`/loans/${loanId}/emi-schedule`);
            if (cached) return { data: cached, fromCache: true };
            throw error;
        }
    }

    // Payment endpoints
    async getMyPayments() {
        try {
            const response = await this.client.get('/payments/');
            await offlineManager.cacheData('/payments/', response.data);
            return response;
        } catch (error) {
            const cached = await offlineManager.getCachedData('/payments/');
            if (cached) return { data: cached, fromCache: true };
            throw error;
        }
    }

    async makePayment(paymentData) {
        return this.client.post('/payments/create', paymentData);
    }

    // Notification endpoints
    async registerDeviceToken(token, deviceId) {
        return this.client.post('/notifications/register-device', {
            device_token: token,
            device_id: deviceId,
            platform: 'android', // or 'ios'
        });
    }

    // Smart Calculator endpoints
    async getCalculatorLoans() {
        try {
            const response = await this.client.get('/smart-calculator/loans');
            await offlineManager.cacheData('/smart-calculator/loans', response.data);
            return response;
        } catch (error) {
            const cached = await offlineManager.getCachedData('/smart-calculator/loans');
            if (cached) return { data: cached, fromCache: true };
            throw error;
        }
    }

    async calculateProRataInterest(loanId, fromDate, toDate) {
        return this.client.post('/smart-calculator/calculate/pro-rata-interest', {
            loan_id: loanId,
            from_date: fromDate || null,
            to_date: toDate || null,
        });
    }

    async getInterestProjections(loanId) {
        return this.client.post('/smart-calculator/calculate/interest-projections', {
            loan_id: loanId,
        });
    }

    async calculateOverdue(loanId, overdueAmount, overdueDays) {
        return this.client.post('/smart-calculator/calculate/overdue-with-penalty', {
            loan_id: loanId,
            overdue_amount: overdueAmount,
            overdue_days: overdueDays,
        });
    }

    async getEMIAmortization(loanId) {
        return this.client.post('/smart-calculator/generate/emi-amortization', {
            loan_id: loanId,
        });
    }

    async getLoanLedger(loanId) {
        return this.client.post('/smart-calculator/generate/loan-ledger', {
            loan_id: loanId,
        });
    }

    // Profile endpoints
    async updateProfile(profileData) {
        try {
            const response = await this.client.put('/auth/profile', profileData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to update profile',
            };
        }
    }

    async changePassword(passwordData) {
        try {
            const response = await this.client.post('/auth/change-password', passwordData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to change password',
            };
        }
    }
}

export const apiService = new ApiService();
