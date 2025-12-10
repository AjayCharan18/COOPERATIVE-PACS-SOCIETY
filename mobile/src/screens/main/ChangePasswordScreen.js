import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService } from '../../services/ApiService';

const ChangePasswordScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChangePassword = async () => {
        // Validation
        if (!formData.currentPassword.trim()) {
            Alert.alert('Error', 'Current password is required');
            return;
        }

        if (!formData.newPassword.trim()) {
            Alert.alert('Error', 'New password is required');
            return;
        }

        if (formData.newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            Alert.alert('Error', 'New password must be different from current password');
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.client.post('/auth/change-password', {
                old_password: formData.currentPassword,
                new_password: formData.newPassword,
            });

            if (response.data) {
                Alert.alert(
                    'Success',
                    'Password changed successfully',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error('Change password error:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    <View style={styles.infoBox}>
                        <Icon name="info" size={20} color="#0284c7" />
                        <Text style={styles.infoText}>
                            Your password must be at least 6 characters long
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password *</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={formData.currentPassword}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, currentPassword: text })
                                }
                                placeholder="Enter current password"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                <Icon
                                    name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                                    size={24}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password *</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={formData.newPassword}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, newPassword: text })
                                }
                                placeholder="Enter new password"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Icon
                                    name={showNewPassword ? 'visibility' : 'visibility-off'}
                                    size={24}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password *</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={formData.confirmPassword}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, confirmPassword: text })
                                }
                                placeholder="Confirm new password"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Icon
                                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                                    size={24}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.changeButton,
                            loading && styles.changeButtonDisabled,
                        ]}
                        onPress={handleChangePassword}
                        disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.changeButtonText}>Change Password</Text>
                        )}
                    </TouchableOpacity>
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
    form: {
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0f2fe',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#0369a1',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
        marginBottom: 8,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#1e293b',
    },
    eyeIcon: {
        padding: 16,
    },
    changeButton: {
        backgroundColor: '#0284c7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    changeButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    changeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ChangePasswordScreen;
