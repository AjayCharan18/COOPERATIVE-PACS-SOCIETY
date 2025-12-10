import { useState } from 'react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    CheckCircleIcon,
    XCircleIcon,
    CurrencyRupeeIcon,
    CalendarIcon
} from '@heroicons/react/24/outline'

export default function LoanClosure({ loanId, loanNumber, onClose, onSuccess }) {
    const [step, setStep] = useState(1) // 1: Calculate, 2: Confirm, 3: Success
    const [closureDetails, setClosureDetails] = useState(null)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        closure_amount: '',
        payment_mode: 'cash',
        remarks: ''
    })

    const calculateClosure = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/loan-closure/calculate/${loanId}`)
            setClosureDetails(response.data)
            setFormData(prev => ({
                ...prev,
                closure_amount: response.data.total_closure_amount
            }))
            setStep(2)
        } catch (error) {
            toast.error('Failed to calculate closure amount')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCloseLoan = async () => {
        setLoading(true)
        try {
            const response = await api.post(`/loan-closure/close/${loanId}`, formData)
            toast.success(response.data.message)
            setStep(3)
            if (onSuccess) onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to close loan')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">
                        Loan Closure - {loanNumber}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    Click the button below to calculate the total amount required to close this loan.
                                    This includes outstanding principal, interest, and any penal charges.
                                </p>
                            </div>
                            <button
                                onClick={calculateClosure}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                            >
                                {loading ? 'Calculating...' : 'Calculate Closure Amount'}
                            </button>
                        </div>
                    )}

                    {step === 2 && closureDetails && (
                        <div className="space-y-6">
                            {/* Closure Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-gray-900">Closure Amount Breakdown</h3>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Outstanding Principal:</span>
                                    <span className="font-medium">₹{closureDetails.outstanding_principal.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Outstanding Interest:</span>
                                    <span className="font-medium">₹{closureDetails.outstanding_interest.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Penal Interest:</span>
                                    <span className="font-medium text-orange-600">₹{closureDetails.penal_interest.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Unpaid EMIs:</span>
                                    <span className="font-medium">{closureDetails.unpaid_emis_count} installments</span>
                                </div>

                                <div className="pt-3 border-t border-gray-300">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-900">Total Closure Amount:</span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                            ₹{closureDetails.total_closure_amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Closure Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.closure_amount}
                                        onChange={(e) => setFormData({ ...formData, closure_amount: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Mode
                                    </label>
                                    <select
                                        value={formData.payment_mode}
                                        onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="neft">NEFT</option>
                                        <option value="rtgs">RTGS</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="demand_draft">Demand Draft</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remarks
                                    </label>
                                    <textarea
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Optional remarks..."
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCloseLoan}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                                >
                                    {loading ? 'Processing...' : 'Close Loan'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8">
                            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loan Closed Successfully!</h3>
                            <p className="text-gray-600 mb-6">
                                Loan {loanNumber} has been successfully closed.
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
