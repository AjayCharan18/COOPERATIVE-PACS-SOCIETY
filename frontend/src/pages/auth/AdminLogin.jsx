import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import { UserIcon, LockClosedIcon, ArrowRightIcon, ShieldCheckIcon, CogIcon } from '@heroicons/react/24/outline'

export default function AdminLogin() {
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
            if (result.user?.role === 'admin') {
                toast.success('Welcome back, Administrator!')
                navigate('/dashboard')
            } else {
                toast.error('This login is for administrators only. Please use the appropriate login page.')
                // Logout if not an admin
                useAuthStore.getState().logout()
            }
        } else {
            toast.error(result.error || 'Login failed')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Side - Branding */}
                <div className="bg-gradient-to-br from-purple-600 to-pink-700 p-12 text-white flex flex-col justify-center">
                    <div className="mb-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center mb-6">
                            <ShieldCheckIcon className="h-12 w-12" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Admin Portal</h1>
                        <p className="text-purple-100 text-lg">
                            Full system access - Manage employees, farmers, and system configuration
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
                                <h3 className="font-semibold text-lg">System Overview</h3>
                                <p className="text-purple-100 text-sm">Monitor system-wide statistics and performance</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Employee Management</h3>
                                <p className="text-purple-100 text-sm">Manage all employees and branch assignments</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">All Farmers Access</h3>
                                <p className="text-purple-100 text-sm">Access all farmer data across all branches</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-1">
                                <CogIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">System Configuration</h3>
                                <p className="text-purple-100 text-sm">Configure loan types, interest rates, and system settings</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm text-purple-100">
                            <strong>⚠️ Restricted Access:</strong> This portal is for system administrators only. All actions are logged and monitored.
                        </p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Administrator Login</h2>
                        <p className="text-gray-600">Access admin dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Admin Email or ID
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter admin email or ID"
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
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>

                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-purple-600 hover:text-purple-700"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRightIcon className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">Login as different role?</p>
                            <div className="flex gap-3 justify-center">
                                <Link
                                    to="/login/farmer"
                                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                    Farmer Login
                                </Link>
                                <span className="text-gray-400">•</span>
                                <Link
                                    to="/login/employee"
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Employee Login
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            🔒 Secure admin access powered by COOPERATIVE PACS
                            <br />
                            All administrator actions are logged for security
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
