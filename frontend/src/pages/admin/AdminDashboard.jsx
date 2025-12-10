import { useState, useEffect } from 'react';
import {
    UsersIcon,
    BanknotesIcon,
    CurrencyRupeeIcon,
    ExclamationTriangleIcon,
    BuildingOfficeIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

export default function AdminDashboard() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchSystemOverview();
    }, []);

    const fetchSystemOverview = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/dashboard/admin/system-overview');
            setOverview(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch system overview');
            console.error('Error fetching system overview:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSystemOverview();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading system overview...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                        <button
                            onClick={fetchSystemOverview}
                            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!overview) return null;

    const { user_statistics, loan_statistics, collection_statistics, npa_statistics, branch_performance } = overview;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        System-wide overview and analytics
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    <ClockIcon className={`-ml-1 mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* User Statistics */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        title="Total Farmers"
                        value={formatNumber(user_statistics.total_farmers)}
                        icon={UsersIcon}
                        color="blue"
                    />
                    <StatCard
                        title="Total Employees"
                        value={formatNumber(user_statistics.total_employees)}
                        icon={UsersIcon}
                        color="green"
                    />
                    <StatCard
                        title="Total Admins"
                        value={formatNumber(user_statistics.total_admins)}
                        icon={UsersIcon}
                        color="purple"
                    />
                    <StatCard
                        title="Active Users"
                        value={formatNumber(user_statistics.active_users)}
                        icon={UsersIcon}
                        color="indigo"
                    />
                    <StatCard
                        title="Total Users"
                        value={formatNumber(user_statistics.total_users)}
                        icon={UsersIcon}
                        color="gray"
                    />
                </div>
            </div>

            {/* Loan Statistics */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Portfolio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <LoanStatCard
                        title="Total Loans"
                        value={formatNumber(loan_statistics.total_loans)}
                        subtitle={`${formatNumber(loan_statistics.active_loans)} active`}
                        color="indigo"
                    />
                    <LoanStatCard
                        title="Total Principal"
                        value={formatCurrency(loan_statistics.total_principal)}
                        subtitle="Disbursed amount"
                        color="blue"
                    />
                    <LoanStatCard
                        title="Outstanding Balance"
                        value={formatCurrency(loan_statistics.total_outstanding)}
                        subtitle="Current dues"
                        color="yellow"
                    />
                    <LoanStatCard
                        title="Portfolio at Risk"
                        value={formatCurrency(loan_statistics.portfolio_at_risk)}
                        subtitle="PAR loans"
                        color="red"
                    />
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MiniStatCard label="Pending" value={loan_statistics.pending_loans} color="yellow" />
                    <MiniStatCard label="Approved" value={loan_statistics.approved_loans} color="green" />
                    <MiniStatCard label="Active" value={loan_statistics.active_loans} color="blue" />
                    <MiniStatCard label="Closed" value={loan_statistics.closed_loans} color="gray" />
                    <MiniStatCard label="Rejected" value={loan_statistics.rejected_loans} color="red" />
                </div>
            </div>

            {/* Collections */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Collections</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CollectionCard
                        title="Today"
                        count={collection_statistics.today.count}
                        amount={formatCurrency(collection_statistics.today.amount)}
                        icon={ArrowTrendingUpIcon}
                        color="green"
                    />
                    <CollectionCard
                        title="This Month"
                        count={collection_statistics.this_month.count}
                        amount={formatCurrency(collection_statistics.this_month.amount)}
                        icon={BanknotesIcon}
                        color="blue"
                    />
                    <CollectionCard
                        title="This Year"
                        count={collection_statistics.this_year.count}
                        amount={formatCurrency(collection_statistics.this_year.amount)}
                        icon={CurrencyRupeeIcon}
                        color="indigo"
                    />
                </div>
            </div>

            {/* NPA Statistics */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                    <h2 className="text-lg font-semibold text-red-900">Non-Performing Assets (NPA)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-red-600">NPA Loan Count</p>
                        <p className="text-2xl font-bold text-red-900">{formatNumber(npa_statistics.npa_loan_count)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-red-600">NPA Amount</p>
                        <p className="text-2xl font-bold text-red-900">{formatCurrency(npa_statistics.npa_amount)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-red-600">NPA Percentage</p>
                        <p className="text-2xl font-bold text-red-900">{npa_statistics.npa_percentage.toFixed(2)}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-red-600">Gross NPA Ratio</p>
                        <p className="text-2xl font-bold text-red-900">{npa_statistics.gross_npa_ratio.toFixed(2)}%</p>
                    </div>
                </div>
            </div>

            {/* Branch Performance */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Branch
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Loans
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Disbursed
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Outstanding
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Farmers
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {branch_performance.map((branch) => (
                                <tr key={branch.branch_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                                            <div className="text-sm font-medium text-gray-900">{branch.branch_name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {formatNumber(branch.total_loans)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {formatCurrency(branch.total_disbursed)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {formatCurrency(branch.total_outstanding)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {formatNumber(branch.farmer_count)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        gray: 'bg-gray-50 text-gray-600',
    };

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Loan Stat Card Component
function LoanStatCard({ title, value, subtitle, color }) {
    const colorClasses = {
        indigo: 'border-indigo-500 bg-indigo-50',
        blue: 'border-blue-500 bg-blue-50',
        yellow: 'border-yellow-500 bg-yellow-50',
        red: 'border-red-500 bg-red-50',
    };

    return (
        <div className={`bg-white border-l-4 ${colorClasses[color]} shadow rounded-lg p-5`}>
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
            <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
        </div>
    );
}

// Mini Stat Card Component
function MiniStatCard({ label, value, color }) {
    const colorClasses = {
        yellow: 'bg-yellow-100 text-yellow-800',
        green: 'bg-green-100 text-green-800',
        blue: 'bg-blue-100 text-blue-800',
        gray: 'bg-gray-100 text-gray-800',
        red: 'bg-red-100 text-red-800',
    };

    return (
        <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
            <div className="text-xs font-medium">{label}</div>
            <div className="mt-1 text-xl font-bold">{value}</div>
        </div>
    );
}

// Collection Card Component
function CollectionCard({ title, count, amount, icon: Icon, color }) {
    const colorClasses = {
        green: 'bg-green-50 border-green-200',
        blue: 'bg-blue-50 border-blue-200',
        indigo: 'bg-indigo-50 border-indigo-200',
    };

    const iconColorClasses = {
        green: 'text-green-600',
        blue: 'text-blue-600',
        indigo: 'text-indigo-600',
    };

    return (
        <div className={`border ${colorClasses[color]} rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">{title}</h3>
                <Icon className={`h-6 w-6 ${iconColorClasses[color]}`} />
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{amount}</div>
                <div className="mt-1 text-sm text-gray-600">{count} transactions</div>
            </div>
        </div>
    );
}
