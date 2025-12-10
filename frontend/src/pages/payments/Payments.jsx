import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    CurrencyRupeeIcon
} from '@heroicons/react/24/outline'

export default function Payments() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [payments, setPayments] = useState([])
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    })
    const [stats, setStats] = useState({
        totalCollected: 0,
        pendingAmount: 0,
        monthlyCollection: 0,
        overdueAmount: 0
    })

    useEffect(() => {
        fetchPayments()
        fetchStats()
    }, [filters])

    const fetchPayments = async () => {
        try {
            setLoading(true)
            const params = {
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                ...(filters.dateFrom && { date_from: filters.dateFrom }),
                ...(filters.dateTo && { date_to: filters.dateTo }),
                limit: 50
            }
            const response = await api.get('/payments/', { params })
            setPayments(response.data)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load payments')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await api.get('/payments/stats')
            setStats(response.data)
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }))
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
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
        const config = {
            paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Paid' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon, label: 'Pending' },
            overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Overdue' },
            partial: { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon, label: 'Partial' }
        }
        const item = config[status] || config.pending
        const Icon = item.icon
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${item.bg} ${item.text}`}>
                <Icon className="h-3 w-3" />
                {item.label}
            </span>
        )
    }

    const getPaymentMethodBadge = (method) => {
        const colors = {
            cash: 'bg-green-100 text-green-800',
            cheque: 'bg-blue-100 text-blue-800',
            online: 'bg-purple-100 text-purple-800',
            upi: 'bg-indigo-100 text-indigo-800'
        }
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
                {method?.toUpperCase() || 'N/A'}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-600 mt-1">Track and manage loan payments</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Collected</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalCollected)}</p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.pendingAmount)}</p>
                        </div>
                        <div className="bg-yellow-100 rounded-full p-3">
                            <ClockIcon className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.monthlyCollection)}</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Overdue</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.overdueAmount)}</p>
                        </div>
                        <div className="bg-red-100 rounded-full p-3">
                            <XCircleIcon className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by loan ID, farmer name..."
                                    value={filters.search}
                                    onChange={handleSearch}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="partial">Partial</option>
                        </select>

                        <button
                            onClick={() => setFilters({ search: '', status: '', dateFrom: '', dateTo: '' })}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <FunnelIcon className="h-5 w-5" />
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No payments found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm">#{payment.id}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/loans/${payment.loan_id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                >
                                                    #{payment.loan_id}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{payment.farmer_name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPaymentMethodBadge(payment.payment_method)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(payment.payment_date || payment.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(payment.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/payments/${payment.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
