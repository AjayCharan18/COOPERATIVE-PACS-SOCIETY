import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarIcon,
    CurrencyRupeeIcon
} from '@heroicons/react/24/outline'

export default function LoanRescheduling({ loanId, loanNumber, onClose, onSuccess }) {
    const [step, setStep] = useState(1) // 1: Options, 2: Confirm, 3: Success
    const [options, setOptions] = useState(null)
    const [selectedOption, setSelectedOption] = useState(null)
    const [loading, setLoading] = useState(false)
    const [customValues, setCustomValues] = useState({
        new_tenure_months: '',
        new_interest_rate: '',
        restructure_date: new Date().toISOString().split('T')[0],
        reason: ''
    })

    useEffect(() => {
        loadOptions()
    }, [])

    const loadOptions = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/loan-rescheduling/options/${loanId}`)
            setOptions(response.data)
        } catch (error) {
            toast.error('Failed to load rescheduling options')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleReschedule = async () => {
        setLoading(true)
        try {
            const payload = selectedOption === 'custom'
                ? customValues
                : {
                    new_tenure_months: selectedOption.new_tenure_months,
                    new_interest_rate: options.current_interest_rate,
                    restructure_date: customValues.restructure_date,
                    reason: customValues.reason
                }

            const response = await api.post(`/loan-rescheduling/reschedule/${loanId}`, payload)
            toast.success(response.data.message)
            setStep(3)
            if (onSuccess) onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to reschedule loan')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !options) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-center mt-4 text-gray-600">Loading options...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Loan Rescheduling</h2>
                        <p className="text-sm text-gray-600">{loanNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 && options && (
                        <div className="space-y-6">
                            {/* Current Loan Details */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Current Loan Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Outstanding</p>
                                        <p className="font-semibold">₹{options.current_outstanding_principal.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Tenure</p>
                                        <p className="font-semibold">{options.current_tenure_months} months</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Interest Rate</p>
                                        <p className="font-semibold">{options.current_interest_rate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Current EMI</p>
                                        <p className="font-semibold">₹{options.current_emi_amount?.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rescheduling Options */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Choose a Rescheduling Option</h3>
                                <div className="space-y-3">
                                    {options.rescheduling_options?.map((option, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedOption(option)}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedOption === option
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">{option.option}</h4>
                                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-gray-600">New Tenure</p>
                                                            <p className="font-semibold">{option.new_tenure_months} months</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600">New EMI</p>
                                                            <p className="font-semibold text-green-600">₹{option.new_emi_amount.toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600">Savings/Month</p>
                                                            <p className="font-semibold text-green-600">
                                                                {option.savings_per_month ? `₹${option.savings_per_month.toLocaleString('en-IN')}` : '-'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600">Total Payable</p>
                                                            <p className="font-semibold">₹{option.total_payable.toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedOption === option && (
                                                    <CheckCircleIcon className="h-6 w-6 text-indigo-600 ml-4" />
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Custom Option */}
                                    <div
                                        onClick={() => setSelectedOption('custom')}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedOption === 'custom'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <h4 className="font-medium text-gray-900">Custom Rescheduling</h4>
                                            {selectedOption === 'custom' && (
                                                <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                                            )}
                                        </div>
                                        {selectedOption === 'custom' && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        New Tenure (months)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={customValues.new_tenure_months}
                                                        onChange={(e) => setCustomValues({ ...customValues, new_tenure_months: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        New Interest Rate (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={customValues.new_interest_rate}
                                                        onChange={(e) => setCustomValues({ ...customValues, new_interest_rate: parseFloat(e.target.value) })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Common Fields */}
                            {selectedOption && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Restructure Date
                                        </label>
                                        <input
                                            type="date"
                                            value={customValues.restructure_date}
                                            onChange={(e) => setCustomValues({ ...customValues, restructure_date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reason for Rescheduling
                                        </label>
                                        <textarea
                                            value={customValues.reason}
                                            onChange={(e) => setCustomValues({ ...customValues, reason: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter reason for rescheduling..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedOption}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800 font-medium">⚠️ Confirmation Required</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Please review the rescheduling details carefully before confirming.
                                    This action will delete the existing EMI schedule and generate a new one.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Rescheduling Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">New Tenure:</span>
                                        <span className="font-medium">
                                            {selectedOption === 'custom'
                                                ? `${customValues.new_tenure_months} months`
                                                : `${selectedOption.new_tenure_months} months`}
                                        </span>
                                    </div>
                                    {selectedOption === 'custom' && customValues.new_interest_rate && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">New Interest Rate:</span>
                                            <span className="font-medium">{customValues.new_interest_rate}%</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Restructure Date:</span>
                                        <span className="font-medium">{customValues.restructure_date}</span>
                                    </div>
                                    {customValues.reason && (
                                        <div className="pt-2 border-t">
                                            <span className="text-gray-600">Reason:</span>
                                            <p className="font-medium mt-1">{customValues.reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleReschedule}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Confirm Rescheduling'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8">
                            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loan Rescheduled Successfully!</h3>
                            <p className="text-gray-600 mb-6">
                                The new EMI schedule has been generated for loan {loanNumber}.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
