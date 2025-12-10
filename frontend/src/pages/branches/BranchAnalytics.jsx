import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    BuildingOfficeIcon,
    ChartBarIcon,
    TrophyIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function BranchAnalytics() {
    const [branchStats, setBranchStats] = useState(null)
    const [comparison, setComparison] = useState([])
    const [topBranches, setTopBranches] = useState([])
    const [selectedBranch, setSelectedBranch] = useState(null)
    const [monthlyTrend, setMonthlyTrend] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [comparisonRes, topRes] = await Promise.all([
                api.get('/branches/comparison'),
                api.get('/branches/top-performing?limit=5')
            ])
            setComparison(comparisonRes.data)
            setTopBranches(topRes.data)
            if (comparisonRes.data.length > 0) {
                setSelectedBranch(comparisonRes.data[0].branch_id)
                loadBranchTrend(comparisonRes.data[0].branch_id)
            }
        } catch (error) {
            toast.error('Failed to load branch data')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const loadBranchTrend = async (branchId) => {
        try {
            const response = await api.get(`/branches/trend/${branchId}?months=6`)
            setMonthlyTrend(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleBranchChange = (branchId) => {
        setSelectedBranch(branchId)
        loadBranchTrend(branchId)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Branch Analytics</h1>

            {/* Top Performing Branches */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrophyIcon className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Top Performing Branches</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {topBranches.map((branch, index) => (
                        <div key={branch.branch_id} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
                                <BuildingOfficeIcon className="h-6 w-6 text-indigo-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{branch.branch_name}</h3>
                            <p className="text-xs text-gray-600 mb-2">{branch.branch_code}</p>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Disbursed:</span>
                                    <span className="font-semibold">₹{(branch.total_disbursed / 100000).toFixed(2)}L</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Loans:</span>
                                    <span className="font-semibold">{branch.total_loans}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Branch Comparison */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Comparison</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Loans</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection Rate</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {comparison.map((branch) => (
                                <tr key={branch.branch_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{branch.branch_name}</div>
                                            <div className="text-sm text-gray-500">{branch.branch_code}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {branch.statistics.total_loans}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                        {branch.statistics.active_loans}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{branch.statistics.total_disbursed.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                                        ₹{branch.statistics.total_outstanding.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full"
                                                    style={{ width: `${Math.min(branch.statistics.collection_rate, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium">{branch.statistics.collection_rate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Monthly Disbursement Trend</h2>
                    <select
                        value={selectedBranch || ''}
                        onChange={(e) => handleBranchChange(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        {comparison.map(branch => (
                            <option key={branch.branch_id} value={branch.branch_id}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="loan_count" stroke="#8b5cf6" name="Loan Count" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="total_amount" stroke="#10b981" name="Amount (₹)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
