import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiService } from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {
    constructor() {
        this.configured = false;
        this.notificationListener = null;
        this.responseListener = null;
    }

    async initialize() {
        if (this.configured) return;

        try {
            // Request permissions
            const token = await this.registerForPushNotifications();

            if (token) {
                await this.registerDeviceToken(token);
            }

            // Set up notification listeners
            this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification received:', notification);
            });

            this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Notification response:', response);
                // Handle notification tap
            });

            this.configured = true;
            console.log('Notification service initialized');
        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
    }

    async registerForPushNotifications() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return null;
            }

            try {
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: 'your-project-id', // Replace with your Expo project ID if needed
                })).data;

                console.log('Push token:', token);
            } catch (error) {
                console.log('Error getting push token:', error);
                return null;
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    async registerDeviceToken(token) {
        try {
            const deviceId = await AsyncStorage.getItem('deviceId') || `device_${Date.now()}`;

            await AsyncStorage.setItem('deviceId', deviceId);
            await AsyncStorage.setItem('pushToken', token);

            // Register with backend
            await apiService.registerDeviceToken(token, deviceId);
            console.log('Device token registered with backend');
        } catch (error) {
            console.error('Error registering device token:', error);
        }
    }

    async showLocalNotification(title, body, data = {}) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    async scheduleNotification(title, body, date, data = {}) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                },
                trigger: {
                    date: new Date(date),
                },
            });
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    }

    async cancelAllNotifications() {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Error canceling notifications:', error);
        }
    }

    cleanup() {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }
}

export default new NotificationService();
