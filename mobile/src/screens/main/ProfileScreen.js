import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/ApiService';
import { offlineManager } from '../../services/OfflineManager';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [cacheSize, setCacheSize] = useState(0);

    useEffect(() => {
        getCacheInfo();
    }, []);

    const getCacheInfo = async () => {
        // Get approximate cache size (simplified)
        try {
            const keys = await require('@react-native-async-storage/async-storage').default.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith('cache_'));
            setCacheSize(cacheKeys.length);
        } catch (error) {
            console.error('Error getting cache info:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    await logout();
                    setLoading(false);
                },
            },
        ]);
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear all cached data. You may need to reload data when online.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await offlineManager.clearCache();
                        await getCacheInfo();
                        Alert.alert('Success', 'Cache cleared successfully');
                    },
                },
            ],
        );
    };

    const handleClearQueue = () => {
        Alert.alert(
            'Clear Offline Queue',
            'This will clear all pending offline requests. Use with caution!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await offlineManager.clearQueue();
                        Alert.alert('Success', 'Offline queue cleared');
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle" size={80} color="#0284c7" />
                </View>
                <Text style={styles.userName}>{user?.full_name || 'Farmer'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                {user?.mobile && (
                    <Text style={styles.userMobile}>{user.mobile}</Text>
                )}
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                        {user?.role?.toUpperCase() || 'FARMER'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('EditProfile')}>
                    <Ionicons name="create-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ChangePassword')}>
                    <Ionicons name="lock-closed-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>Change Password</Text>
                    <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('NotificationSettings')}>
                    <Ionicons name="notifications-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>Notification Settings</Text>
                    <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Storage</Text>

                <View style={styles.menuItem}>
                    <Ionicons name="server-outline" size={24} color="#64748b" />
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuText}>Cached Items</Text>
                        <Text style={styles.menuSubtext}>{cacheSize} items</Text>
                    </View>
                    <TouchableOpacity onPress={handleClearCache}>
                        <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={handleClearQueue}>
                    <Ionicons name="sync-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>Offline Queue</Text>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="information-circle-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>App Version</Text>
                    <Text style={styles.versionText}>2.0.0</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="document-text-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>Terms & Conditions</Text>
                    <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="help-circle-outline" size={24} color="#64748b" />
                    <Text style={styles.menuText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    2025 COOPERATIVE PACS Loan Management System
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    avatarContainer: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    userMobile: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 12,
    },
    roleBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563eb',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        paddingHorizontal: 20,
        paddingVertical: 12,
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    menuTextContainer: {
        flex: 1,
    },
    menuSubtext: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    versionText: {
        fontSize: 14,
        color: '#64748b',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginTop: 16,
        paddingVertical: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
    },
});

export default ProfileScreen;
