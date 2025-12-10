import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    UsersIcon,
    BuildingOffice2Icon,
    BanknotesIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalBranches: 0,
        totalUsers: 0,
        totalLoans: 0,
        totalDisbursed: 0,
        activeLoans: 0,
        overdueLoans: 0,
        collectionRate: 0,
        monthlyDisbursement: 0
    })
    const [branchPerformance, setBranchPerformance] = useState([])
    const [recentActivity, setRecentActivity] = useState([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            const [statsRes, branchesRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/branches/')
            ])

            setStats(statsRes.data)
            setBranchPerformance(branchesRes.data.slice(0, 5))
            // Recent activity can be derived from loans or removed if not needed
            setRecentActivity([])
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatPercentage = (value) => {
        return `${(value * 100).toFixed(1)}%`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-indigo-100 mt-2">System overview and analytics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Branches</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBranches}</p>
                        </div>
                        <div className="bg-purple-100 rounded-full p-3">
                            <BuildingOffice2Icon className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/branches')}
                        className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                        Manage Branches →
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <UsersIcon className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Disbursed</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalDisbursed)}</p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <BanknotesIcon className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatPercentage(stats.collectionRate || 0.85)}</p>
                        </div>
                        <div className="bg-amber-100 rounded-full p-3">
                            <ArrowTrendingUpIcon className="h-8 w-8 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Active Loans</h3>
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold">{stats.activeLoans}</p>
                    <p className="text-sm text-gray-500 mt-2">Currently active</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Overdue</h3>
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">{stats.overdueLoans}</p>
                    <button
                        onClick={() => navigate('/overdue')}
                        className="text-sm text-red-600 hover:text-red-800 mt-2"
                    >
                        View Details →
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">This Month</h3>
                        <ChartBarIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.monthlyDisbursement || 0)}</p>
                    <p className="text-sm text-gray-500 mt-2">Disbursed amount</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/branches')}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <BuildingOffice2Icon className="h-5 w-5" />
                    Branches
                </button>
                <button
                    onClick={() => navigate('/reports')}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <ChartBarIcon className="h-5 w-5" />
                    Reports
                </button>
                <button
                    onClick={() => navigate('/loans')}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <BanknotesIcon className="h-5 w-5" />
                    All Loans
                </button>
                <button
                    onClick={() => navigate('/overdue')}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    Overdue Management
                </button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Branch Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Loans</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {branchPerformance.map((branch) => (
                                <tr key={branch.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{branch.name}</div>
                                        <div className="text-sm text-gray-500">{branch.code}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{branch.total_loans || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(branch.total_disbursed || 0)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {branch.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
