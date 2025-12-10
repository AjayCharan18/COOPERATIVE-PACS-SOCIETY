import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    UserGroupIcon,
    BriefcaseIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function UserManagement() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('farmers') // 'farmers' or 'employees'
    const [users, setUsers] = useState([])
    const [branches, setBranches] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Redirect if not admin
    useEffect(() => {
        if (user?.role !== 'admin') {
            toast.error('Access denied. Admin only.')
            navigate('/dashboard')
        }
    }, [user, navigate])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showCredentialsModal, setShowCredentialsModal] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState(null)
    const [formData, setFormData] = useState({
        email: '',
        mobile: '',
        password: '',
        full_name: '',
        branch_id: '',
        role: 'farmer',
        // Farmer specific
        land_area: '',
        crop_type: '',
        aadhaar_number: '',
        pan_number: '',
        address: '',
        village: '',
        mandal: '',
        district: '',
        state: 'Telangana',
        pincode: ''
    })

    useEffect(() => {
        fetchBranches()
        fetchUsers()
    }, [activeTab])

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches/')
            setBranches(response.data)
        } catch (error) {
            console.error('Error fetching branches:', error)
        }
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const role = activeTab === 'farmers' ? 'farmer' : 'employee'
            const response = await api.get(`/auth/users/?role=${role}`)
            setUsers(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error(`Failed to load ${activeTab}`)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)

            const payload = {
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password,
                full_name: formData.full_name,
                branch_id: parseInt(formData.branch_id),
                role: activeTab === 'farmers' ? 'farmer' : 'employee',
                state: formData.state || 'Telangana'
            }

            // Add farmer-specific fields
            if (activeTab === 'farmers') {
                payload.land_area = formData.land_area || null
                payload.crop_type = formData.crop_type || null
                payload.aadhaar_number = formData.aadhaar_number || null
                payload.pan_number = formData.pan_number || null
                payload.address = formData.address || null
                payload.village = formData.village || null
                payload.mandal = formData.mandal || null
                payload.district = formData.district || null
                payload.pincode = formData.pincode || null
            }

            await api.post('/auth/register', payload)

            // Show credentials modal
            setCreatedCredentials({
                name: formData.full_name,
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password,
                role: activeTab === 'farmers' ? 'Farmer' : 'Employee'
            })
            setShowCredentialsModal(true)

            toast.success(`${activeTab === 'farmers' ? 'Farmer' : 'Employee'} created successfully. Credentials have been sent via email.`)
            setShowCreateModal(false)
            resetForm()
            fetchUsers()
        } catch (error) {
            console.error('Error creating user:', error)
            toast.error(error.response?.data?.detail || 'Failed to create user')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        if (!confirm(`Are you sure you want to delete ${userName}?`)) return

        try {
            await api.delete(`/auth/users/${userId}`)
            toast.success('User deleted successfully')
            fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            toast.error('Failed to delete user')
        }
    }

    const resetForm = () => {
        setFormData({
            email: '',
            mobile: '',
            password: '',
            full_name: '',
            branch_id: '',
            role: activeTab === 'farmers' ? 'farmer' : 'employee',
            land_area: '',
            crop_type: '',
            aadhaar_number: '',
            pan_number: '',
            address: '',
            village: '',
            mandal: '',
            district: '',
            state: 'Telangana',
            pincode: ''
        })
    }

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm)
    )

    return (
        <div className="space-y-6">
            {/* Admin Badge */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                <div>
                    <h3 className="font-semibold text-purple-900">Admin Access Only</h3>
                    <p className="text-sm text-purple-700">
                        You can create and manage both farmers and employees. Only admins have access to employee creation.
                    </p>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Create and manage farmers and employees</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add {activeTab === 'farmers' ? 'Farmer' : 'Employee'}</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => {
                        setActiveTab('farmers')
                        setSearchTerm('')
                    }}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'farmers'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <UserGroupIcon className="h-5 w-5" />
                    <span>Farmers</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                        {activeTab === 'farmers' ? users.length : ''}
                    </span>
                </button>
                <button
                    onClick={() => {
                        setActiveTab('employees')
                        setSearchTerm('')
                    }}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'employees'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BriefcaseIcon className="h-5 w-5" />
                    <span>Employees</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {activeTab === 'employees' ? users.length : ''}
                    </span>
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No {activeTab} found</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                {activeTab === 'farmers' && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Land Area</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop Type</th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{user.full_name}</div>
                                        <div className="text-sm text-gray-500">ID: {user.farmer_id || user.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                        <div className="text-sm text-gray-500">{user.mobile}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {branches.find(b => b.id === user.branch_id)?.name || 'N/A'}
                                    </td>
                                    {activeTab === 'farmers' && (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.land_area || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.crop_type || 'N/A'}
                                            </td>
                                        </>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.is_active ? (
                                            <span className="flex items-center text-green-600">
                                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-red-600">
                                                <XCircleIcon className="h-4 w-4 mr-1" />
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">
                                Add New {activeTab === 'farmers' ? 'Farmer' : 'Employee'}
                            </h2>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Branch *
                                        </label>
                                        <select
                                            required
                                            value={formData.branch_id}
                                            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mobile *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            minLength="6"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Send Credentials Via
                                        </label>
                                        <select
                                            value={formData.send_credentials_via || 'email'}
                                            onChange={(e) => setFormData({ ...formData, send_credentials_via: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="email">Email Only</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Login credentials will be sent via email
                                        </p>
                                    </div>
                                </div>

                                {/* Farmer-specific fields */}
                                {activeTab === 'farmers' && (
                                    <>
                                        <h3 className="text-lg font-semibold mt-6 mb-3">Farmer Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Land Area (acres)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.land_area}
                                                    onChange={(e) => setFormData({ ...formData, land_area: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Crop Type
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.crop_type}
                                                    onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="e.g., Rice, Cotton"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Aadhaar Number
                                                </label>
                                                <input
                                                    type="text"
                                                    pattern="[0-9]{12}"
                                                    value={formData.aadhaar_number}
                                                    onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="12-digit number"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    PAN Number
                                                </label>
                                                <input
                                                    type="text"
                                                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                                    value={formData.pan_number}
                                                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="ABCDE1234F"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Village
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.village}
                                                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Mandal
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.mandal}
                                                    onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    District
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.district}
                                                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Pincode
                                                </label>
                                                <input
                                                    type="text"
                                                    pattern="[0-9]{6}"
                                                    value={formData.pincode}
                                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="6-digit pincode"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Buttons */}
                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            resetForm()
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                    >
                                        {loading ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Credentials Modal */}
            {showCredentialsModal && createdCredentials && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {createdCredentials.role} Account Created!
                            </h3>
                            <p className="text-sm text-gray-600">
                                Login credentials have been sent to the email address. Please save these details:
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
                                <p className="text-sm font-medium text-gray-900">{createdCredentials.name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                                <p className="text-sm font-medium text-gray-900">{createdCredentials.email}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Mobile</label>
                                <p className="text-sm font-medium text-gray-900">{createdCredentials.mobile}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Password</label>
                                <p className="text-sm font-mono font-bold text-indigo-600">{createdCredentials.password}</p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-yellow-800">
                                ⚠️ The user can login using either email or mobile number with the above password.
                                Credentials have been sent to their email address.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowCredentialsModal(false)
                                setCreatedCredentials(null)
                            }}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
