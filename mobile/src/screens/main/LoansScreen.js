import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService } from '../../services/ApiService';
import { formatCurrency, formatDate, getLoanTypeName, formatLoanStatus } from '../../utils/formatters';

const LoansScreen = ({ navigation }) => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, active, pending, closed

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            const response = await apiService.getMyLoans();
            setLoans(response.data);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLoans();
    };

    const filteredLoans = loans.filter(loan => {
        if (filter === 'all') return true;
        return loan.status.toLowerCase() === filter;
    });

    const getStatusColor = status => {
        const colors = {
            pending: '#f59e0b',
            approved: '#10b981',
            active: '#2563eb',
            closed: '#6b7280',
            rejected: '#ef4444',
        };
        return colors[status.toLowerCase()] || '#6b7280';
    };

    const renderLoanItem = ({ item }) => (
        <TouchableOpacity
            style={styles.loanCard}
            onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}>
            <View style={styles.loanHeader}>
                <View style={styles.loanInfo}>
                    <Text style={styles.loanType}>{getLoanTypeName(item.loan_type)}</Text>
                    <Text style={styles.loanId}>Loan ID: {item.loan_number}</Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}20` },
                    ]}>
                    <Text
                        style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {formatLoanStatus(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.loanDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Loan Amount</Text>
                    <Text style={styles.detailValue}>
                        {formatCurrency(item.principal_amount || item.loan_amount)}
                    </Text>
                </View>

                {item.status === 'active' && (
                    <>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Outstanding</Text>
                            <Text style={[styles.detailValue, styles.outstanding]}>
                                {formatCurrency(item.total_outstanding || item.outstanding_amount || 0)}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>EMI Amount</Text>
                            <Text style={styles.detailValue}>
                                {formatCurrency(item.emi_amount)}
                            </Text>
                        </View>
                    </>
                )}

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Applied On</Text>
                    <Text style={styles.detailValue}>
                        {formatDate(item.application_date)}
                    </Text>
                </View>
            </View>

            <View style={styles.loanFooter}>
                <Icon name="chevron-right" size={24} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterBar}>
                {['all', 'active', 'pending', 'closed'].map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterButton, filter === f && styles.filterActive]}
                        onPress={() => setFilter(f)}>
                        <Text
                            style={[
                                styles.filterText,
                                filter === f && styles.filterTextActive,
                            ]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredLoans}
                keyExtractor={item => item.id.toString()}
                renderItem={renderLoanItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="receipt-long" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No loans found</Text>
                        <Text style={styles.emptySubtext}>
                            {filter !== 'all'
                                ? `No ${filter} loans`
                                : 'Apply for your first loan'}
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ApplyLoan')}>
                <Icon name="add" size={28} color="#fff" />
            </TouchableOpacity>
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
    },
    filterBar: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        gap: 8,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    filterActive: {
        backgroundColor: '#2563eb',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContainer: {
        padding: 16,
    },
    loanCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    loanInfo: {
        flex: 1,
    },
    loanType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    loanId: {
        fontSize: 12,
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    loanDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
    outstanding: {
        color: '#ef4444',
    },
    loanFooter: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
});

export default LoansScreen;
