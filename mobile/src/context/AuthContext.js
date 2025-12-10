import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        apiService.setAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', email);
      const response = await apiService.login(email, password);
      console.log('Login response:', response.data);

      const { access_token } = response.data;

      // Set token first
      await AsyncStorage.setItem('authToken', access_token);
      apiService.setAuthToken(access_token);
      setToken(access_token);

      // Fetch user data
      const userResponse = await apiService.getCurrentUser();
      console.log('User data:', userResponse.data);

      await AsyncStorage.setItem('user', JSON.stringify(userResponse.data));
      setUser(userResponse.data);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Login failed',
      };
    }
  }; const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      apiService.setAuthToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
