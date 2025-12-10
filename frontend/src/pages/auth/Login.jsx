import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

export default function Login() {
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
            toast.success('Login successful!')
            navigate('/dashboard')
        } else {
            toast.error(result.error || 'Login failed')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">COOPERATIVE PACS Loan System</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email or Mobile
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter email or mobile number"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            className="input"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary py-3 text-lg"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                            Register here
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
