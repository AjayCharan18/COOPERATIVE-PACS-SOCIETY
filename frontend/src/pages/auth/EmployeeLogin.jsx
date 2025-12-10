import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import { UserIcon, LockClosedIcon, ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function EmployeeLogin() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const result = await login(formData.username, formData.password)

        if (result.success) {
            if (result.user?.role === 'employee') {
                toast.success('Welcome back, Team Member!')
                navigate('/dashboard')
            } else if (result.user?.role === 'admin') {
                toast.error('Please use the Admin Login page.')
                // Logout if admin trying to login as employee
                useAuthStore.getState().logout()
            } else {
                toast.error('This login is for employees only. Please use the farmer login.')
                // Logout if not an employee
                useAuthStore.getState().logout()
            }
        } else {
            toast.error(result.error || 'Login failed')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Side - Branding */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-center">
                    <div className="mb-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center mb-6">
                            <ShieldCheckIcon className="h-12 w-12" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Employee Portal</h1>
                        <p className="text-blue-100 text-lg">
                            Manage loans, approve applications, and serve farmers efficiently
                        </p>
                    </div>

                    <div className="space-y-4 mt-8">
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Loan Management</h3>
                                <p className="text-blue-100 text-sm">Review and approve farmer loan applications</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Farmer Database</h3>
                                <p className="text-blue-100 text-sm">Access and update farmer information</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Reports & Analytics</h3>
                                <p className="text-blue-100 text-sm">Generate comprehensive branch reports</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm text-blue-100">
                            <strong>Note:</strong> This portal is for authorized COOPERATIVE PACS employees only. Unauthorized access is prohibited.
                        </p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Employee Login</h2>
                        <p className="text-gray-600">Access your employee dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Employee ID or Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter employee ID or email"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="text-right mt-2">
                                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                'Signing in...'
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRightIcon className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Login as different role?</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center items-center">
                            <Link to="/login/farmer" className="text-sm text-gray-600 hover:text-gray-900">
                                Farmer? <span className="text-green-600 font-semibold">Login here</span>
                            </Link>
                            <span className="text-gray-400">•</span>
                            <Link to="/login/admin" className="text-sm text-gray-600 hover:text-gray-900">
                                Administrator? <span className="text-purple-600 font-semibold">Login here</span>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            💼 COOPERATIVE PACS Loan Management System - Employee Portal
                            <br />
                            Secure access for authorized personnel only
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
