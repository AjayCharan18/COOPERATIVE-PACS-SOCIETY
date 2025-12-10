import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../../services/ApiService';
import { formatCurrency, formatDate, getLoanTypeName } from '../../utils/formatters';

const SmartCalculatorScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('interest');
    const [loans, setLoans] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingLoans, setLoadingLoans] = useState(true);
    const [result, setResult] = useState(null);

    // Interest Calculator State
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    // Overdue Calculator State
    const [overdueAmount, setOverdueAmount] = useState('');
    const [overdueDays, setOverdueDays] = useState('');

    useEffect(() => {
        fetchActiveLoans();
    }, []);

    const fetchActiveLoans = async () => {
        try {
            console.log('Fetching calculator loans...');
            const response = await apiService.getCalculatorLoans();
            console.log('Calculator loans response:', response.data);
            setLoans(response.data);
            if (response.data.length === 0) {
                Alert.alert('No Active Loans', 'You don\'t have any active loans yet. Apply for a loan to use the calculator.');
            }
        } catch (error) {
            console.error('Error fetching loans:', error);
            console.error('Error response:', error.response?.data);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to load active loans. Please try again.');
        } finally {
            setLoadingLoans(false);
        }
    };

    const calculateProRataInterest = async () => {
        if (!selectedLoan) {
            Alert.alert('Error', 'Please select a loan');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.calculateProRataInterest(
                selectedLoan,
                fromDate,
                toDate
            );
            setResult(response.data);
        } catch (error) {
            console.error('Error calculating interest:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to calculate interest');
        } finally {
            setLoading(false);
        }
    };

    const calculateOverdue = async () => {
        if (!selectedLoan || !overdueAmount || !overdueDays) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.calculateOverdue(
                selectedLoan,
                parseFloat(overdueAmount),
                parseInt(overdueDays)
            );
            setResult(response.data);
        } catch (error) {
            console.error('Error calculating overdue:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to calculate overdue');
        } finally {
            setLoading(false);
        }
    };

    const getProjections = async () => {
        if (!selectedLoan) {
            Alert.alert('Error', 'Please select a loan');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.getInterestProjections(selectedLoan);
            setResult(response.data);
        } catch (error) {
            console.error('Error getting projections:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to get projections');
        } finally {
            setLoading(false);
        }
    };

    const renderInterestTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.description}>
                Calculate exact daily interest for any period. Automatically switches rate if loan crosses 1 year.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>From Date</Text>
                <TextInput
                    style={styles.input}
                    value={fromDate}
                    onChangeText={setFromDate}
                    placeholder="YYYY-MM-DD"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>To Date</Text>
                <TextInput
                    style={styles.input}
                    value={toDate}
                    onChangeText={setToDate}
                    placeholder="YYYY-MM-DD"
                />
            </View>

            <TouchableOpacity
                style={styles.calculateButton}
                onPress={calculateProRataInterest}
                disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.calculateButtonText}>Calculate Interest</Text>
                )}
            </TouchableOpacity>

            {result && activeTab === 'interest' && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Result</Text>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Total Days</Text>
                        <Text style={styles.resultValue}>{result.total_days}</Text>
                    </View>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Principal</Text>
                        <Text style={styles.resultValue}>{formatCurrency(result.principal)}</Text>
                    </View>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Interest Rate</Text>
                        <Text style={styles.resultValue}>{result.annual_rate}%</Text>
                    </View>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Total Interest</Text>
                        <Text style={[styles.resultValue, styles.highlight]}>
                            {formatCurrency(result.total_interest)}
                        </Text>
                    </View>
                    {result.crosses_one_year && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>Note: Rate switched during this period</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderProjectionsTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.description}>
                See what the farmer owes today, tomorrow, after 10 days, and next month.
            </Text>

            <TouchableOpacity
                style={styles.calculateButton}
                onPress={getProjections}
                disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.calculateButtonText}>Get Projections</Text>
                )}
            </TouchableOpacity>

            {result && activeTab === 'projections' && result.projections && Array.isArray(result.projections) && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Interest Projections</Text>
                    {result.projections.map((proj, index) => (
                        <View key={index} style={styles.projectionItem}>
                            <Text style={styles.projectionLabel}>{proj.label}</Text>
                            <Text style={styles.projectionValue}>
                                {formatCurrency(proj.total_amount)}
                            </Text>
                            <Text style={styles.projectionDate}>{formatDate(proj.date)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderOverdueTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.description}>
                Calculate penalty interest on overdue amounts.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Overdue Amount (Rs.)</Text>
                <TextInput
                    style={styles.input}
                    value={overdueAmount}
                    onChangeText={setOverdueAmount}
                    keyboardType="numeric"
                    placeholder="Enter overdue amount"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Overdue Days</Text>
                <TextInput
                    style={styles.input}
                    value={overdueDays}
                    onChangeText={setOverdueDays}
                    keyboardType="numeric"
                    placeholder="Enter number of days"
                />
            </View>

            <TouchableOpacity
                style={styles.calculateButton}
                onPress={calculateOverdue}
                disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.calculateButtonText}>Calculate Overdue</Text>
                )}
            </TouchableOpacity>

            {result && activeTab === 'overdue' && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Overdue Calculation</Text>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Overdue Amount</Text>
                        <Text style={styles.resultValue}>
                            {formatCurrency(result.overdue_amount)}
                        </Text>
                    </View>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Penalty Interest</Text>
                        <Text style={[styles.resultValue, styles.warning]}>
                            {formatCurrency(result.penalty_interest)}
                        </Text>
                    </View>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Total Amount Due</Text>
                        <Text style={[styles.resultValue, styles.highlight]}>
                            {formatCurrency(result.total_amount_due)}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Smart Calculator</Text>
            </View>

            {loadingLoans ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Loading active loans...</Text>
                </View>
            ) : (
                <ScrollView style={styles.content}>
                    <View style={styles.loanSelector}>
                        <Text style={styles.selectorLabel}>Select Active Loan</Text>
                        <Text style={styles.helperText}>
                            {loans.length} active loan{loans.length !== 1 ? 's' : ''} available
                        </Text>
                        {loans.map(loan => (
                            <TouchableOpacity
                                key={loan.id}
                                style={[
                                    styles.loanCard,
                                    selectedLoan === loan.id && styles.loanCardSelected
                                ]}
                                onPress={() => setSelectedLoan(loan.id)}>
                                <View style={styles.loanCardHeader}>
                                    <View style={styles.radioOuter}>
                                        {selectedLoan === loan.id && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[
                                            styles.loanNumber,
                                            selectedLoan === loan.id && styles.loanNumberSelected
                                        ]}>
                                            {loan.loan_number}
                                        </Text>
                                        <Text style={styles.loanType}>
                                            {getLoanTypeName(loan.loan_type)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.loanDetails}>
                                    <Text style={styles.loanDetailText}>
                                        Principal: {formatCurrency(loan.principal_amount)}
                                    </Text>
                                    <Text style={styles.loanDetailText}>
                                        Outstanding: {formatCurrency(loan.outstanding_balance)}
                                    </Text>
                                    <Text style={styles.loanDetailText}>
                                        Interest Rate: {loan.interest_rate}%
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'interest' && styles.activeTab]}
                            onPress={() => {
                                setActiveTab('interest');
                                setResult(null);
                            }}>
                            <Icon name="calculate" size={20} color={activeTab === 'interest' ? '#2563eb' : '#6b7280'} />
                            <Text style={[styles.tabText, activeTab === 'interest' && styles.activeTabText]}>
                                Pro-Rata Interest
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'projections' && styles.activeTab]}
                            onPress={() => {
                                setActiveTab('projections');
                                setResult(null);
                            }}>
                            <Icon name="trending-up" size={20} color={activeTab === 'projections' ? '#2563eb' : '#6b7280'} />
                            <Text style={[styles.tabText, activeTab === 'projections' && styles.activeTabText]}>
                                Projections
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'overdue' && styles.activeTab]}
                            onPress={() => {
                                setActiveTab('overdue');
                                setResult(null);
                            }}>
                            <Text style={[styles.tabText, activeTab === 'overdue' && styles.activeTabText]}>
                                Overdue
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'interest' && renderInterestTab()}
                    {activeTab === 'projections' && renderProjectionsTab()}
                    {activeTab === 'overdue' && renderOverdueTab()}
                </ScrollView>
            )}
        </View>
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
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    header: {
        backgroundColor: '#2563eb',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loanSelector: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    selectorLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    helperText: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 12,
    },
    loanCard: {
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    loanCardSelected: {
        borderColor: '#0284c7',
        backgroundColor: '#f0f9ff',
    },
    loanCardHeader: {
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
    loanNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    loanNumberSelected: {
        color: '#0284c7',
    },
    loanType: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    loanDetails: {
        marginLeft: 32,
    },
    loanDetailText: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    loanInfo: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    loanInfoText: {
        fontSize: 13,
        color: '#374151',
        marginBottom: 4,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        elevation: 2,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#eff6ff',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280',
        marginLeft: 4,
    },
    activeTabText: {
        color: '#2563eb',
        fontWeight: '600',
    },
    tabContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1f2937',
    },
    calculateButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultCard: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 16,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    resultLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    resultValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    highlight: {
        color: '#10b981',
        fontSize: 16,
    },
    warning: {
        color: '#f59e0b',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    warningText: {
        fontSize: 13,
        color: '#92400e',
        marginLeft: 8,
        fontWeight: '500',
    },
    projectionItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    projectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    projectionValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2563eb',
        marginBottom: 2,
    },
    projectionDate: {
        fontSize: 12,
        color: '#6b7280',
    },
});

export default SmartCalculatorScreen;
