import { useState } from 'react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    DocumentArrowDownIcon,
    DocumentTextIcon,
    CalendarIcon,
    FunnelIcon
} from '@heroicons/react/24/outline'

export default function Reports() {
    const [filters, setFilters] = useState({
        status: '',
        loan_type: '',
        from_date: '',
        to_date: ''
    })
    const [downloading, setDownloading] = useState(false)
    const [summaryData, setSummaryData] = useState(null)
    const [monthlyData, setMonthlyData] = useState(null)
    const [showSummaryModal, setShowSummaryModal] = useState(false)
    const [showMonthlyModal, setShowMonthlyModal] = useState(false)

    const loanStatuses = ['pending_approval', 'approved', 'active', 'closed', 'defaulted', 'rejected']
    const loanTypes = ['sao', 'long_term_emi', 'rythu_bandhu', 'rythu_nethany', 'amul_loan']

    const handleExportLoans = async () => {
        setDownloading(true)
        try {
            const params = new URLSearchParams()
            if (filters.status) params.append('status', filters.status)
            if (filters.loan_type) params.append('loan_type', filters.loan_type)
            if (filters.from_date) params.append('from_date', filters.from_date)
            if (filters.to_date) params.append('to_date', filters.to_date)

            const response = await api.get(`/reports/loans/export?${params.toString()}`, {
                responseType: 'blob'
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `loans_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()

            toast.success('Loans exported successfully')
        } catch (error) {
            toast.error('Failed to export loans')
            console.error(error)
        } finally {
            setDownloading(false)
        }
    }

    const handleViewSummary = async () => {
        try {
            const params = new URLSearchParams()
            if (filters.from_date) params.append('from_date', filters.from_date)
            if (filters.to_date) params.append('to_date', filters.to_date)

            const response = await api.get(`/reports/summary?${params.toString()}`)
            setSummaryData(response.data)
            setShowSummaryModal(true)
            toast.success('Summary loaded successfully')
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to load summary')
            console.error(error)
        }
    }

    const handleGenerateMonthlyReport = async () => {
        try {
            const response = await api.get('/reports/monthly')
            setMonthlyData(response.data)
            setShowMonthlyModal(true)
            toast.success('Monthly report generated successfully')
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to generate monthly report')
            console.error(error)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
                <p className="text-gray-600 mt-1">Generate and download various reports</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Loan Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Statuses</option>
                            {loanStatuses.map(status => (
                                <option key={status} value={status}>
                                    {status.replace('_', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Loan Type
                        </label>
                        <select
                            value={filters.loan_type}
                            onChange={(e) => setFilters({ ...filters, loan_type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Types</option>
                            {loanTypes.map(type => (
                                <option key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={filters.from_date}
                            onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={filters.to_date}
                            onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Export Loans */}
                <div className="bg-white rounded-lg shadow p-6">
                    <DocumentArrowDownIcon className="h-12 w-12 text-indigo-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Loans</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Download all loans matching the selected filters in CSV format
                    </p>
                    <button
                        onClick={handleExportLoans}
                        disabled={downloading}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {downloading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <DocumentArrowDownIcon className="h-5 w-5" />
                                Export to CSV
                            </>
                        )}
                    </button>
                </div>

                {/* Summary Report */}
                <div className="bg-white rounded-lg shadow p-6">
                    <DocumentTextIcon className="h-12 w-12 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loan Summary</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        View comprehensive loan summary with statistics and breakdowns
                    </p>
                    <button
                        onClick={handleViewSummary}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <DocumentTextIcon className="h-5 w-5" />
                        View Summary
                    </button>
                </div>

                {/* Monthly Report */}
                <div className="bg-white rounded-lg shadow p-6">
                    <CalendarIcon className="h-12 w-12 text-purple-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Generate monthly performance report for the current month
                    </p>
                    <button
                        onClick={handleGenerateMonthlyReport}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                        <CalendarIcon className="h-5 w-5" />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <h2 className="text-xl font-bold mb-4">Report Generation Tips</h2>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Use filters to narrow down loan data before exporting</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>CSV files can be opened in Excel or Google Sheets</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Summary reports provide JSON data for API integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>EMI schedule exports are available from individual loan details</span>
                    </li>
                </ul>
            </div>

            {/* Summary Modal */}
            {showSummaryModal && summaryData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Loan Summary Report</h2>
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Report Period */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Report Period</h3>
                                <p className="text-sm text-gray-600">
                                    {summaryData.report_period.from_date
                                        ? `${summaryData.report_period.from_date} to ${summaryData.report_period.to_date}`
                                        : 'All Time'
                                    }
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Generated: {new Date(summaryData.report_period.generated_at).toLocaleString()}
                                </p>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Total Loans</p>
                                    <p className="text-2xl font-bold text-blue-900">{summaryData.summary.total_loans}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium">Principal Amount</p>
                                    <p className="text-2xl font-bold text-green-900">₹{summaryData.summary.total_principal_amount.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-purple-600 font-medium">Disbursed</p>
                                    <p className="text-2xl font-bold text-purple-900">₹{summaryData.summary.total_disbursed_amount.toLocaleString()}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                                    <p className="text-2xl font-bold text-orange-900">₹{summaryData.summary.total_outstanding_amount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Status Breakdown */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Breakdown by Status</h3>
                                <div className="space-y-2">
                                    {Object.entries(summaryData.breakdown_by_status).map(([status, data]) => (
                                        <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{data.count} loans</p>
                                                <p className="text-sm text-gray-600">₹{data.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Type Breakdown */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Breakdown by Loan Type</h3>
                                <div className="space-y-2">
                                    {Object.entries(summaryData.breakdown_by_type).map(([type, data]) => (
                                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium text-gray-700 uppercase">{type.replace('_', ' ')}</span>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{data.count} loans</p>
                                                <p className="text-sm text-gray-600">₹{data.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Report Modal */}
            {showMonthlyModal && monthlyData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Monthly Performance Report</h2>
                            <button
                                onClick={() => setShowMonthlyModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Report Period */}
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-1">{monthlyData.report_period.month_name}</h3>
                                <p className="text-sm opacity-90">
                                    Generated: {new Date(monthlyData.report_period.generated_at).toLocaleString()}
                                </p>
                            </div>

                            {/* Loan Statistics */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Loan Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600 font-medium">Created</p>
                                        <p className="text-2xl font-bold text-blue-900">{monthlyData.loan_statistics.loans_created}</p>
                                        <p className="text-xs text-blue-700 mt-1">₹{monthlyData.loan_statistics.amount_sanctioned.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-green-600 font-medium">Disbursed</p>
                                        <p className="text-2xl font-bold text-green-900">{monthlyData.loan_statistics.loans_disbursed}</p>
                                        <p className="text-xs text-green-700 mt-1">₹{monthlyData.loan_statistics.amount_disbursed.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <p className="text-sm text-purple-600 font-medium">EMIs Due</p>
                                        <p className="text-2xl font-bold text-purple-900">{monthlyData.collection_statistics.emis_due}</p>
                                        <p className="text-xs text-purple-700 mt-1">₹{monthlyData.collection_statistics.amount_due.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <p className="text-sm text-orange-600 font-medium">EMIs Paid</p>
                                        <p className="text-2xl font-bold text-orange-900">{monthlyData.collection_statistics.emis_paid}</p>
                                        <p className="text-xs text-orange-700 mt-1">₹{monthlyData.collection_statistics.amount_collected.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Collection Efficiency */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Collection Performance</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                        <p className="text-sm text-green-700 font-medium mb-1">Collection Rate</p>
                                        <p className="text-3xl font-bold text-green-900">{monthlyData.collection_statistics.collection_rate_percentage}%</p>
                                        <p className="text-xs text-green-600 mt-1">EMIs paid vs due</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-700 font-medium mb-1">Collection Efficiency</p>
                                        <p className="text-3xl font-bold text-blue-900">{monthlyData.collection_statistics.collection_efficiency_percentage}%</p>
                                        <p className="text-xs text-blue-600 mt-1">Amount collected vs due</p>
                                    </div>
                                </div>
                            </div>

                            {/* Loans by Status */}
                            {Object.keys(monthlyData.loan_statistics.loans_by_status).length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Loans by Status (This Month)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(monthlyData.loan_statistics.loans_by_status).map(([status, count]) => (
                                            <div key={status} className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                                                <p className="text-xl font-bold text-gray-900">{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment Summary */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                                <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Payments</p>
                                        <p className="text-2xl font-bold text-gray-900">{monthlyData.payment_statistics.total_payments}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Amount</p>
                                        <p className="text-2xl font-bold text-gray-900">₹{monthlyData.payment_statistics.total_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
