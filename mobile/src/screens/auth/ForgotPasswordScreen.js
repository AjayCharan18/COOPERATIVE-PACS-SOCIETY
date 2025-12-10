import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/ApiService';

const ForgotPasswordScreen = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: New password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.client.post('/auth/forgot-password', {
                identifier: email,
                method: 'email'
            });

            if (response.data) {
                Alert.alert('Success', 'OTP sent to your email. Please check your inbox.');
                setStep(2);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }

        // Just verify OTP format and move to next step
        if (otp.length !== 6) {
            Alert.alert('Error', 'OTP must be 6 digits');
            return;
        }

        setStep(3);
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please enter new password');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.client.post('/auth/verify-otp-reset-password', {
                identifier: email,
                otp: otp,
                new_password: newPassword
            });

            if (response.data) {
                Alert.alert(
                    'Success',
                    'Password reset successfully! Please login with your new password.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => step === 1 ? navigation.goBack() : setStep(step - 1)}
                    style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reset Password</Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        {/* Step Indicator */}
                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
                                <Text style={styles.stepText}>1</Text>
                            </View>
                            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
                                <Text style={styles.stepText}>2</Text>
                            </View>
                            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
                            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
                                <Text style={styles.stepText}>3</Text>
                            </View>
                        </View>

                        {/* Step 1: Enter Email */}
                        {step === 1 && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="mail-outline" size={60} color="#0284c7" />
                                </View>
                                <Text style={styles.title}>Enter Your Email</Text>
                                <Text style={styles.subtitle}>
                                    We'll send you an OTP to reset your password
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#94a3b8"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleSendOTP}
                                    disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Send OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step 2: Verify OTP */}
                        {step === 2 && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="lock-closed-outline" size={60} color="#0284c7" />
                                </View>
                                <Text style={styles.title}>Enter OTP</Text>
                                <Text style={styles.subtitle}>
                                    Please enter the OTP sent to {email}
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>OTP Code</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter 6-digit OTP"
                                        placeholderTextColor="#94a3b8"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        editable={!loading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleVerifyOTP}
                                    disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Verify OTP</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={handleSendOTP}>
                                    <Text style={styles.resendText}>Resend OTP</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step 3: New Password */}
                        {step === 3 && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="checkmark-circle-outline" size={60} color="#10b981" />
                                </View>
                                <Text style={styles.title}>Create New Password</Text>
                                <Text style={styles.subtitle}>
                                    Enter your new password
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#94a3b8"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                        editable={!loading}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#94a3b8"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        editable={!loading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleResetPassword}
                                    disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Reset Password</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        backgroundColor: '#0284c7',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    formContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    stepDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepDotActive: {
        backgroundColor: '#0284c7',
    },
    stepText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    stepLine: {
        width: 50,
        height: 2,
        backgroundColor: '#e2e8f0',
    },
    stepLineActive: {
        backgroundColor: '#0284c7',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
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
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1e293b',
    },
    button: {
        backgroundColor: '#0284c7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    resendText: {
        color: '#0284c7',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ForgotPasswordScreen;
