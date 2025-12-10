import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettingsScreen = ({ navigation }) => {
    const [settings, setSettings] = useState({
        loanApproval: true,
        paymentReminders: true,
        loanDue: true,
        generalUpdates: true,
        smsNotifications: true,
        emailNotifications: false,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('notificationSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Failed to save settings:', error);
            Alert.alert('Error', 'Failed to save notification settings');
        }
    };

    const toggleSetting = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        saveSettings(newSettings);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loan Notifications</Text>
                    <Text style={styles.sectionDescription}>
                        Get notified about your loan applications and status updates
                    </Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Loan Approval</Text>
                            <Text style={styles.settingSubtext}>
                                When your loan is approved or rejected
                            </Text>
                        </View>
                        <Switch
                            value={settings.loanApproval}
                            onValueChange={() => toggleSetting('loanApproval')}
                            trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
                            thumbColor={settings.loanApproval ? '#0284c7' : '#f1f5f9'}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Loan Due Reminders</Text>
                            <Text style={styles.settingSubtext}>
                                Reminders before your loan payment is due
                            </Text>
                        </View>
                        <Switch
                            value={settings.loanDue}
                            onValueChange={() => toggleSetting('loanDue')}
                            trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
                            thumbColor={settings.loanDue ? '#0284c7' : '#f1f5f9'}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Notifications</Text>
                    <Text style={styles.sectionDescription}>
                        Stay updated about your payments and transactions
                    </Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Payment Reminders</Text>
                            <Text style={styles.settingSubtext}>
                                Reminders for upcoming payments
                            </Text>
                        </View>
                        <Switch
                            value={settings.paymentReminders}
                            onValueChange={() => toggleSetting('paymentReminders')}
                            trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
                            thumbColor={settings.paymentReminders ? '#0284c7' : '#f1f5f9'}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General Notifications</Text>
                    <Text style={styles.sectionDescription}>
                        Updates about new features and announcements
                    </Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>General Updates</Text>
                            <Text style={styles.settingSubtext}>
                                News, updates, and announcements
                            </Text>
                        </View>
                        <Switch
                            value={settings.generalUpdates}
                            onValueChange={() => toggleSetting('generalUpdates')}
                            trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
                            thumbColor={settings.generalUpdates ? '#0284c7' : '#f1f5f9'}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notification Channels</Text>
                    <Text style={styles.sectionDescription}>
                        Choose how you want to receive notifications
                    </Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>SMS Notifications</Text>
                            <Text style={styles.settingSubtext}>
                                Receive notifications via SMS
                            </Text>
                        </View>
                        <Switch
                            value={settings.smsNotifications}
                            onValueChange={() => toggleSetting('smsNotifications')}
                            trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
                            thumbColor={settings.smsNotifications ? '#0284c7' : '#f1f5f9'}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Email Notifications</Text>
                            <Text style={styles.settingSubtext}>
                                Receive notifications via email
                            </Text>
                        </View>
                        <Switch
                            value={settings.emailNotifications}
                            onValueChange={() => toggleSetting('emailNotifications')}
                            trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
                            thumbColor={settings.emailNotifications ? '#0284c7' : '#f1f5f9'}
                        />
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Icon name="info" size={20} color="#0284c7" />
                    <Text style={styles.infoText}>
                        You can change these settings at any time. Critical loan and payment
                        notifications will always be sent regardless of these settings.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
        backgroundColor: '#ffffff',
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: 4,
    },
    settingSubtext: {
        fontSize: 14,
        color: '#64748b',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#e0f2fe',
        padding: 16,
        borderRadius: 12,
        margin: 20,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#0369a1',
        lineHeight: 20,
    },
});

export default NotificationSettingsScreen;
