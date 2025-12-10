import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeftIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function CreateLoan() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState([])
    const [farmers, setFarmers] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [formData, setFormData] = useState({
        farmer_id: '',
        branch_id: '',
        loan_type: '',
        amount: '',
        interest_rate: '',
        tenure_months: '',
        purpose: '',
        collateral_type: '',
        collateral_value: ''
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        fetchBranches()
        fetchCurrentUser()
    }, [])

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/auth/me')
            console.log('Current user data:', response.data)
            setCurrentUser(response.data)

            // If user is a farmer, auto-select their farmer_id
            if (response.data.role === 'farmer') {
                console.log('User is farmer, farmer_id:', response.data.farmer_id)
                const farmerId = response.data.farmer_id || response.data.id
                console.log('Setting farmer_id to:', farmerId)
                setFormData(prev => ({
                    ...prev,
                    farmer_id: farmerId.toString(),
                    branch_id: response.data.branch_id ? response.data.branch_id.toString() : ''
                }))
            } else if (response.data.role === 'employee' || response.data.role === 'admin') {
                // Only fetch farmers list if user is employee or admin
                fetchFarmers()
            }
        } catch (error) {
            console.error('Error fetching user:', error)
        }
    }

    const fetchFarmers = async () => {
        try {
            const response = await api.get('/auth/users/farmers')
            setFarmers(response.data)
        } catch (error) {
            console.error('Error loading farmers:', error)
            // Silently fail - farmers don't need this list
        }
    }

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches/')
            setBranches(response.data)
        } catch (error) {
            console.error('Error loading branches:', error)
        }
    }

    const loanTypeConfig = {
        'sao': {
            maxAmount: 100000,
            minTenure: 12,
            maxTenure: 12,
            suggestedRate: 7.0,
            rateAbove1Year: 13.75,
            displayName: 'SAO (Short-term)'
        },
        'long_term_emi': {
            maxAmount: 2000000,
            minTenure: 12,
            maxTenure: 120,
            suggestedRate: 12.0,
            rateAfter1Year: 12.75,
            displayName: 'Long Term EMI'
        },
        'rythu_bandhu': {
            maxAmount: 500000,
            minTenure: 12,
            maxTenure: 36,
            suggestedRate: 12.50,
            rateAbove1Year: 14.50,
            displayName: 'Rythu Bandhu'
        },
        'rythu_nethany': {
            maxAmount: 500000,
            minTenure: 12,
            maxTenure: 36,
            suggestedRate: 12.50,
            rateAbove1Year: 14.50,
            displayName: 'Rythu Nathany'
        },
        'amul_loan': {
            maxAmount: 300000,
            minTenure: 12,
            maxTenure: 120,
            suggestedRate: 12.0,
            rateAbove1Year: 14.0,
            displayName: 'Amul Loans'
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }

        // Auto-update interest rate based on loan type
        if (name === 'loan_type' && value) {
            const config = loanTypeConfig[value]
            if (config) {
                setFormData(prev => ({
                    ...prev,
                    interest_rate: config.suggestedRate,
                    amount: '',
                    tenure_months: ''
                }))
            }
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.farmer_id) newErrors.farmer_id = 'Farmer ID is required'
        if (!formData.branch_id) newErrors.branch_id = 'Branch is required'
        if (!formData.loan_type) newErrors.loan_type = 'Loan type is required'

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Valid amount is required'
        }

        const config = formData.loan_type ? loanTypeConfig[formData.loan_type] : null
        if (config && parseFloat(formData.amount) > config.maxAmount) {
            newErrors.amount = `Maximum amount for ${config.displayName} is ₹${config.maxAmount.toLocaleString()}`
        }

        if (!formData.interest_rate || parseFloat(formData.interest_rate) <= 0) {
            newErrors.interest_rate = 'Valid interest rate is required'
        }

        const tenure = parseInt(formData.tenure_months)
        if (!tenure || tenure <= 0) {
            newErrors.tenure_months = 'Valid tenure is required'
        } else if (config && (tenure < config.minTenure || tenure > config.maxTenure)) {
            newErrors.tenure_months = `Tenure must be between ${config.minTenure} and ${config.maxTenure} months`
        }

        if (!formData.purpose || formData.purpose.trim() === '') {
            newErrors.purpose = 'Purpose is required'
        }

        setErrors(newErrors)

        // Log validation errors for debugging
        if (Object.keys(newErrors).length > 0) {
            console.log('Validation errors:', newErrors)
            console.log('Form data:', formData)
        }

        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Please fix the errors in the form')
            return
        }

        try {
            setLoading(true)
            const payload = {
                farmer_id: parseInt(formData.farmer_id),
                branch_id: parseInt(formData.branch_id),
                loan_type: formData.loan_type,
                principal_amount: parseFloat(formData.amount),
                interest_rate: parseFloat(formData.interest_rate),
                tenure_months: parseInt(formData.tenure_months),
                purpose: formData.purpose,
                sanction_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
                collateral_details: formData.collateral_type && formData.collateral_value
                    ? `${formData.collateral_type} - ₹${formData.collateral_value}`
                    : null
            }

            console.log('Submitting loan data:', payload)
            const response = await api.post('/loans/', payload)

            toast.success('Loan application submitted successfully!')
            navigate(`/loans/${response.data.id}`)
        } catch (error) {
            console.error('Error:', error)
            console.error('Error response:', error.response?.data)

            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to create loan application'

            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map(err => {
                    if (typeof err === 'string') return err
                    if (err.msg) return typeof err.msg === 'string' ? err.msg : String(err.msg)
                    return String(err)
                }).join(', ')
            } else if (errorDetail && typeof errorDetail === 'object') {
                errorMessage = String(errorDetail)
            }

            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const config = formData.loan_type ? loanTypeConfig[formData.loan_type] : null

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/loans')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">New Loan Application</h1>
                    <p className="text-gray-600 mt-1">Fill in the details to create a loan application</p>
                </div>
            </div>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Please fix the following errors:
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(errors).map(([field, message]) => (
                                        <li key={field}>
                                            <span className="font-medium capitalize">{field.replace('_', ' ')}:</span> {message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {config && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Selected Loan Type: {config.displayName}</p>
                        <p className="mt-1">
                            Max Amount: ₹{config.maxAmount.toLocaleString()} •
                            Tenure: {config.minTenure}-{config.maxTenure} months •
                            Interest Rate: {config.suggestedRate}%
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Farmer Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Farmer <span className="text-red-500">*</span>
                            </label>
                            {currentUser?.role === 'farmer' ? (
                                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                    <div className="font-medium text-gray-900">
                                        {currentUser.farmer_id} - {currentUser.full_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {currentUser.email} • {currentUser.mobile}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <select
                                        name="farmer_id"
                                        value={formData.farmer_id}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.farmer_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select Farmer</option>
                                        {farmers.map(farmer => (
                                            <option key={farmer.id} value={farmer.id}>
                                                {farmer.farmer_id} - {farmer.full_name} ({farmer.mobile})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.farmer_id && (
                                        <p className="text-red-500 text-sm mt-1">{errors.farmer_id}</p>
                                    )}
                                </>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Branch <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="branch_id"
                                value={formData.branch_id}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.branch_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Select Branch</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} ({branch.code})
                                    </option>
                                ))}
                            </select>
                            {errors.branch_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.branch_id}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Loan Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loan Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="loan_type"
                                value={formData.loan_type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select loan type</option>
                                <option value="sao">SAO (Short-term)</option>
                                <option value="long_term_emi">Long Term EMI</option>
                                <option value="rythu_bandhu">Rythu Bandhu</option>
                                <option value="rythu_nethany">Rythu Nathany</option>
                                <option value="amul_loan">Amul Loans</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loan Amount (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter amount"
                                min="0"
                                max={config?.maxAmount}
                            />
                            {errors.amount && (
                                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Interest Rate (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="interest_rate"
                                value={formData.interest_rate}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.interest_rate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter interest rate"
                                step="0.1"
                                min="0"
                            />
                            {errors.interest_rate && (
                                <p className="text-red-500 text-sm mt-1">{errors.interest_rate}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tenure (months) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="tenure_months"
                                value={formData.tenure_months}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.tenure_months ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter tenure in months"
                                min={config?.minTenure}
                                max={config?.maxTenure}
                            />
                            {errors.tenure_months && (
                                <p className="text-red-500 text-sm mt-1">{errors.tenure_months}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purpose <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleInputChange}
                                rows="3"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.purpose ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Describe the purpose of the loan"
                            />
                            {errors.purpose && (
                                <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Collateral Information (Optional)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Collateral Type
                            </label>
                            <input
                                type="text"
                                name="collateral_type"
                                value={formData.collateral_type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Land, Gold, etc."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Collateral Value (₹)
                            </label>
                            <input
                                type="number"
                                name="collateral_value"
                                value={formData.collateral_value}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter collateral value"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/loans')}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </form>
        </div>
    )
}
