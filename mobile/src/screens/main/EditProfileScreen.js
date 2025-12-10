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
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/ApiService';

const EditProfileScreen = ({ navigation }) => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        mobile: user?.mobile || '',
        address: user?.address || '',
        village: user?.village || '',
        mandal: user?.mandal || '',
        district: user?.district || '',
    });

    const handleUpdate = async () => {
        // Validation
        if (!formData.full_name.trim()) {
            Alert.alert('Error', 'Full name is required');
            return;
        }

        if (!formData.mobile.trim()) {
            Alert.alert('Error', 'Mobile number is required');
            return;
        }

        if (formData.mobile.length !== 10) {
            Alert.alert('Error', 'Mobile number must be 10 digits');
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.updateProfile(formData);

            if (response.success) {
                // Update user context
                setUser({ ...user, ...formData });
                Alert.alert(
                    'Success',
                    'Profile updated successfully',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', response.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
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
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.full_name}
                            onChangeText={(text) =>
                                setFormData({ ...formData, full_name: text })
                            }
                            placeholder="Enter your full name"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.mobile}
                            onChangeText={(text) =>
                                setFormData({ ...formData, mobile: text })
                            }
                            placeholder="Enter mobile number"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.address}
                            onChangeText={(text) =>
                                setFormData({ ...formData, address: text })
                            }
                            placeholder="Enter your address"
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Village</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.village}
                            onChangeText={(text) =>
                                setFormData({ ...formData, village: text })
                            }
                            placeholder="Enter your village"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mandal</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.mandal}
                            onChangeText={(text) =>
                                setFormData({ ...formData, mandal: text })
                            }
                            placeholder="Enter your mandal"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>District</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.district}
                            onChangeText={(text) =>
                                setFormData({ ...formData, district: text })
                            }
                            placeholder="Enter your district"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.updateButton,
                            loading && styles.updateButtonDisabled,
                        ]}
                        onPress={handleUpdate}
                        disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.updateButtonText}>Update Profile</Text>
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
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1e293b',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    updateButton: {
        backgroundColor: '#0284c7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    updateButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    updateButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EditProfileScreen;
