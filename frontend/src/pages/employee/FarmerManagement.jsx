import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
    EyeIcon,
    PencilSquareIcon,
    BanknotesIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import {
    getLoanTypeName,
    getLoanStatusName,
    formatCurrency
} from '../../utils/loanHelpers'

export default function FarmerManagement() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [farmers, setFarmers] = useState([])
    const [selectedFarmer, setSelectedFarmer] = useState(null)
    const [farmerLoans, setFarmerLoans] = useState([])
    const [expandedLoan, setExpandedLoan] = useState(null)
    const [editingLoan, setEditingLoan] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showCredentialsModal, setShowCredentialsModal] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState(null)
    const [branches, setBranches] = useState([])

    useEffect(() => {
        fetchFarmers()
        fetchBranches()
    }, [])

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches/')
            console.log('Branches response:', response.data)
            setBranches(response.data)
        } catch (error) {
            console.error('Error fetching branches:', error)
            console.error('Error details:', error.response?.data)
            toast.error('Failed to load branches')
        }
    }

    const fetchFarmers = async () => {
        try {
            setLoading(true)
            // Fetch all users with role FARMER
            const response = await api.get('/auth/users/', {
                params: { role: 'farmer' }
            })
            setFarmers(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load farmers')
            setFarmers([])
        } finally {
            setLoading(false)
        }
    }

    const fetchFarmerLoans = async (farmerId) => {
        try {
            const response = await api.get('/loans/', {
                params: { farmer_id: farmerId }
            })
            setFarmerLoans(response.data)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load farmer loans')
        }
    }

    const handleSelectFarmer = async (farmer) => {
        setSelectedFarmer(farmer)
        setExpandedLoan(null)
        setEditingLoan(null)
        await fetchFarmerLoans(farmer.id)
    }

    const handleUpdateLoan = async (loanId, updates) => {
        try {
            await api.put(`/loans/${loanId}`, updates)
            toast.success('Loan updated successfully')
            setEditingLoan(null)
            await fetchFarmerLoans(selectedFarmer.id)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to update loan')
        }
    }

    const handleDeleteFarmer = async (farmerId, farmerName) => {
        if (!confirm(`Are you sure you want to delete ${farmerName}? This action cannot be undone.`)) {
            return
        }

        try {
            await api.delete(`/auth/users/${farmerId}`)
            toast.success('Farmer deleted successfully')
            if (selectedFarmer?.id === farmerId) {
                setSelectedFarmer(null)
                setFarmerLoans([])
            }
            await fetchFarmers()
        } catch (error) {
            console.error('Error:', error)

            // Check if error response has detailed loan information
            if (error.response?.status === 400 && error.response?.data?.detail?.loans) {
                const detail = error.response.data.detail
                const loansList = detail.loans.map(loan =>
                    `- ${loan.loan_number} (${loan.status}): ₹${loan.amount.toLocaleString()}`
                ).join('\n')

                const forceDelete = confirm(
                    `${detail.message}\n\nLoans:\n${loansList}\n\n` +
                    `Do you want to automatically reject/close these loans and delete the farmer?`
                )

                if (forceDelete) {
                    try {
                        await api.delete(`/auth/users/${farmerId}?force=true`)
                        toast.success('Farmer and associated loans handled successfully')
                        if (selectedFarmer?.id === farmerId) {
                            setSelectedFarmer(null)
                            setFarmerLoans([])
                        }
                        await fetchFarmers()
                    } catch (forceError) {
                        console.error('Force delete error:', forceError)
                        toast.error(forceError.response?.data?.detail?.message || forceError.response?.data?.detail || 'Failed to delete farmer')
                    }
                }
            } else {
                // Handle regular error messages
                const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || 'Failed to delete farmer'
                toast.error(errorMsg)
            }
        }
    }

    const filteredFarmers = Array.isArray(farmers) ? farmers.filter(farmer =>
        farmer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.phone?.includes(searchTerm)
    ) : []

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
            pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
            approved: { bg: 'bg-green-100', text: 'text-green-800' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800' },
            disbursed: { bg: 'bg-blue-100', text: 'text-blue-800' },
            active: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
            closed: { bg: 'bg-gray-100', text: 'text-gray-800' },
            overdue: { bg: 'bg-red-100', text: 'text-red-800' }
        }
        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                {getLoanStatusName(status)}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserGroupIcon className="h-10 w-10" />
                        <div>
                            <h1 className="text-3xl font-bold">Farmer Management</h1>
                            <p className="text-blue-100 mt-1">View and manage all farmer loan data</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add New Farmer
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Farmers List */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search farmers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                            {filteredFarmers.length} farmers found
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                            </div>
                        ) : filteredFarmers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>No farmers found</p>
                            </div>
                        ) : (
                            filteredFarmers.map((farmer) => (
                                <div
                                    key={farmer.id}
                                    onClick={() => handleSelectFarmer(farmer)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedFarmer?.id === farmer.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{farmer.full_name}</h3>
                                                {farmer.farmer_id && (
                                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                                                        {farmer.farmer_id}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{farmer.email}</p>
                                            {farmer.phone && (
                                                <p className="text-sm text-gray-600">{farmer.phone}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteFarmer(farmer.id, farmer.full_name)
                                                }}
                                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                                title="Delete farmer"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                            {selectedFarmer?.id === farmer.id && (
                                                <ChevronUpIcon className="h-5 w-5 text-indigo-600" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Farmer Details & Loans */}
                <div className="lg:col-span-2">
                    {!selectedFarmer ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Farmer</h3>
                            <p className="text-gray-600">Choose a farmer from the list to view and manage their loans</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Farmer Info Card */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedFarmer.full_name}</h2>
                                        <p className="text-gray-600 mt-1">{selectedFarmer.email}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/loans/create?farmer_id=${selectedFarmer.id}`)}
                                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                                    >
                                        <BanknotesIcon className="h-5 w-5" />
                                        Create New Loan
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Total Loans</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{farmerLoans.length}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Active Loans</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {farmerLoans.filter(l => l.status === 'active' || l.status === 'disbursed').length}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Total Amount</p>
                                        <p className="text-xl font-bold text-gray-900 mt-1">
                                            {formatCurrency(farmerLoans.reduce((sum, l) => sum + (l.principal_amount || 0), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Loans List */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Loan Applications</h3>
                                    <p className="text-sm text-gray-600 mt-1">Click on a loan to view details and make updates</p>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {farmerLoans.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <BanknotesIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-gray-600">No loans found for this farmer</p>
                                            <button
                                                onClick={() => navigate(`/loans/create?farmer_id=${selectedFarmer.id}`)}
                                                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                                Create first loan →
                                            </button>
                                        </div>
                                    ) : (
                                        farmerLoans.map((loan) => (
                                            <div key={loan.id} className="p-6">
                                                {/* Loan Header */}
                                                <div
                                                    onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-lg font-semibold text-gray-900">
                                                                    {getLoanTypeName(loan.loan_type)}
                                                                </h4>
                                                                {getStatusBadge(loan.status)}
                                                            </div>
                                                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-gray-600">Loan ID:</span>
                                                                    <span className="ml-2 font-medium text-gray-900">#{loan.id}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-600">Principal:</span>
                                                                    <span className="ml-2 font-medium text-gray-900">
                                                                        {formatCurrency(loan.principal_amount)}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-600">Outstanding:</span>
                                                                    <span className="ml-2 font-medium text-gray-900">
                                                                        {formatCurrency(loan.outstanding_balance)}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-600">Applied:</span>
                                                                    <span className="ml-2 font-medium text-gray-900">
                                                                        {formatDate(loan.application_date)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-4">
                                                            {expandedLoan === loan.id ? (
                                                                <ChevronUpIcon className="h-6 w-6 text-gray-400" />
                                                            ) : (
                                                                <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Loan Details */}
                                                {expandedLoan === loan.id && (
                                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                                        {editingLoan === loan.id ? (
                                                            <EditLoanForm
                                                                loan={loan}
                                                                onSave={(updates) => handleUpdateLoan(loan.id, updates)}
                                                                onCancel={() => setEditingLoan(null)}
                                                            />
                                                        ) : (
                                                            <div>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600">Interest Rate</label>
                                                                        <p className="mt-1 text-gray-900">{loan.interest_rate}%</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600">Tenure</label>
                                                                        <p className="mt-1 text-gray-900">{loan.tenure_months} months</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600">Disbursement Date</label>
                                                                        <p className="mt-1 text-gray-900">{formatDate(loan.disbursement_date)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600">Maturity Date</label>
                                                                        <p className="mt-1 text-gray-900">{formatDate(loan.maturity_date)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600">Total Payable</label>
                                                                        <p className="mt-1 text-gray-900">
                                                                            {formatCurrency(loan.total_amount_payable)}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600">Interest Accrued</label>
                                                                        <p className="mt-1 text-gray-900">
                                                                            {formatCurrency(loan.interest_accrued || 0)}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {loan.purpose && (
                                                                    <div className="mb-6">
                                                                        <label className="text-sm font-medium text-gray-600">Loan Purpose</label>
                                                                        <p className="mt-1 text-gray-900">{loan.purpose}</p>
                                                                    </div>
                                                                )}

                                                                <div className="flex gap-3">
                                                                    <button
                                                                        onClick={() => setEditingLoan(loan.id)}
                                                                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                                                                    >
                                                                        <PencilSquareIcon className="h-5 w-5" />
                                                                        Edit Loan Details
                                                                    </button>
                                                                    <button
                                                                        onClick={() => navigate(`/loans/${loan.id}`)}
                                                                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                                                                    >
                                                                        <EyeIcon className="h-5 w-5" />
                                                                        View Full Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Farmer Modal */}
            {showCreateModal && (
                <CreateFarmerModal
                    branches={branches}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        fetchFarmers()
                    }}
                />
            )}

            {/* Credentials Display Modal */}
            {showCredentialsModal && createdCredentials && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {createdCredentials.role} Created Successfully!
                            </h3>
                            <p className="text-gray-600">
                                Login credentials have been sent to the {createdCredentials.role.toLowerCase()}'s email
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                                <p className="text-base font-semibold text-gray-900">{createdCredentials.name}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                                <p className="text-base font-mono text-gray-900">{createdCredentials.email}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Mobile</p>
                                <p className="text-base font-mono text-gray-900">{createdCredentials.mobile}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Temporary Password</p>
                                <p className="text-lg font-mono font-bold text-indigo-600 bg-white px-3 py-2 rounded border-2 border-indigo-200">
                                    {createdCredentials.password}
                                </p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                            <p className="text-sm text-yellow-800">
                                <span className="font-semibold">Note:</span> The {createdCredentials.role.toLowerCase()} can login using either their email or mobile number along with this password.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowCredentialsModal(false)
                                setCreatedCredentials(null)
                            }}
                            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// Edit Loan Form Component
function EditLoanForm({ loan, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        principal_amount: loan.principal_amount,
        interest_rate: loan.interest_rate,
        tenure_months: loan.tenure_months,
        status: loan.status,
        purpose: loan.purpose || '',
        disbursement_date: loan.disbursement_date ? loan.disbursement_date.split('T')[0] : '',
        maturity_date: loan.maturity_date ? loan.maturity_date.split('T')[0] : ''
    })

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount</label>
                    <input
                        type="number"
                        value={formData.principal_amount}
                        onChange={(e) => handleChange('principal_amount', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.interest_rate}
                        onChange={(e) => handleChange('interest_rate', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Months)</label>
                    <input
                        type="number"
                        value={formData.tenure_months}
                        onChange={(e) => handleChange('tenure_months', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="pending_approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="disbursed">Disbursed</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disbursement Date</label>
                    <input
                        type="date"
                        value={formData.disbursement_date}
                        onChange={(e) => handleChange('disbursement_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
                    <input
                        type="date"
                        value={formData.maturity_date}
                        onChange={(e) => handleChange('maturity_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Purpose</label>
                <textarea
                    value={formData.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter loan purpose..."
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                    Save Changes
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

// Create Farmer Modal Component
function CreateFarmerModal({ branches, onClose, onSuccess }) {
    console.log('CreateFarmerModal - branches prop:', branches)

    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        mobile: '',
        branch_id: '',
        district: 'Hyderabad',
        state: 'Telangana',
        aadhaar_number: '',
        village: '',
        land_area: '',
        crop_type: '',
        send_credentials_via: 'email'
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const validateForm = () => {
        const newErrors = {}

        if (!formData.full_name) newErrors.full_name = 'Full name is required'
        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format'
        }
        if (!formData.mobile) {
            newErrors.mobile = 'Mobile is required'
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = 'Mobile must be 10 digits'
        }
        if (!formData.branch_id) newErrors.branch_id = 'Branch is required'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Please fix the errors')
            return
        }

        try {
            setLoading(true)
            // Convert branch_id to integer
            const dataToSend = {
                ...formData,
                branch_id: parseInt(formData.branch_id),
                mandal: formData.village // Use village as mandal for now
            }
            const response = await api.post('/auth/create-farmer-account', dataToSend)
            const farmerData = response.data

            // Show credentials modal
            setCreatedCredentials({
                name: farmerData.full_name,
                email: farmerData.email,
                mobile: farmerData.mobile,
                password: farmerData.temporary_password,
                role: 'Farmer'
            })
            setShowCredentialsModal(true)

            toast.success(`Farmer created successfully! Farmer ID: ${farmerData.farmer_id || 'N/A'}. Credentials sent via email.`)
            onSuccess()
        } catch (error) {
            console.error('Error:', error)
            toast.error(error.response?.data?.detail || 'Failed to create farmer')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Farmer</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className={`w-full px-3 py-2 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}
                                placeholder="Enter full name"
                            />
                            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className={`w-full px-3 py-2 border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}
                                placeholder="10 digit mobile"
                            />
                            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}
                                placeholder="email@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch *
                            </label>
                            <select
                                value={formData.branch_id}
                                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                className={`w-full px-3 py-2 border ${errors.branch_id ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}
                            >
                                <option value="">Select branch</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} ({branch.code})
                                    </option>
                                ))}
                            </select>
                            {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Send Credentials Via
                            </label>
                            <select
                                value={formData.send_credentials_via || 'email'}
                                onChange={(e) => setFormData({ ...formData, send_credentials_via: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="email">Email Only</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Login credentials will be sent via email
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Farmer'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
