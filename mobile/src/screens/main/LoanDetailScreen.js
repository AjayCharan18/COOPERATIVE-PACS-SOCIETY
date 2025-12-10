import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService } from '../../services/ApiService';
import { formatCurrency, formatDate, getLoanTypeName, formatLoanStatus } from '../../utils/formatters';

const LoanDetailScreen = ({ route, navigation }) => {
    const { loanId } = route.params;
    const [loan, setLoan] = useState(null);
    const [emiSchedule, setEmiSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details'); // details, schedule

    useEffect(() => {
        fetchLoanDetails();
    }, [loanId]);

    const fetchLoanDetails = async () => {
        try {
            const [loanResponse, emiResponse] = await Promise.all([
                apiService.getLoanById(loanId),
                apiService.getEMISchedule(loanId),
            ]);

            setLoan(loanResponse.data);
            setEmiSchedule(emiResponse.data);
        } catch (error) {
            console.error('Error fetching loan details:', error);
            Alert.alert('Error', 'Failed to load loan details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = status => {
        const colors = {
            pending: '#f59e0b',
            approved: '#10b981',
            active: '#2563eb',
            closed: '#6b7280',
            rejected: '#ef4444',
        };
        return colors[status?.toLowerCase()] || '#6b7280';
    };

    const getEMIStatusColor = status => {
        const colors = {
            pending: '#f59e0b',
            paid: '#10b981',
            overdue: '#ef4444',
            partial: '#f59e0b',
        };
        return colors[status?.toLowerCase()] || '#6b7280';
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!loan) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Loan not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.loanType}>{getLoanTypeName(loan.loan_type)}</Text>
                        <Text style={styles.loanNumber}>Loan #{loan.loan_number}</Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: `${getStatusColor(loan.status)}20` },
                        ]}>
                        <Text
                            style={[
                                styles.statusText,
                                { color: getStatusColor(loan.status) },
                            ]}>
                            {formatLoanStatus(loan.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Loan Amount</Text>
                    <Text style={styles.amountValue}>
                        {formatCurrency(loan.principal_amount || loan.loan_amount)}
                    </Text>
                    {loan.status === 'active' && (
                        <>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${((loan.principal_amount || loan.loan_amount) - (loan.total_outstanding || 0)) /
                                                (loan.principal_amount || loan.loan_amount) *
                                                100
                                                }%`,
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.progressLabels}>
                                <Text style={styles.progressLabel}>
                                    Paid: {formatCurrency((loan.principal_amount || loan.loan_amount) - (loan.total_outstanding || 0))}
                                </Text>
                                <Text style={[styles.progressLabel, styles.outstanding]}>
                                    Pending: {formatCurrency(loan.total_outstanding || 0)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'details' && styles.tabActive]}
                        onPress={() => setActiveTab('details')}>
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'details' && styles.tabTextActive,
                            ]}>
                            Details
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
                        onPress={() => setActiveTab('schedule')}>
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'schedule' && styles.tabTextActive,
                            ]}>
                            EMI Schedule
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'details' ? (
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>Loan Information</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Interest Rate</Text>
                                <Text style={styles.detailValue}>{loan.interest_rate}% p.a.</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Tenure</Text>
                                <Text style={styles.detailValue}>{loan.tenure_months} months</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>EMI Amount</Text>
                                <Text style={styles.detailValue}>
                                    {formatCurrency(loan.emi_amount)}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Application Date</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(loan.application_date)}
                                </Text>
                            </View>
                            {loan.approval_date && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Approval Date</Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(loan.approval_date)}
                                    </Text>
                                </View>
                            )}
                            {loan.disbursement_date && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Disbursement Date</Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(loan.disbursement_date)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {loan.purpose && (
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Loan Purpose</Text>
                                <Text style={styles.purposeText}>{loan.purpose}</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.scheduleContainer}>
                        {emiSchedule.map((emi, index) => (
                            <View key={emi.id} style={styles.emiCard}>
                                <View style={styles.emiHeader}>
                                    <Text style={styles.emiNumber}>EMI #{index + 1}</Text>
                                    <View
                                        style={[
                                            styles.emiBadge,
                                            {
                                                backgroundColor: `${getEMIStatusColor(emi.status)}20`,
                                            },
                                        ]}>
                                        <Text
                                            style={[
                                                styles.emiStatus,
                                                { color: getEMIStatusColor(emi.status) },
                                            ]}>
                                            {emi.status}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.emiDetails}>
                                    <View style={styles.emiRow}>
                                        <Text style={styles.emiLabel}>Due Date</Text>
                                        <Text style={styles.emiValue}>
                                            {formatDate(emi.due_date)}
                                        </Text>
                                    </View>
                                    <View style={styles.emiRow}>
                                        <Text style={styles.emiLabel}>EMI Amount</Text>
                                        <Text style={styles.emiValue}>
                                            {formatCurrency(emi.emi_amount)}
                                        </Text>
                                    </View>
                                    {emi.paid_amount > 0 && (
                                        <>
                                            <View style={styles.emiRow}>
                                                <Text style={styles.emiLabel}>Paid Amount</Text>
                                                <Text style={[styles.emiValue, styles.paidAmount]}>
                                                    {formatCurrency(emi.paid_amount)}
                                                </Text>
                                            </View>
                                            {emi.payment_date && (
                                                <View style={styles.emiRow}>
                                                    <Text style={styles.emiLabel}>Payment Date</Text>
                                                    <Text style={styles.emiValue}>
                                                        {formatDate(emi.payment_date)}
                                                    </Text>
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        backgroundColor: '#fff',
    },
    headerContent: {
        flex: 1,
    },
    loanType: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    loanNumber: {
        fontSize: 14,
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    amountCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    amountLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    outstanding: {
        color: '#ef4444',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#2563eb',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#2563eb',
    },
    detailsContainer: {
        padding: 16,
    },
    detailSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    purposeText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    scheduleContainer: {
        padding: 16,
    },
    emiCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    emiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    emiNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    emiBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    emiStatus: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    emiDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    emiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    emiLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    emiValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
    paidAmount: {
        color: '#10b981',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
    },
});

export default LoanDetailScreen;
