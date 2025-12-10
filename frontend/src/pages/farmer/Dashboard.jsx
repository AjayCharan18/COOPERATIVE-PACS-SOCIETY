import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import {
    BanknotesIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    CurrencyRupeeIcon,
    DocumentTextIcon,
    CalendarIcon,
    ArrowTrendingUpIcon,
    CalculatorIcon,
    UserIcon,
    ShieldCheckIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline'
import {
    getLoanTypeName,
    getLoanStatusName,
    formatCurrency
} from '../../utils/loanHelpers'

export default function FarmerDashboard() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [loans, setLoans] = useState([])
    const [activityLog, setActivityLog] = useState([])
    const [stats, setStats] = useState({
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalOutstanding: 0,
        totalPaid: 0,
        pendingLoans: 0
    })

    useEffect(() => {
        fetchFarmerData()
    }, [])

    const fetchFarmerData = async () => {
        try {
            setLoading(true)
            // Fetch farmer's loans
            const loansResponse = await api.get('/loans/')
            const loansData = loansResponse.data
            setLoans(loansData)

            // Build activity log from loan history and payments
            const activities = []

            // Add loan activities
            loansData.forEach(loan => {
                // Loan creation
                if (loan.application_date) {
                    activities.push({
                        timestamp: loan.application_date,
                        action: 'Loan Application Submitted',
                        details: `Applied for ${getLoanTypeName(loan.loan_type)} - ${formatCurrency(loan.principal_amount)}`,
                        user_name: user?.full_name || 'You',
                        user_role: 'farmer'
                    })
                }

                // Loan approval/rejection
                if (loan.status === 'approved' && loan.approval_date) {
                    activities.push({
                        timestamp: loan.approval_date,
                        action: 'Loan Approved',
                        details: `${getLoanTypeName(loan.loan_type)} loan approved by staff`,
                        user_name: loan.approved_by_name || 'Bank Staff',
                        user_role: loan.approved_by_role || 'employee'
                    })
                }

                if (loan.status === 'rejected' && loan.updated_at) {
                    activities.push({
                        timestamp: loan.updated_at,
                        action: 'Loan Rejected',
                        details: `${getLoanTypeName(loan.loan_type)} application was rejected`,
                        user_name: 'Bank Staff',
                        user_role: 'employee'
                    })
                }

                // Loan disbursement
                if (loan.disbursement_date && loan.status !== 'pending_approval') {
                    activities.push({
                        timestamp: loan.disbursement_date,
                        action: 'Loan Disbursed',
                        details: `${formatCurrency(loan.principal_amount)} disbursed to your account`,
                        user_name: 'Bank Staff',
                        user_role: 'employee'
                    })
                }
            })

            // Sort by timestamp (newest first) and take last 10
            const sortedActivities = activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10)

            setActivityLog(sortedActivities)

            // Calculate stats from loans
            const totalBorrowed = loansData.reduce((sum, loan) => sum + (loan.principal_amount || 0), 0)
            const totalOutstanding = loansData.reduce((sum, loan) => sum + (loan.total_outstanding || 0), 0)
            const totalPaid = totalBorrowed - totalOutstanding
            const activeLoans = loansData.filter(l =>
                (l.status === 'active' || l.status === 'approved') &&
                l.disbursement_date
            ).length
            const pendingLoans = loansData.filter(l => l.status === 'pending_approval').length

            setStats({
                totalLoans: loansData.length,
                activeLoans,
                totalBorrowed,
                totalOutstanding,
                totalPaid,
                pendingLoans
            })
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
            disbursed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Disbursed' },
            active: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Active' },
            closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
            overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' }
        }
        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <h1 className="text-3xl font-bold">👨‍🌾 My Loan Dashboard</h1>
                <p className="text-blue-100 mt-2">View your loans, track payments, and manage applications</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Loans</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLoans}</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <BanknotesIcon className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Loans</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeLoans}</p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <CheckCircleIcon className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Outstanding</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalOutstanding)}</p>
                        </div>
                        <div className="bg-orange-100 rounded-full p-3">
                            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Paid</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalPaid)}</p>
                        </div>
                        <div className="bg-purple-100 rounded-full p-3">
                            <CurrencyRupeeIcon className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/loans/create')}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <BanknotesIcon className="h-5 w-5" />
                    Apply for New Loan
                </button>
                <button
                    onClick={() => navigate('/payments')}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                    <CurrencyRupeeIcon className="h-5 w-5" />
                    Make Payment
                </button>
                <button
                    onClick={() => navigate('/calculator')}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                >
                    <CalculatorIcon className="h-5 w-5" />
                    Smart Calculator
                </button>
                <button
                    onClick={() => navigate('/loans')}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                    <DocumentTextIcon className="h-5 w-5" />
                    View All Loans
                </button>
            </div>

            {/* My Loans List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">My Loans</h2>
                    {stats.pendingLoans > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
                            {stats.pendingLoans} Pending
                        </span>
                    )}
                </div>

                <div className="divide-y divide-gray-200">
                    {loans.length === 0 ? (
                        <div className="p-12 text-center">
                            <BanknotesIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Yet</h3>
                            <p className="text-gray-600 mb-4">You haven't applied for any loans</p>
                            <button
                                onClick={() => navigate('/loans/create')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Apply Now
                            </button>
                        </div>
                    ) : (
                        loans.map((loan) => (
                            <div key={loan.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {getLoanTypeName(loan.loan_type)}
                                            </h3>
                                            {getStatusBadge(loan.status)}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Loan Amount</p>
                                                <p className="font-semibold text-gray-900 mt-1">
                                                    {formatCurrency(loan.principal_amount)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Outstanding</p>
                                                <p className="font-semibold text-gray-900 mt-1">
                                                    {formatCurrency(loan.outstanding_balance)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Interest Rate</p>
                                                <p className="font-semibold text-gray-900 mt-1">{loan.interest_rate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Applied On</p>
                                                <p className="font-semibold text-gray-900 mt-1">
                                                    {formatDate(loan.application_date)}
                                                </p>
                                            </div>
                                        </div>

                                        {loan.status === 'active' && loan.disbursement_date && (
                                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Disbursed On</p>
                                                    <p className="font-medium text-gray-900 mt-1">
                                                        {formatDate(loan.disbursement_date)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Maturity Date</p>
                                                    <p className="font-medium text-gray-900 mt-1">
                                                        {formatDate(loan.maturity_date)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => navigate(`/loans/${loan.id}`)}
                                        className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Activity Log - Who made changes */}
            {activityLog.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity on Your Account</h2>
                        <p className="text-sm text-gray-600 mt-1">Track changes made by employees and administrators</p>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {activityLog.map((activity, index) => {
                            const getRoleIcon = (role) => {
                                if (role === 'admin') return <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                                if (role === 'employee') return <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                                return <UserIcon className="h-5 w-5 text-green-600" />
                            }

                            const getRoleBadge = (role) => {
                                if (role === 'admin') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                                if (role === 'employee') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Employee</span>
                                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Farmer</span>
                            }

                            const getActionColor = (action) => {
                                if (action?.toLowerCase().includes('approve')) return 'text-green-600'
                                if (action?.toLowerCase().includes('reject')) return 'text-red-600'
                                if (action?.toLowerCase().includes('disburse')) return 'text-blue-600'
                                if (action?.toLowerCase().includes('payment')) return 'text-purple-600'
                                return 'text-gray-600'
                            }

                            return (
                                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-gray-100 rounded-full p-2">
                                            {getRoleIcon(activity.user_role)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">
                                                    {activity.user_name || 'System'}
                                                </span>
                                                {getRoleBadge(activity.user_role)}
                                            </div>
                                            <p className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                                                {activity.action}
                                            </p>
                                            {activity.details && (
                                                <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">
                                                {formatDate(activity.timestamp)} at {new Date(activity.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Payment Reminder */}
            {stats.activeLoans > 0 && stats.totalOutstanding > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-orange-100 rounded-full p-3">
                            <CalendarIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Payment Reminder
                            </h3>
                            <p className="text-gray-700 mb-3">
                                You have {stats.activeLoans} active loan{stats.activeLoans > 1 ? 's' : ''} with total outstanding of <span className="font-bold">{formatCurrency(stats.totalOutstanding)}</span>
                            </p>
                            <button
                                onClick={() => navigate('/payments')}
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
                            >
                                Make Payment Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
