import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import {
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    BuildingOffice2Icon,
    LockClosedIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function Profile() {
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [profileData, setProfileData] = useState(null)
    const [activeTab, setActiveTab] = useState('info')
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me')
            setProfileData(response.data)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load profile')
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        try {
            setLoading(true)
            await api.post('/users/change-password', {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword
            })
            toast.success('Password changed successfully')
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (error) {
            console.error('Error:', error)
            toast.error(error.response?.data?.detail || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    if (!profileData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white rounded-full p-3">
                        <UserCircleIcon className="h-16 w-16 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{profileData.full_name || profileData.email}</h1>
                        <p className="text-indigo-100 mt-1">
                            {profileData.role?.toUpperCase()} • {profileData.email}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'info'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Profile Information
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'security'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Security
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-indigo-100 rounded-lg p-2">
                                        <UserCircleIcon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">
                                            {profileData.full_name || 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-indigo-100 rounded-lg p-2">
                                        <EnvelopeIcon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">
                                            {profileData.email}
                                        </p>
                                        {profileData.is_active && (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                                                <CheckCircleIcon className="h-4 w-4" />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-indigo-100 rounded-lg p-2">
                                        <PhoneIcon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Mobile Number</p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">
                                            {profileData.mobile || 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-indigo-100 rounded-lg p-2">
                                        <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Branch</p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">
                                            {profileData.branch_name || 'Not assigned'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Account Status</p>
                                        <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${profileData.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {profileData.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <span className="inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                                            {profileData.role?.toUpperCase()}
                                        </span>
                                    </div>
                                    {profileData.created_at && (
                                        <div>
                                            <p className="text-sm text-gray-500">Member Since</p>
                                            <p className="mt-1 text-sm font-medium text-gray-900">
                                                {new Date(profileData.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-md">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
                                <p className="text-sm text-gray-600">
                                    Ensure your account is using a long, random password to stay secure.
                                </p>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
