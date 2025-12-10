import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    PlusIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import {
    getLoanTypeName,
    getLoanStatusName,
    formatCurrency
} from '../../utils/loanHelpers'

export default function LoanList() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [loans, setLoans] = useState([])
    const [filters, setFilters] = useState({
        search: '',
        status: searchParams.get('status') || '',
        loanType: '',
        branch: ''
    })
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0
    })

    useEffect(() => {
        fetchLoans()
    }, [filters, pagination.page])

    const fetchLoans = async () => {
        try {
            setLoading(true)
            const params = {
                skip: (pagination.page - 1) * pagination.pageSize,
                limit: pagination.pageSize,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                ...(filters.loanType && { loan_type: filters.loanType }),
                ...(filters.branch && { branch_id: filters.branch })
            }

            const response = await api.get('/loans/', { params })
            setLoans(response.data)
            if (response.headers['x-total-count']) {
                setPagination(prev => ({ ...prev, total: parseInt(response.headers['x-total-count']) }))
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load loans')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }))
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    const clearFilters = () => {
        setFilters({ search: '', status: '', loanType: '', branch: '' })
        setPagination(prev => ({ ...prev, page: 1 }))
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
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Loan Applications</h1>
                    <p className="text-gray-600 mt-1">Manage and track all loan applications</p>
                </div>
                <button
                    onClick={() => navigate('/loans/create')}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Loan Application
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by farmer name, loan ID..."
                                value={filters.search}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="disbursed">Disbursed</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="overdue">Overdue</option>
                    </select>

                    <select
                        value={filters.loanType}
                        onChange={(e) => handleFilterChange('loanType', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Types</option>
                        <option value="sao">SAO (Short-term)</option>
                        <option value="long_term_emi">Long Term EMI</option>
                        <option value="rythu_bandhu">Rythu Bandhu</option>
                        <option value="rythu_nethany">Rythu Nathany</option>
                        <option value="amul_loan">Amul Loans</option>
                    </select>
                </div>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <FunnelIcon className="h-4 w-4" />
                        Clear Filters
                    </button>
                    <button
                        onClick={fetchLoans}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No loans found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loans.map((loan) => (
                                        <tr key={loan.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm">#{loan.id}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{loan.farmer_name || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">{loan.farmer_id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm">{getLoanTypeName(loan.loan_type)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold">{formatCurrency(loan.principal_amount)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(loan.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(loan.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/loans/${loan.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-gray-700">
                                Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                                {pagination.total} results
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page * pagination.pageSize >= pagination.total}
                                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
