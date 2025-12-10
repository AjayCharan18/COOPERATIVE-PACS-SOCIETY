import { useState, useEffect } from 'react';
import {
    CogIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    PencilSquareIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

export default function SystemConfiguration() {
    const [loanTypes, setLoanTypes] = useState([]);
    const [interestSummary, setInterestSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingType, setEditingType] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [bulkAdjustment, setBulkAdjustment] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [typesRes, summaryRes] = await Promise.all([
                api.get('/admin/config/loan-types'),
                api.get('/admin/config/interest-rates/summary')
            ]);
            setLoanTypes(typesRes.data);
            setInterestSummary(summaryRes.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (loanType) => {
        setEditingType(loanType.loan_type);
        setEditForm({
            display_name: loanType.display_name,
            description: loanType.description,
            default_interest_rate: loanType.default_interest_rate,
            default_tenure_months: loanType.default_tenure_months,
            min_amount: loanType.min_amount,
            max_amount: loanType.max_amount,
            penal_interest_rate: loanType.penal_interest_rate,
            overdue_days_for_penalty: loanType.overdue_days_for_penalty,
            requires_emi: loanType.requires_emi,
            min_land_area: loanType.min_land_area
        });
    };

    const handleSave = async () => {
        try {
            await api.put(`/admin/config/loan-types/${editingType}`, editForm);
            alert('Configuration updated successfully!');
            setEditingType(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to update configuration');
        }
    };

    const handleToggleStatus = async (loanType) => {
        try {
            const response = await api.post(`/admin/config/loan-types/${loanType}/toggle-status`);
            alert(response.data.message);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to toggle status');
        }
    };

    const handleBulkUpdate = async () => {
        if (!bulkAdjustment) {
            alert('Please enter adjustment percentage');
            return;
        }

        const percentage = parseFloat(bulkAdjustment);
        if (isNaN(percentage) || percentage < -50 || percentage > 50) {
            alert('Please enter a valid percentage between -50 and 50');
            return;
        }

        if (!confirm(`Are you sure you want to adjust all interest rates by ${percentage}%?`)) {
            return;
        }

        try {
            const response = await api.post(
                `/admin/config/interest-rates/bulk-update?rate_adjustment_percentage=${percentage}`
            );
            alert(response.data.message);
            setBulkAdjustment('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to bulk update rates');
        }
    };

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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage loan types, interest rates, and system settings
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Interest Rate Summary */}
            {interestSummary && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Interest Rate Overview</h2>
                        <ChartBarIcon className="h-6 w-6" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {interestSummary.loan_types.slice(0, 3).map((type) => (
                            <div key={type.loan_type} className="bg-white bg-opacity-20 rounded-lg p-4">
                                <div className="text-sm opacity-90">{type.display_name}</div>
                                <div className="text-2xl font-bold mt-1">{type.default_interest_rate}%</div>
                                <div className="text-xs mt-1 opacity-75">
                                    + {type.penal_interest_rate}% penalty
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bulk Interest Rate Adjustment */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bulk Interest Rate Adjustment
                </h3>
                <div className="flex items-end space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adjustment Percentage
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="-50"
                            max="50"
                            value={bulkAdjustment}
                            onChange={(e) => setBulkAdjustment(e.target.value)}
                            placeholder="e.g., 5 for +5% or -3 for -3%"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Enter positive value to increase or negative to decrease (range: -50% to +50%)
                        </p>
                    </div>
                    <button
                        onClick={handleBulkUpdate}
                        className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                        Apply to All Loan Types
                    </button>
                </div>
            </div>

            {/* Loan Type Configurations */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Loan Type Configurations</h2>

                {loanTypes.map((loanType) => (
                    <div
                        key={loanType.id}
                        className={`bg-white shadow rounded-lg overflow-hidden ${!loanType.is_active ? 'opacity-60' : ''
                            }`}
                    >
                        {editingType === loanType.loan_type ? (
                            // Edit Mode
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Edit {loanType.display_name}
                                    </h3>
                                    <div className="space-x-2">
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setEditingType(null)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.display_name}
                                            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Default Interest Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editForm.default_interest_rate}
                                            onChange={(e) => setEditForm({ ...editForm, default_interest_rate: parseFloat(e.target.value) })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Default Tenure (Months)
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.default_tenure_months}
                                            onChange={(e) => setEditForm({ ...editForm, default_tenure_months: parseInt(e.target.value) })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Penal Interest Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editForm.penal_interest_rate}
                                            onChange={(e) => setEditForm({ ...editForm, penal_interest_rate: parseFloat(e.target.value) })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.min_amount}
                                            onChange={(e) => setEditForm({ ...editForm, min_amount: parseFloat(e.target.value) })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.max_amount}
                                            onChange={(e) => setEditForm({ ...editForm, max_amount: parseFloat(e.target.value) })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Overdue Days for Penalty
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.overdue_days_for_penalty}
                                            onChange={(e) => setEditForm({ ...editForm, overdue_days_for_penalty: parseInt(e.target.value) })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Land Area (acres)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editForm.min_land_area || ''}
                                            onChange={(e) => setEditForm({ ...editForm, min_land_area: e.target.value ? parseFloat(e.target.value) : null })}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows="2"
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={editForm.requires_emi}
                                            onChange={(e) => setEditForm({ ...editForm, requires_emi: e.target.checked })}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-900">
                                            Requires EMI
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {loanType.display_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{loanType.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {loanType.is_active ? (
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
                                        <button
                                            onClick={() => handleEdit(loanType)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                        >
                                            <PencilSquareIcon className="h-4 w-4 mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(loanType.loan_type)}
                                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${loanType.is_active
                                                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                                                }`}
                                        >
                                            {loanType.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <ConfigItem label="Interest Rate" value={`${loanType.default_interest_rate}%`} />
                                    <ConfigItem label="Penalty Rate" value={`${loanType.penal_interest_rate}%`} />
                                    <ConfigItem label="Tenure" value={`${loanType.default_tenure_months} months`} />
                                    <ConfigItem label="Penalty After" value={`${loanType.overdue_days_for_penalty} days`} />
                                    <ConfigItem label="Min Amount" value={`₹${loanType.min_amount.toLocaleString('en-IN')}`} />
                                    <ConfigItem label="Max Amount" value={loanType.max_amount ? `₹${loanType.max_amount.toLocaleString('en-IN')}` : 'No limit'} />
                                    <ConfigItem label="Min Land Area" value={loanType.min_land_area ? `${loanType.min_land_area} acres` : 'Not required'} />
                                    <ConfigItem label="EMI Required" value={loanType.requires_emi ? 'Yes' : 'No'} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ConfigItem({ label, value }) {
    return (
        <div>
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{value}</div>
        </div>
    );
}
