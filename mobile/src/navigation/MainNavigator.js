import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import LoansScreen from '../screens/main/LoansScreen';
import LoanDetailScreen from '../screens/main/LoanDetailScreen';
import ApplyLoanScreen from '../screens/main/ApplyLoanScreen';
import PaymentsScreen from '../screens/main/PaymentsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SmartCalculatorScreen from '../screens/main/SmartCalculatorScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
    </Stack.Navigator>
  );
};

const LoansStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
      <Stack.Screen
        name="LoansList"
        component={LoansScreen}
        options={{ title: 'My Loans' }}
      />
      <Stack.Screen
        name="LoanDetail"
        component={LoanDetailScreen}
        options={{ title: 'Loan Details' }}
      />
      <Stack.Screen
        name="ApplyLoan"
        component={ApplyLoanScreen}
        options={{ title: 'Apply for Loan' }}
      />
      <Stack.Screen
        name="SmartCalculator"
        component={SmartCalculatorScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size || 26} color={color} />;
        },
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          backgroundColor: '#ffffff',
        },
        headerStyle: { backgroundColor: '#0284c7' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Loans"
        component={LoansStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: 'Payments' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
