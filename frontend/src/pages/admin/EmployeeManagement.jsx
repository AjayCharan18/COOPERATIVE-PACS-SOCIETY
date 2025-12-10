import { useState, useEffect } from 'react';
import {
    UsersIcon,
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showPerformanceModal, setShowPerformanceModal] = useState(false);
    const [performanceData, setPerformanceData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [employeesRes, branchesRes] = await Promise.all([
                api.get('/auth/users/employees'),
                api.get('/branches')
            ]);
            setEmployees(employeesRes.data);
            setBranches(branchesRes.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (employeeId) => {
        try {
            const response = await api.put(`/auth/users/employees/${employeeId}/toggle-status`);

            // Update local state
            setEmployees(employees.map(emp =>
                emp.id === employeeId
                    ? { ...emp, is_active: response.data.is_active }
                    : emp
            ));

            // Show success message
            alert(response.data.message);
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to toggle employee status');
        }
    };

    const handleAssignBranch = async (employeeId, branchId) => {
        try {
            const response = await api.put(
                `/auth/users/employees/${employeeId}/assign-branch?branch_id=${branchId}`
            );

            // Update local state
            setEmployees(employees.map(emp =>
                emp.id === employeeId
                    ? { ...emp, branch_id: response.data.new_branch_id }
                    : emp
            ));

            alert(response.data.message);
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to assign branch');
        }
    };

    const handleViewPerformance = async (employee) => {
        try {
            setSelectedEmployee(employee);
            const response = await api.get(`/auth/users/employees/${employee.id}/performance`);
            setPerformanceData(response.data);
            setShowPerformanceModal(true);
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to fetch performance data');
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = selectedBranch === 'all' || emp.branch_id === parseInt(selectedBranch);
        return matchesSearch && matchesBranch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button onClick={fetchData} className="mt-2 text-sm text-red-600 hover:text-red-500">
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage employees, assign branches, and view performance
                    </p>
                </div>
                <div className="text-sm text-gray-600">
                    Total: {employees.length} | Active: {employees.filter(e => e.is_active).length}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Branch
                        </label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Employee List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Branch
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Login
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEmployees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <UsersIcon className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                                            <div className="text-sm text-gray-500">{employee.email}</div>
                                            <div className="text-sm text-gray-500">{employee.mobile}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={employee.branch_id || ''}
                                        onChange={(e) => handleAssignBranch(employee.id, e.target.value)}
                                        className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {employee.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <XCircleIcon className="h-4 w-4 mr-1" />
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {employee.last_login
                                        ? new Date(employee.last_login).toLocaleDateString('en-IN')
                                        : 'Never'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleToggleStatus(employee.id)}
                                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${employee.is_active
                                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                                            }`}
                                    >
                                        {employee.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => handleViewPerformance(employee)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                        <ChartBarIcon className="h-4 w-4 mr-1" />
                                        Performance
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredEmployees.length === 0 && (
                    <div className="text-center py-12">
                        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || selectedBranch !== 'all'
                                ? 'Try adjusting your filters'
                                : 'No employees available'}
                        </p>
                    </div>
                )}
            </div>

            {/* Performance Modal */}
            {showPerformanceModal && performanceData && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Employee Performance - {selectedEmployee?.full_name}
                                </h3>
                                <button
                                    onClick={() => setShowPerformanceModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Performance Metrics */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-4">Performance Metrics</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <MetricCard
                                        label="Loans Processed"
                                        value={performanceData.performance.loans_processed}
                                        color="blue"
                                    />
                                    <MetricCard
                                        label="Loans Approved"
                                        value={performanceData.performance.loans_approved}
                                        color="green"
                                    />
                                    <MetricCard
                                        label="Active Loans"
                                        value={performanceData.performance.active_loans}
                                        color="indigo"
                                    />
                                    <MetricCard
                                        label="Total Disbursed"
                                        value={`₹${(performanceData.performance.total_disbursed / 100000).toFixed(2)}L`}
                                        color="purple"
                                    />
                                    <MetricCard
                                        label="Payments Received"
                                        value={performanceData.performance.payments_received}
                                        color="yellow"
                                    />
                                    <MetricCard
                                        label="Total Collected"
                                        value={`₹${(performanceData.performance.total_collected / 100000).toFixed(2)}L`}
                                        color="green"
                                    />
                                </div>
                            </div>

                            {/* Account Info */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-4">Account Information</h4>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <span className={`text-sm font-medium ${performanceData.account_info.is_active ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {performanceData.account_info.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Last Login:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {performanceData.account_info.last_login
                                                ? new Date(performanceData.account_info.last_login).toLocaleString('en-IN')
                                                : 'Never'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Created:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Date(performanceData.account_info.created_at).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowPerformanceModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-900 border-blue-200',
        green: 'bg-green-50 text-green-900 border-green-200',
        indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        purple: 'bg-purple-50 text-purple-900 border-purple-200',
        yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    };

    return (
        <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
            <div className="text-xs font-medium opacity-75">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
    );
}
