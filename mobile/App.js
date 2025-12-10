import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { offlineManager } from './src/services/OfflineManager';

/**
 * DCCB Loan Management - Mobile App
 * Full version with authentication and navigation
 */
export default function App() {
  useEffect(() => {
    // Clear corrupted queue on startup
    const clearCorruptedData = async () => {
      try {
        await offlineManager.clearQueue();
        console.log('Queue cleared on startup');
      } catch (error) {
        console.error('Error clearing queue:', error);
      }
    };
    clearCorruptedData();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
