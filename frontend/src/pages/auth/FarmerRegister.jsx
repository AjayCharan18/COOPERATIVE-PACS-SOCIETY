import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { UserIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline'

export default function FarmerRegister() {
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
            const response = await fetch('/api/v1/branches/')
            if (!response.ok) {
                const data = await response.json()
                setBranches(data)
            } else {
                setBranches([
                    { id: 1, name: 'Main Branch', code: 'MB001' },
                    { id: 2, name: 'Hyderabad', code: 'HYD001' },
                    { id: 3, name: 'Warangal', code: 'WGL001' },
                    { id: 4, name: 'Karimnagar', code: 'KMR001' }
                ])
            }
        } catch (error) {
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

        if (!formData.full_name) {
            newErrors.full_name = 'Full name is required'
        }

        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid'
        }

        if (!formData.mobile) {
            newErrors.mobile = 'Mobile number is required'
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = 'Mobile number must be 10 digits'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.branch_id) {
            newErrors.branch_id = 'Please select your nearest branch'
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
            navigate('/login/farmer')
        } catch (error) {
            let errorMessage = 'Registration failed'
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail
                errorMessage = typeof detail === 'string' ? detail :
                    Array.isArray(detail) ? detail.map(err => err.msg).join(', ') :
                        JSON.stringify(detail)
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                <div className="text-center mb-8">
                    <div className="inline-block bg-gradient-to-r from-green-600 to-teal-600 rounded-full p-4 mb-4">
                        <span className="text-4xl">🌾</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Farmer Registration</h1>
                    <p className="text-gray-600 mt-2">Join COOPERATIVE PACS and get access to agricultural loans</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="full_name"
                                    className={`w-full pl-10 pr-4 py-2.5 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                    placeholder="Enter your full name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                        </div>

                        {/* Mobile */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mobile Number *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="mobile"
                                    className={`w-full pl-10 pr-4 py-2.5 border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                    placeholder="10 digit mobile number"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                className={`w-full pl-10 pr-4 py-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Branch */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nearest Branch *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BuildingLibraryIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                name="branch_id"
                                className={`w-full pl-10 pr-4 py-2.5 border ${errors.branch_id ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                value={formData.branch_id}
                                onChange={handleInputChange}
                            >
                                <option value="">Select your branch</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} ({branch.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    className={`w-full pl-10 pr-4 py-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                    placeholder="Minimum 8 characters"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className={`w-full pl-10 pr-4 py-2.5 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Register as Farmer'}
                    </button>
                </form>

                <div className="mt-6 space-y-3">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login/farmer" className="text-green-600 hover:text-green-700 font-semibold">
                                Login here
                            </Link>
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link to="/register/employee" className="text-sm text-gray-600 hover:text-gray-900">
                            Register as <span className="text-blue-600 font-semibold">Employee</span>
                        </Link>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        By registering, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    )
}
