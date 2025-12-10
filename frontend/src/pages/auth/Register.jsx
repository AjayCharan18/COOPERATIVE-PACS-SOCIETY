import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export default function Register() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState([])
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        mobile: '',
        branch_id: '',
        role: 'farmer'
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        fetchBranches()
    }, [])

    const fetchBranches = async () => {
        try {
            // Try to fetch from API without auth header
            const response = await fetch('/api/v1/branches/')
            if (response.ok) {
                const data = await response.json()
                setBranches(data)
            } else {
                // Use default branches if API fails
                setBranches([
                    { id: 1, name: 'Main Branch', code: 'MB001' },
                    { id: 2, name: 'Hyderabad', code: 'HYD001' },
                    { id: 3, name: 'Warangal', code: 'WGL001' },
                    { id: 4, name: 'Karimnagar', code: 'KMR001' }
                ])
            }
        } catch (error) {
            console.error('Error loading branches:', error)
            // Use default branches on error
            setBranches([
                { id: 1, name: 'Main Branch', code: 'MB001' },
                { id: 2, name: 'Hyderabad', code: 'HYD001' },
                { id: 3, name: 'Warangal', code: 'WGL001' },
                { id: 4, name: 'Karimnagar', code: 'KMR001' }
            ])
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter'
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.full_name) {
            newErrors.full_name = 'Full name is required'
        }

        if (!formData.mobile) {
            newErrors.mobile = 'Mobile number is required'
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = 'Mobile number must be 10 digits'
        }

        if (!formData.branch_id) {
            newErrors.branch_id = 'Branch selection is required'
        }

        setErrors(newErrors)
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
            const { confirmPassword, ...registerData } = formData

            await api.post('/auth/register', {
                ...registerData,
                branch_id: parseInt(registerData.branch_id)
            })

            toast.success('Registration successful! Please login.')
            navigate('/login')
        } catch (error) {
            console.error('Error:', error)
            // Handle error message properly - it might be a string or an array of validation errors
            let errorMessage = 'Registration failed'

            if (error.response?.data?.detail) {
                const detail = error.response.data.detail
                if (typeof detail === 'string') {
                    errorMessage = detail
                } else if (Array.isArray(detail)) {
                    // FastAPI validation errors are arrays
                    errorMessage = detail.map(err => err.msg).join(', ')
                } else if (typeof detail === 'object') {
                    // If it's an object, convert to string
                    errorMessage = JSON.stringify(detail)
                }
            }

            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-700 py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-600 mt-2">Register for COOPERATIVE PACS Loan System</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.full_name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter your full name"
                        />
                        {errors.full_name && (
                            <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="your.email@example.com"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.mobile ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="10-digit mobile number"
                            maxLength="10"
                        />
                        {errors.mobile && (
                            <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
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
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.branch_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select your branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name} - {branch.code}
                                </option>
                            ))}
                        </select>
                        {errors.branch_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.branch_id}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Min 8 chars, 1 uppercase"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Re-enter password"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                            Sign in here
                        </Link>
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        🌾 COOPERATIVE PACS Loan Management System
                        <br />
                        Supporting farmers with intelligent loan processing
                    </p>
                </div>
            </div>
        </div>
    )
}
