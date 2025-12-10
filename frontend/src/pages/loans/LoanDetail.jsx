import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    BanknotesIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline'
import {
    getLoanTypeName,
    getLoanTypeDescription,
    getLoanStatusName,
    formatCurrency,
    formatDate
} from '../../utils/loanHelpers'

export default function LoanDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [loan, setLoan] = useState(null)
    const [emiSchedule, setEmiSchedule] = useState([])
    const [activeTab, setActiveTab] = useState('details')
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (id) {
            fetchLoanDetails()
            fetchEMISchedule()
        }
    }, [id])

    const fetchLoanDetails = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/loans/${id}`)
            setLoan(response.data)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load loan details')
        } finally {
            setLoading(false)
        }
    }

    const fetchEMISchedule = async () => {
        try {
            const response = await api.get(`/loans/${id}/emi-schedule`)
            setEmiSchedule(response.data)
        } catch (error) {
            console.error('Error loading EMI schedule:', error)
        }
    }

    const getErrorMessage = (error, defaultMessage) => {
        const errorDetail = error.response?.data?.detail

        if (typeof errorDetail === 'string') {
            return errorDetail
        } else if (Array.isArray(errorDetail)) {
            return errorDetail.map(err => {
                if (typeof err === 'string') return err
                if (err.msg) return typeof err.msg === 'string' ? err.msg : String(err.msg)
                return String(err)
            }).join(', ')
        } else if (errorDetail && typeof errorDetail === 'object') {
            return String(errorDetail)
        }

        return defaultMessage
    }

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this loan?')) return

        try {
            setActionLoading(true)
            await api.post(`/loans/${id}/approve`, {})
            toast.success('Loan approved successfully')
            fetchLoanDetails()
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to approve loan'))
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        const reason = window.prompt('Please provide a reason for rejection:')
        if (!reason) return

        try {
            setActionLoading(true)
            await api.post(`/loans/${id}/reject`, { reason })
            toast.success('Loan rejected')
            fetchLoanDetails()
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to reject loan'))
        } finally {
            setActionLoading(false)
        }
    }

    const handleDisburse = async () => {
        if (!window.confirm('Are you sure you want to disburse this loan?')) return

        try {
            setActionLoading(true)
            await api.post(`/loans/${id}/disburse`)
            toast.success('Loan disbursed successfully')
            fetchLoanDetails()
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to disburse loan'))
        } finally {
            setActionLoading(false)
        }
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
            pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon, label: 'Pending Approval' },
            approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Rejected' },
            disbursed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: BanknotesIcon, label: 'Disbursed' },
            active: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: CheckCircleIcon, label: 'Active' },
            closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircleIcon, label: 'Closed' }
        }
        const item = config[status] || config.pending_approval
        const Icon = item.icon
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${item.bg} ${item.text}`}>
                <Icon className="h-4 w-4" />
                {item.label}
            </span>
        )
    }

    const getEMIStatusBadge = (status) => {
        const config = {
            paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
            partial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Partial' }
        }
        const item = config[status] || config.pending
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.bg} ${item.text}`}>
                {item.label}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!loan) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Loan not found</p>
                <button onClick={() => navigate('/loans')} className="mt-4 text-indigo-600 hover:text-indigo-800">
                    Back to Loans
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/loans')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Loan #{loan.id}</h1>
                        <p className="text-gray-600 mt-1">{getLoanTypeName(loan.loan_type)}</p>
                        <p className="text-sm text-gray-500">{getLoanTypeDescription(loan.loan_type)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(loan.status)}
                    {loan.status === 'pending_approval' && (
                        <>
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                Approve
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </>
                    )}
                    {loan.status === 'approved' && (
                        <button
                            onClick={handleDisburse}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            Disburse
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                    <p className="text-sm font-medium text-gray-600">Loan Amount</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(loan.principal_amount)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-600">Interest Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{loan.interest_rate}%</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-600">Tenure</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{loan.tenure_months} months</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'details'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Loan Details
                        </button>
                        <button
                            onClick={() => setActiveTab('emi')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'emi'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            EMI Schedule
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'documents'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Documents
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Farmer Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{loan.farmer_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Farmer ID</p>
                                        <p className="font-medium">#{loan.farmer_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Branch</p>
                                        <p className="font-medium">{loan.branch_name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Loan Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Application Date</p>
                                        <p className="font-medium">{formatDate(loan.created_at)}</p>
                                    </div>
                                    {loan.disbursement_date && (
                                        <div>
                                            <p className="text-sm text-gray-500">Disbursement Date</p>
                                            <p className="font-medium">{formatDate(loan.disbursement_date)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500">Purpose</p>
                                        <p className="font-medium">{loan.purpose || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'emi' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">EMI Payment Schedule</h3>
                            {emiSchedule.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No EMI schedule available</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMI No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMI Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {emiSchedule.map((emi, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{index + 1}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(emi.due_date)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                                                        {formatCurrency(emi.emi_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(emi.principal)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(emi.interest)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(emi.balance)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getEMIStatusBadge(emi.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Loan Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4 flex items-center gap-3">
                                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                                    <div>
                                        <p className="font-medium">Application Form</p>
                                        <p className="text-sm text-gray-500">PDF Document</p>
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4 flex items-center gap-3">
                                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                                    <div>
                                        <p className="font-medium">Identity Proof</p>
                                        <p className="text-sm text-gray-500">Image</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/documents?loan_id=${id}`)}
                                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                View All Documents →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
