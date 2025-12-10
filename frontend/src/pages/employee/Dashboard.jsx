import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ClipboardDocumentListIcon,
    CurrencyRupeeIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    BanknotesIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { getLoanTypeName, formatCurrency } from '../../utils/loanHelpers'

export default function EmployeeDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        totalLoans: 0,
        totalDisbursed: 0,
        overdueLoans: 0,
        totalFarmers: 0,
        collectionRate: 0
    })
    const [pendingLoans, setPendingLoans] = useState([])
    const [recentActivity, setRecentActivity] = useState([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch employee stats
            const statsResponse = await api.get('/dashboard/stats')
            setStats(statsResponse.data)

            // Fetch pending approvals
            const loansResponse = await api.get('/loans/', {
                params: { status: 'pending_approval', limit: 5 }
            })
            setPendingLoans(loansResponse.data)

            // Fetch recent loans for activity
            const recentResponse = await api.get('/loans/', {
                params: { limit: 10 }
            })
            setRecentActivity(recentResponse.data.slice(0, 5))

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Employee Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
                <h1 className="text-3xl font-bold">💼 Employee Dashboard</h1>
                <p className="text-green-100 mt-2">Manage farmers, approve loans, and monitor branch performance</p>
            </div>

            {/* Stats Grid - Employee Specific */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingApprovals}</p>
                            <p className="text-xs text-gray-500 mt-1">Needs Review</p>
                        </div>
                        <div className="bg-orange-100 rounded-full p-3">
                            <ClockIcon className="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/loans?status=pending_approval')}
                        className="mt-4 text-sm text-orange-600 hover:text-orange-800 font-medium w-full text-left"
                    >
                        Review Now →
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Farmers</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFarmers || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">In Your Branch</p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <UserGroupIcon className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/farmers')}
                        className="mt-4 text-sm text-green-600 hover:text-green-800 font-medium w-full text-left"
                    >
                        Manage Farmers →
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Loans</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLoans}</p>
                            <p className="text-xs text-gray-500 mt-1">All Applications</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <BanknotesIcon className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/loans')}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
                    >
                        View All →
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Disbursed</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalDisbursed)}</p>
                            <p className="text-xs text-gray-500 mt-1">This Month</p>
                        </div>
                        <div className="bg-purple-100 rounded-full p-3">
                            <CurrencyRupeeIcon className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Overdue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdueLoans}</p>
                            <p className="text-xs text-gray-500 mt-1">Requires Action</p>
                        </div>
                        <div className="bg-red-100 rounded-full p-3">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/overdue')}
                        className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium w-full text-left"
                    >
                        Track Overdue →
                    </button>
                </div>
            </div>

            {/* Action Buttons - Employee Workflow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/loans?status=pending_approval')}
                    className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-all shadow-md hover:shadow-lg"
                >
                    <ClipboardDocumentListIcon className="h-6 w-6" />
                    <div className="text-left">
                        <div className="font-semibold">Review Applications</div>
                        <div className="text-xs opacity-90">{stats.pendingApprovals} pending</div>
                    </div>
                </button>
                <button
                    onClick={() => navigate('/farmers')}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                >
                    <UserGroupIcon className="h-6 w-6" />
                    <div className="text-left">
                        <div className="font-semibold">Manage Farmers</div>
                        <div className="text-xs opacity-90">Edit loan data</div>
                    </div>
                </button>
                <button
                    onClick={() => navigate('/payments')}
                    className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
                >
                    <CurrencyRupeeIcon className="h-6 w-6" />
                    <div className="text-left">
                        <div className="font-semibold">Payment Collection</div>
                        <div className="text-xs opacity-90">Record payments</div>
                    </div>
                </button>
                <button
                    onClick={() => navigate('/reports')}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                    <ChartBarIcon className="h-6 w-6" />
                    <div className="text-left">
                        <div className="font-semibold">Reports</div>
                        <div className="text-xs opacity-90">Generate reports</div>
                    </div>
                </button>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Approvals */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">⏳ Pending Approvals</h2>
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full">
                            {pendingLoans.length} applications
                        </span>
                    </div>
                    <div className="p-6">
                        {pendingLoans.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p>No pending approvals</p>
                                <p className="text-sm mt-1">All caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingLoans.map((loan) => (
                                    <div key={loan.id} className="border rounded-lg p-4 hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer"
                                        onClick={() => navigate(`/loans/${loan.id}`)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{loan.farmer_name || 'Farmer'}</p>
                                                <p className="text-sm text-gray-600">{getLoanTypeName(loan.loan_type)}</p>
                                            </div>
                                            <p className="font-bold text-gray-900">{formatCurrency(loan.principal_amount)}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>Applied: {formatDate(loan.application_date)}</span>
                                            <span className="text-orange-600 font-medium hover:text-orange-800">Review →</span>
                                        </div>
                                    </div>
                                ))}
                                {pendingLoans.length > 0 && (
                                    <button
                                        onClick={() => navigate('/loans?status=pending_approval')}
                                        className="w-full text-center py-2 text-orange-600 hover:text-orange-800 font-medium text-sm"
                                    >
                                        View All Pending →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">📊 Recent Activity</h2>
                    </div>
                    <div className="p-6">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <BanknotesIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((loan) => (
                                    <div key={loan.id} className="border-l-4 border-gray-300 pl-4 py-2 hover:border-indigo-500 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{getLoanTypeName(loan.loan_type)}</p>
                                                <p className="text-sm text-gray-600">{loan.farmer_name || 'Farmer'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">{formatCurrency(loan.principal_amount)}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${loan.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        loan.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                                            loan.status === 'disbursed' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {loan.status?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(loan.application_date)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-indigo-100 rounded-full p-3">
                        <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Total Loans Managed</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLoans}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Total Disbursed</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalDisbursed)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Farmers Served</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalFarmers || 0}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Collection Rate</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.collectionRate || 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
