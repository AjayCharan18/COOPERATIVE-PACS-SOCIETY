import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService } from '../../services/ApiService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PaymentsScreen = ({ navigation }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await apiService.getMyPayments();
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            Alert.alert('Error', 'Failed to load payments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPayments();
    };

    const getStatusColor = status => {
        const colors = {
            success: '#10b981',
            pending: '#f59e0b',
            failed: '#ef4444',
        };
        return colors[status?.toLowerCase()] || '#6b7280';
    };

    const renderPaymentItem = ({ item }) => (
        <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
                <View style={styles.paymentInfo}>
                    <Text style={styles.paymentAmount}>
                        {formatCurrency(item.amount)}
                    </Text>
                    <Text style={styles.paymentDate}>
                        {formatDateTime(item.payment_date)}
                    </Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}20` },
                    ]}>
                    <Text
                        style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                    <Icon name="receipt-long" size={16} color="#64748b" />
                    <Text style={styles.detailText}>Loan: {item.loan_number}</Text>
                </View>

                {item.transaction_id && (
                    <View style={styles.detailRow}>
                        <Icon name="confirmation-number" size={16} color="#64748b" />
                        <Text style={styles.detailText}>Txn: {item.transaction_id}</Text>
                    </View>
                )}

                <View style={styles.detailRow}>
                    <Icon name="account-balance-wallet" size={16} color="#64748b" />
                    <Text style={styles.detailText}>
                        Method: {item.payment_method || 'N/A'}
                    </Text>
                </View>
            </View>
        </View>
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
            <FlatList
                data={payments}
                keyExtractor={item => item.id.toString()}
                renderItem={renderPaymentItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="payment" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No payments yet</Text>
                        <Text style={styles.emptySubtext}>
                            Your payment history will appear here
                        </Text>
                    </View>
                }
            />
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
    listContainer: {
        padding: 16,
    },
    paymentCard: {
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
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    paymentInfo: {
        flex: 1,
    },
    paymentAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    paymentDate: {
        fontSize: 13,
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
    paymentDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 13,
        color: '#64748b',
        flex: 1,
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
});

export default PaymentsScreen;
