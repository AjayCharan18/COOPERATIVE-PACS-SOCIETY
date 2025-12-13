import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { EnvelopeIcon, DevicePhoneMobileIcon, KeyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ForgotPassword() {
    const [step, setStep] = useState(1) // 1: Request OTP, 2: Verify OTP, 3: Reset Password
    const [method, setMethod] = useState('email') // 'email' or 'sms'
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        identifier: '', // email or mobile
        otp: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handleRequestOTP = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await api.post('/auth/forgot-password', {
                identifier: formData.identifier,
                method: method
            })

            const { success, message } = response.data || {}
            if (success) {
                toast.success(message || `OTP sent to your ${method === 'email' ? 'email' : 'mobile number'}`)
                setStep(2)
            } else {
                toast.error(message || 'Failed to send OTP')
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOTP = async (e) => {
        e.preventDefault()

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (formData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setLoading(true)

        try {
            await api.post('/auth/verify-otp-reset-password', {
                identifier: formData.identifier,
                otp: formData.otp,
                new_password: formData.newPassword
            })

            toast.success('Password reset successful! Please login with your new password.')
            setStep(3)
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid OTP or request expired')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOTP = async () => {
        setLoading(true)
        try {
            const response = await api.post('/auth/resend-otp', {
                identifier: formData.identifier,
                method: method
            })

            const { success, message } = response.data || {}
            if (success) {
                toast.success(message || 'OTP resent successfully')
            } else {
                toast.error(message || 'Failed to resend OTP')
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to resend OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <KeyIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                    <p className="text-gray-600 mt-2">
                        {step === 1 && 'Enter your email or mobile number'}
                        {step === 2 && 'Enter OTP and new password'}
                        {step === 3 && 'Password reset successful!'}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleRequestOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recovery Method
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMethod('email')}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${method === 'email'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <EnvelopeIcon className="h-5 w-5" />
                                    Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMethod('sms')}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${method === 'sms'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <DevicePhoneMobileIcon className="h-5 w-5" />
                                    SMS
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {method === 'email' ? 'Email Address' : 'Mobile Number'}
                            </label>
                            <input
                                type="text"
                                value={formData.identifier}
                                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                                placeholder={method === 'email' ? 'your@email.com' : '10-digit mobile'}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-green-800">
                                ✓ OTP sent to your {method === 'email' ? 'email' : 'mobile'}. Check and enter below.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                placeholder="6-digit OTP"
                                maxLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                placeholder="Minimum 8 characters"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Re-enter password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={loading}
                            className="w-full text-indigo-600 font-medium py-2 hover:text-indigo-700 disabled:opacity-50"
                        >
                            Didn't receive OTP? Resend
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="text-center space-y-6">
                        <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
                            <p className="text-gray-600">Your password has been reset successfully.</p>
                        </div>
                        <div className="space-y-3">
                            <Link
                                to="/login/farmer"
                                className="block w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-all"
                            >
                                Login as Farmer
                            </Link>
                            <Link
                                to="/login/employee"
                                className="block w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all"
                            >
                                Login as Employee
                            </Link>
                        </div>
                    </div>
                )}

                {step !== 3 && (
                    <div className="mt-6 text-center">
                        <Link
                            to="/login/farmer"
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
