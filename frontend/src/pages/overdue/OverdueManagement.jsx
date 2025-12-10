import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ExclamationTriangleIcon,
    ClockIcon,
    CurrencyRupeeIcon,
    ChartBarIcon,
    ArrowUpTrayIcon,
    DocumentArrowUpIcon
} from '@heroicons/react/24/outline'

export default function OverdueManagement() {
    const [overdueSummary, setOverdueSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [checking, setChecking] = useState(false)
    const [uploading, setUploading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        loadOverdueSummary()
    }, [])

    const loadOverdueSummary = async () => {
        try {
            const response = await api.get('/overdue/summary')
            setOverdueSummary(response.data)
        } catch (error) {
            toast.error('Failed to load overdue summary')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckOverdue = async () => {
        setChecking(true)
        try {
            const response = await api.post('/overdue/check-overdue')
            toast.success(response.data.message)
            loadOverdueSummary() // Reload summary
        } catch (error) {
            toast.error('Failed to check overdue EMIs')
            console.error(error)
        } finally {
            setChecking(false)
        }
    }

    const handleViewLoanOverdue = (loanId) => {
        navigate(`/loans/${loanId}`)
    }

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Validate file type
        const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Please upload a valid Excel file (.xlsx or .xls)')
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await api.post('/overdue/import-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            toast.success(`Successfully imported ${response.data.imported_count} overdue records`)
            loadOverdueSummary() // Reload summary
            // Reset file input
            event.target.value = ''
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to import Excel file')
            console.error(error)
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overdue Management</h1>
                    <p className="text-gray-600 mt-1">Track and manage overdue loans and EMIs</p>
                </div>
                <div className="flex gap-3">
                    {/* Upload Excel Button */}
                    <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2">
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <DocumentArrowUpIcon className="h-5 w-5" />
                                Import Excel
                            </>
                        )}
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>

                    {/* Check Overdue Button */}
                    <button
                        onClick={handleCheckOverdue}
                        disabled={checking}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {checking ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Checking...
                            </>
                        ) : (
                            <>
                                <ClockIcon className="h-5 w-5" />
                                Check Overdue EMIs
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Overdue Loans</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">
                                {overdueSummary?.total_overdue_loans || 0}
                            </p>
                        </div>
                        <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Overdue Amount</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">
                                ₹{overdueSummary?.loans?.reduce((sum, loan) => sum + loan.total_overdue_amount, 0).toLocaleString('en-IN') || 0}
                            </p>
                        </div>
                        <CurrencyRupeeIcon className="h-12 w-12 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Penal Interest</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-2">
                                ₹{overdueSummary?.loans?.reduce((sum, loan) => sum + loan.total_penal_interest, 0).toLocaleString('en-IN') || 0}
                            </p>
                        </div>
                        <ChartBarIcon className="h-12 w-12 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Overdue Loans Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Overdue Loans</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loan Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Farmer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Overdue EMIs
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Overdue Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Penal Interest
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Max Overdue Days
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {overdueSummary?.loans?.length > 0 ? (
                                overdueSummary.loans.map((loan) => (
                                    <tr key={loan.loan_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {loan.loan_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{loan.farmer_name}</div>
                                                <div className="text-sm text-gray-500">{loan.farmer_mobile}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                {loan.overdue_emis_count} EMIs
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{loan.total_overdue_amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                                            ₹{loan.total_penal_interest.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${loan.max_overdue_days > 90 ? 'bg-red-100 text-red-800' :
                                                loan.max_overdue_days > 30 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {loan.max_overdue_days} days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleViewLoanOverdue(loan.loan_id)}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                        <p className="text-lg font-medium">No overdue loans found</p>
                                        <p className="text-sm mt-1">All EMIs are paid on time!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
