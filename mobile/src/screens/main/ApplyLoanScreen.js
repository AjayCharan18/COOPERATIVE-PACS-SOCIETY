import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService } from '../../services/ApiService';
import { formatCurrency } from '../../utils/formatters';

const ApplyLoanScreen = ({ navigation }) => {
    const [loanTypes, setLoanTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        loan_type_id: '',
        loan_amount: '',
        tenure_months: '',
        purpose: '',
    });

    const [selectedLoanType, setSelectedLoanType] = useState(null);
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        fetchLoanTypes();
    }, []);

    const fetchLoanTypes = async () => {
        console.log('1. fetchLoanTypes started');
        try {
            console.log('2. Fetching loan types...');
            const response = await apiService.getLoanTypes();
            console.log('3. Got response:', response.data?.length, 'loan types');

            const loanTypesData = response.data || [];
            console.log('4. About to call setLoanTypes with:', loanTypesData.length, 'items');
            setLoanTypes(loanTypesData);
            console.log('5. setLoanTypes called successfully');

            if (loanTypesData.length === 0) {
                Alert.alert('No Loan Types', 'No loan types are currently available. Please contact your branch.');
            }
        } catch (error) {
            console.error('Error in fetchLoanTypes:', error);
            console.error('Error message:', error.message);
            Alert.alert('Error', 'Failed to load loan types');
        } finally {
            console.log('6. Setting loading to false');
            setLoading(false);
            console.log('7. fetchLoanTypes completed');
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'loan_type_id') {
            const loanType = loanTypes.find(lt => lt.id === parseInt(value));
            setSelectedLoanType(loanType);
            if (loanType) {
                setFormData(prev => ({
                    ...prev,
                    interest_rate: loanType.base_interest_rate || loanType.default_interest_rate,
                }));
            }
        }
    };

    const calculateEMI = () => {
        if (!formData.loan_amount || !formData.tenure_months || !selectedLoanType) {
            return 0;
        }

        const principal = parseFloat(formData.loan_amount);
        const interestRate = selectedLoanType.base_interest_rate || selectedLoanType.default_interest_rate;
        const ratePerMonth = interestRate / 12 / 100;
        const tenure = parseInt(formData.tenure_months);

        if (ratePerMonth === 0) {
            return principal / tenure;
        }

        const emi =
            (principal * ratePerMonth * Math.pow(1 + ratePerMonth, tenure)) /
            (Math.pow(1 + ratePerMonth, tenure) - 1);

        return emi;
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                multiple: true,
            });

            if (!result.canceled && result.assets) {
                setDocuments([...documents, ...result.assets]);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const takePhoto = async () => {
        try {
            // Request camera permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera permission is required to take photos');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setDocuments([...documents, result.assets[0]]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const chooseFromGallery = async () => {
        try {
            // Request media library permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Media library permission is required');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsMultipleSelection: true,
                selectionLimit: 5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setDocuments([...documents, ...result.assets]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to choose image');
        }
    };

    const showDocumentPicker = () => {
        Alert.alert(
            'Upload Document',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Gallery', onPress: chooseFromGallery },
                { text: 'Pick Document', onPress: pickDocument },
                { text: 'Cancel', style: 'cancel' },
            ],
            { cancelable: true },
        );
    };

    const removeDocument = index => {
        setDocuments(documents.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        if (!formData.loan_type_id) {
            Alert.alert('Error', 'Please select a loan type');
            return false;
        }

        if (!formData.loan_amount || parseFloat(formData.loan_amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid loan amount');
            return false;
        }

        const amount = parseFloat(formData.loan_amount);
        if (selectedLoanType) {
            if (amount < selectedLoanType.min_amount) {
                Alert.alert(
                    'Error',
                    `Minimum loan amount is ${formatCurrency(selectedLoanType.min_amount)}`,
                );
                return false;
            }
            if (amount > selectedLoanType.max_amount) {
                Alert.alert(
                    'Error',
                    `Maximum loan amount is ${formatCurrency(selectedLoanType.max_amount)}`,
                );
                return false;
            }
        }

        if (!formData.tenure_months || parseInt(formData.tenure_months) <= 0) {
            Alert.alert('Error', 'Please enter valid tenure in months');
            return false;
        }

        if (!formData.purpose || formData.purpose.trim().length < 10) {
            Alert.alert('Error', 'Please enter loan purpose (minimum 10 characters)');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const loanData = {
                ...formData,
                loan_type_id: parseInt(formData.loan_type_id),
                loan_amount: parseFloat(formData.loan_amount),
                tenure_months: parseInt(formData.tenure_months),
            };

            const response = await apiService.applyForLoan(loanData);

            Alert.alert(
                'Success',
                'Loan application submitted successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('LoansList'),
                    },
                ],
            );
        } catch (error) {
            console.error('Error applying for loan:', error);
            Alert.alert(
                'Error',
                error.response?.data?.detail || 'Failed to submit loan application',
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        console.log('ApplyLoanScreen: Still loading...');
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    console.log('ApplyLoanScreen RENDER: loanTypes.length =', loanTypes.length);
    console.log('ApplyLoanScreen RENDER: First loan type:', loanTypes[0]?.display_name);

    const estimatedEMI = calculateEMI();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Loan Type *</Text>
                    <Text style={styles.helperText}>
                        {loanTypes.length} loan types available
                    </Text>
                    {loanTypes.map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.loanTypeCard,
                                formData.loan_type_id === type.id.toString() && styles.loanTypeCardSelected
                            ]}
                            onPress={() => updateField('loan_type_id', type.id.toString())}
                            disabled={submitting}>
                            <View style={styles.loanTypeHeader}>
                                <View style={styles.radioOuter}>
                                    {formData.loan_type_id === type.id.toString() && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.loanTypeName,
                                    formData.loan_type_id === type.id.toString() && styles.loanTypeNameSelected
                                ]}>
                                    {type.display_name || type.name}
                                </Text>
                            </View>
                            <View style={styles.loanTypeDetails}>
                                <Text style={styles.loanTypeDetailText}>
                                    Interest: {type.base_interest_rate || type.default_interest_rate}% (Year 1) | {type.interest_rate_after_year}% (After)
                                </Text>
                                <Text style={styles.loanTypeDetailText}>
                                    Amount: {formatCurrency(type.min_amount)} - {formatCurrency(type.max_amount || 10000000)}
                                </Text>
                                <Text style={styles.loanTypeDetailText}>
                                    Tenure: Up to {type.max_tenure_months || type.default_tenure_months} months
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Loan Amount *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter loan amount"
                        value={formData.loan_amount}
                        onChangeText={text => updateField('loan_amount', text)}
                        keyboardType="numeric"
                        editable={!submitting}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tenure (Months) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter tenure in months"
                        value={formData.tenure_months}
                        onChangeText={text => updateField('tenure_months', text)}
                        keyboardType="numeric"
                        editable={!submitting}
                    />
                </View>

                {estimatedEMI > 0 && (
                    <View style={styles.emiCard}>
                        <Text style={styles.emiLabel}>Estimated Monthly EMI</Text>
                        <Text style={styles.emiValue}>{formatCurrency(estimatedEMI)}</Text>
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Loan Purpose *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter the purpose of the loan (minimum 10 characters)"
                        value={formData.purpose}
                        onChangeText={text => updateField('purpose', text)}
                        multiline
                        numberOfLines={4}
                        editable={!submitting}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Documents (Optional)</Text>
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={showDocumentPicker}
                        disabled={submitting}>
                        <Icon name="cloud-upload" size={24} color="#2563eb" />
                        <Text style={styles.uploadText}>Upload Documents</Text>
                    </TouchableOpacity>

                    {documents.length > 0 && (
                        <View style={styles.documentsList}>
                            {documents.map((doc, index) => (
                                <View key={index} style={styles.documentItem}>
                                    <Icon name="insert-drive-file" size={20} color="#64748b" />
                                    <Text style={styles.documentName} numberOfLines={1}>
                                        {doc.name || doc.fileName || `Document ${index + 1}`}
                                    </Text>
                                    <TouchableOpacity onPress={() => removeDocument(index)}>
                                        <Icon name="close" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}>
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Application</Text>
                    )}
                </TouchableOpacity>
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
    content: {
        padding: 16,
    },
    form: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
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
    helperText: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 12,
    },
    loanTypeCard: {
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    loanTypeCardSelected: {
        borderColor: '#0284c7',
        backgroundColor: '#f0f9ff',
    },
    loanTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0284c7',
    },
    loanTypeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    loanTypeNameSelected: {
        color: '#0284c7',
    },
    loanTypeDetails: {
        marginLeft: 32,
    },
    loanTypeDetailText: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8fafc',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    loanTypeInfo: {
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#1e40af',
        marginBottom: 4,
    },
    emiCard: {
        backgroundColor: '#2563eb',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    emiLabel: {
        fontSize: 14,
        color: '#e0e7ff',
        marginBottom: 8,
    },
    emiValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 20,
        gap: 8,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
    },
    documentsList: {
        marginTop: 12,
        gap: 8,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    documentName: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ApplyLoanScreen;
