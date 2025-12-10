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
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.gradientHeader}>
                <View style={styles.headerContent}>
                    <Text style={styles.appTitle}>🌾 COOPERATIVE PACS</Text>
                    <Text style={styles.appSubtitle}>Loan Management System</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.title}>Sign in to your account</Text>
                            <Text style={styles.subtitle}>Welcome back! Please login to continue</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email or Mobile</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter email or mobile number"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter password"
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    editable={!loading}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>New farmer? Contact your nearest PACS branch for registration</Text>
                            </View>
                        </View>

                        <View style={styles.bottomFooter}>
                            <Text style={styles.bottomText}>🌾 COOPERATIVE PACS Loan Management System</Text>
                            <Text style={styles.bottomSubtext}>Supporting farmers with intelligent loan processing</Text>
                        </View>
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
    gradientHeader: {
        backgroundColor: '#0284c7',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    headerContent: {
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    appSubtitle: {
        fontSize: 14,
        color: '#e0f2fe',
    },
    formContainer: {
        flex: 1,
        marginTop: -20,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1e293b',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 8,
    },
    forgotPasswordText: {
        color: '#0284c7',
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#0284c7',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
    },
    footerText: {
        color: '#64748b',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    bottomFooter: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'center',
    },
    bottomText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 4,
    },
    bottomSubtext: {
        fontSize: 11,
        color: '#94a3b8',
        textAlign: 'center',
    },
});

export default LoginScreen;
