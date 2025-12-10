import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    CalculatorIcon,
    CurrencyRupeeIcon,
    CalendarIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function ProRataCalculator() {
    const [loanTypes, setLoanTypes] = useState([])
    const [formData, setFormData] = useState({
        loan_type: '',
        principal_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        days: ''
    })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loanTypeConfig, setLoanTypeConfig] = useState(null)

    useEffect(() => {
        fetchLoanTypes()
    }, [])

    const fetchLoanTypes = async () => {
        try {
            const response = await api.get('/loans/loan-types')
            setLoanTypes(response.data)
        } catch (error) {
            console.error('Error fetching loan types:', error)
            toast.error('Failed to load loan types')
        }
    }

    const handleLoanTypeChange = (loanType) => {
        setFormData({ ...formData, loan_type: loanType })
        const config = loanTypes.find(lt => lt.loan_type === loanType)
        setLoanTypeConfig(config)
        setResult(null)
    }

    const handleAmountChange = (amount) => {
        setFormData({ ...formData, principal_amount: amount })
        setResult(null)
    }

    const handleDaysChange = (days) => {
        if (days && formData.start_date) {
            const startDate = new Date(formData.start_date)
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + parseInt(days))
            setFormData({
                ...formData,
                days: days,
                end_date: endDate.toISOString().split('T')[0]
            })
        } else {
            setFormData({ ...formData, days: days })
        }
        setResult(null)
    }

    const handleStartDateChange = (date) => {
        setFormData({ ...formData, start_date: date })
        if (formData.days) {
            const startDate = new Date(date)
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + parseInt(formData.days))
            setFormData({
                ...formData,
                start_date: date,
                end_date: endDate.toISOString().split('T')[0]
            })
        }
        setResult(null)
    }

    const handleEndDateChange = (date) => {
        if (formData.start_date && date) {
            const startDate = new Date(formData.start_date)
            const endDate = new Date(date)
            const diffTime = Math.abs(endDate - startDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            setFormData({ ...formData, end_date: date, days: diffDays.toString() })
        } else {
            setFormData({ ...formData, end_date: date })
        }
        setResult(null)
    }

    const calculateInterest = async () => {
        if (!formData.loan_type || !formData.principal_amount || !formData.days) {
            toast.error('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/calculate/interest-for-days', {
                loan_type: formData.loan_type,
                principal_amount: parseFloat(formData.principal_amount),
                days: parseInt(formData.days),
                disbursement_date: formData.start_date
            })
            setResult(response.data)
            toast.success('Interest calculated successfully')
        } catch (error) {
            console.error('Error:', error)
            toast.error(error.response?.data?.detail || 'Failed to calculate interest')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setFormData({
            loan_type: '',
            principal_amount: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            days: ''
        })
        setResult(null)
        setLoanTypeConfig(null)
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <CalculatorIcon className="h-8 w-8" />
                    <h1 className="text-2xl font-bold">Pro-Rata Interest Calculator</h1>
                </div>
                <p className="text-indigo-100">
                    Calculate exact daily interest for any loan type and amount. Help farmers understand their interest charges before taking a loan.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan Details</h2>

                    <div className="space-y-4">
                        {/* Loan Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loan Type *
                            </label>
                            <select
                                value={formData.loan_type}
                                onChange={(e) => handleLoanTypeChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select Loan Type</option>
                                {loanTypes.map(lt => (
                                    <option key={lt.loan_type} value={lt.loan_type}>
                                        {lt.name} ({lt.loan_type.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Show Loan Type Info */}
                        {loanTypeConfig && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-blue-900 mb-2">{loanTypeConfig.name}</h3>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p>Interest Rate (Year 1): <strong>{loanTypeConfig.base_interest_rate}%</strong></p>
                                    <p>Interest Rate (After 1 Year): <strong>{loanTypeConfig.interest_rate_after_year}%</strong></p>
                                    <p>Max Amount: <strong>₹{loanTypeConfig.max_amount?.toLocaleString()}</strong></p>
                                    <p>Max Tenure: <strong>{loanTypeConfig.max_tenure_months} months</strong></p>
                                </div>
                            </div>
                        )}

                        {/* Principal Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Principal Amount (₹) *
                            </label>
                            <input
                                type="number"
                                value={formData.principal_amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="Enter loan amount"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                min="0"
                                max={loanTypeConfig?.max_amount || 10000000}
                            />
                            {loanTypeConfig && formData.principal_amount && parseFloat(formData.principal_amount) > loanTypeConfig.max_amount && (
                                <p className="text-red-600 text-sm mt-1">
                                    Amount exceeds maximum limit of ₹{loanTypeConfig.max_amount.toLocaleString()}
                                </p>
                            )}
                        </div>

                        {/* Period Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Days *
                                </label>
                                <input
                                    type="number"
                                    value={formData.days}
                                    onChange={(e) => handleDaysChange(e.target.value)}
                                    placeholder="Enter days"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* End Date (Auto-calculated) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date (Auto-calculated)
                            </label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={calculateInterest}
                                disabled={loading || !formData.loan_type || !formData.principal_amount || !formData.days}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Calculating...
                                    </>
                                ) : (
                                    <>
                                        <CalculatorIcon className="h-5 w-5" />
                                        Calculate Interest
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Display */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Interest Calculation Results</h2>

                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <InformationCircleIcon className="h-16 w-16 mb-3" />
                            <p className="text-center">
                                Enter loan details and click "Calculate Interest" to see results
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-600 font-medium mb-1">Total Interest</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        ₹{result.total_interest?.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Daily Interest</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        ₹{result.daily_interest?.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Period Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Period Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Period:</span>
                                        <span className="font-semibold text-gray-900">{result.days} days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Start Date:</span>
                                        <span className="font-semibold text-gray-900">{result.start_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">End Date:</span>
                                        <span className="font-semibold text-gray-900">{result.end_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Principal Amount:</span>
                                        <span className="font-semibold text-gray-900">₹{result.principal_amount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Rate Breakdown */}
                            {result.rate_breakdown && (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h3 className="font-semibold text-purple-900 mb-3">Interest Rate Breakdown</h3>
                                    <div className="space-y-3">
                                        {result.rate_breakdown.map((period, index) => (
                                            <div key={index} className="bg-white p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Period {index + 1}: {period.days} days
                                                    </span>
                                                    <span className="text-sm font-bold text-purple-700">
                                                        {period.rate}% p.a.
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Interest for this period:</span>
                                                    <span className="font-semibold text-gray-900">
                                                        ₹{period.interest?.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Total Amount */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-lg text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm opacity-90 mb-1">Total Amount Payable</p>
                                        <p className="text-3xl font-bold">
                                            ₹{(result.principal_amount + result.total_interest).toLocaleString()}
                                        </p>
                                    </div>
                                    <CurrencyRupeeIcon className="h-12 w-12 opacity-50" />
                                </div>
                            </div>

                            {/* Information Note */}
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <div className="flex gap-2">
                                    <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-semibold mb-1">Note:</p>
                                        <p>
                                            Interest rates automatically switch after 1 year for applicable loan types.
                                            This calculation uses the pro-rata method for accurate daily interest computation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
