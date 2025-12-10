import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/ApiService';
import { formatCurrency, formatDate, getLoanTypeName, formatLoanStatus } from '../../utils/formatters';

const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentLoans, setRecentLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Only show loading spinner on initial load, not on refresh
            if (!refreshing) {
                setLoading(true);
            }
            // Fetch loans directly instead of dashboard stats
            const loansResponse = await apiService.getMyLoans();
            const loans = loansResponse.data || [];

            // Calculate stats from loans
            const totalLoans = loans.length;
            const activeLoans = loans.filter(l =>
                l.status === 'active' || l.status === 'approved'
            ).length;
            const totalOutstanding = loans.reduce((sum, l) =>
                sum + (l.total_outstanding || 0), 0
            );
            const totalBorrowed = loans.reduce((sum, l) =>
                sum + (l.principal_amount || 0), 0
            );
            const totalPaid = totalBorrowed - totalOutstanding;

            setStats({
                total_loans: totalLoans,
                active_loans: activeLoans,
                total_outstanding: totalOutstanding,
                total_paid: totalPaid
            });

            setRecentLoans(loans.slice(0, 3));
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            // Set empty stats on error
            setStats({
                total_loans: 0,
                active_loans: 0,
                total_outstanding: 0,
                total_paid: 0
            });
            setRecentLoans([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            {/* Gradient Header */}
            <View style={styles.gradientHeader}>
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.full_name || 'Farmer'}</Text>
                </View>
                <View style={styles.headerStats}>
                    <View style={styles.headerStatItem}>
                        <Ionicons name="wallet-outline" size={20} color="#e0f2fe" />
                        <Text style={styles.headerStatText}>{stats?.total_loans || 0} Loans</Text>
                    </View>
                    <View style={styles.headerStatItem}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#d1fae5" />
                        <Text style={styles.headerStatText}>{stats?.active_loans || 0} Active</Text>
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.statCardPrimary]}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="wallet" size={32} color="#fff" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Total Loans</Text>
                            <Text style={styles.statValue}>{stats?.total_loans || 0}</Text>
                        </View>
                    </View>

                    <View style={[styles.statCard, styles.statCardSuccess]}>
                        <View style={[styles.statIconContainer, styles.iconSuccess]}>
                            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Active Loans</Text>
                            <Text style={styles.statValueDark}>{stats?.active_loans || 0}</Text>
                        </View>
                    </View>

                    <View style={[styles.statCard, styles.statCardWarning]}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="alert-circle" size={32} color="#f59e0b" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Outstanding Amount</Text>
                            <Text style={styles.statValueDark}>
                                {formatCurrency(stats?.total_outstanding || 0)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.statCard, styles.statCardPurple]}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="checkmark-done-circle" size={32} color="#8b5cf6" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Total Paid</Text>
                            <Text style={styles.statValueDark}>
                                {formatCurrency(stats?.total_paid || 0)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={[styles.actionCard, styles.actionPrimary]}
                        onPress={() => navigation.navigate('Loans', { screen: 'ApplyLoan' })}>
                        <Text style={styles.actionTextWhite}>Apply for New Loan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, styles.actionSuccess]}
                        onPress={() => navigation.navigate('Payments')}>
                        <Text style={styles.actionTextWhite}>Make Payment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, styles.actionPurple]}
                        onPress={() => navigation.navigate('Loans', { screen: 'SmartCalculator' })}>
                        <Text style={styles.actionTextWhite}>Smart Calculator</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, styles.actionInfo]}
                        onPress={() => navigation.navigate('Loans')}>
                        <Text style={styles.actionTextWhite}>View All Loans</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Loans */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Loans</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Loans')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {recentLoans.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No loans yet</Text>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => navigation.navigate('Loans', { screen: 'ApplyLoan' })}>
                            <Text style={styles.applyButtonText}>Apply for Loan</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    recentLoans.map(loan => (
                        <TouchableOpacity
                            key={loan.id}
                            style={styles.loanCard}
                            onPress={() =>
                                navigation.navigate('Loans', {
                                    screen: 'LoanDetail',
                                    params: { loanId: loan.id },
                                })
                            }>
                            <View style={styles.loanHeader}>
                                <Text style={styles.loanType}>{getLoanTypeName(loan.loan_type)}</Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        styles[`status${loan.status.toLowerCase()}`],
                                    ]}>
                                    <Text style={styles.statusText}>{formatLoanStatus(loan.status)}</Text>
                                </View>
                            </View>
                            <Text style={styles.loanAmount}>
                                {formatCurrency(loan.principal_amount || loan.loan_amount)}
                            </Text>
                            <Text style={styles.loanDate}>
                                Applied: {formatDate(loan.application_date)}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
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
        backgroundColor: '#f8fafc',
    },
    gradientHeader: {
        backgroundColor: '#0284c7',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    welcomeSection: {
        marginBottom: 16,
    },
    welcomeText: {
        fontSize: 16,
        color: '#e0f2fe',
        opacity: 0.9,
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    headerStats: {
        flexDirection: 'row',
        gap: 20,
    },
    headerStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerStatText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    statsGrid: {
        gap: 16,
    },
    statCard: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 12,
    },
    statCardPrimary: {
        backgroundColor: '#0284c7',
        borderLeftWidth: 4,
        borderLeftColor: '#0369a1',
    },
    statCardSuccess: {
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    statCardWarning: {
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    statCardPurple: {
        borderLeftWidth: 4,
        borderLeftColor: '#8b5cf6',
    },
    statIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconSuccess: {
        backgroundColor: '#d1fae5',
    },
    iconWarning: {
        backgroundColor: '#fef3c7',
    },
    iconPurple: {
        backgroundColor: '#ede9fe',
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    statValueDark: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    section: {
        padding: 16,
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    seeAll: {
        fontSize: 14,
        color: '#0284c7',
        fontWeight: '600',
    },
    actionGrid: {
        gap: 12,
        marginTop: 12,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 12,
    },
    actionPrimary: {
        backgroundColor: '#0284c7',
    },
    actionSuccess: {
        backgroundColor: '#10b981',
    },
    actionPurple: {
        backgroundColor: '#8b5cf6',
    },
    actionInfo: {
        backgroundColor: '#0ea5e9',
    },
    actionTextWhite: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 12,
    },
    loanCard: {
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
    loanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    loanType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statuspending_approval: {
        backgroundColor: '#fef3c7',
    },
    statuspending: {
        backgroundColor: '#fef3c7',
    },
    statusapproved: {
        backgroundColor: '#d1fae5',
    },
    statusactive: {
        backgroundColor: '#dbeafe',
    },
    statusclosed: {
        backgroundColor: '#f1f5f9',
    },
    statusrejected: {
        backgroundColor: '#fee2e2',
    },
    statusoverdue: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    loanAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 4,
    },
    loanDate: {
        fontSize: 13,
        color: '#64748b',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
        marginBottom: 20,
    },
    applyButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    quickActions: {
        padding: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    actionCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    actionText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
    },
});

export default HomeScreen;
