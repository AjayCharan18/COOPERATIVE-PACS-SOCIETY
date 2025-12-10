import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    CalculatorIcon,
    CalendarIcon,
    CurrencyRupeeIcon,
    ChartBarIcon,
    LightBulbIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

export default function SmartCalculator() {
    const [activeTab, setActiveTab] = useState('interest')
    const [loans, setLoans] = useState([])
    const [selectedLoan, setSelectedLoan] = useState(null)
    const [loading, setLoading] = useState(false)
    const { user } = useAuthStore()
    const navigate = useNavigate()

    // Interest Calculator State
    const [interestCalc, setInterestCalc] = useState({
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0]
    })
    const [interestResult, setInterestResult] = useState(null)

    // Interest Projections State
    const [projections, setProjections] = useState(null)

    // Overdue Calculator State
    const [overdueCalc, setOverdueCalc] = useState({
        overdue_amount: '',
        overdue_days: ''
    })
    const [overdueResult, setOverdueResult] = useState(null)

    // EMI Amortization State
    const [amortizationTable, setAmortizationTable] = useState(null)

    // Loan Ledger State
    const [loanLedger, setLoanLedger] = useState(null)

    // Loan Comparison State
    const [comparison, setComparison] = useState({
        principal_amount: '',
        tenure_months: '',
        loan_types: ['sao', 'long_term_emi', 'rythu_bandhu']
    })
    const [comparisonResult, setComparisonResult] = useState(null)

    // AI Recommendations State
    const [recommendations, setRecommendations] = useState(null)
    const [farmerIncome, setFarmerIncome] = useState('')

    useEffect(() => {
        fetchLoans()
    }, [])

    const fetchLoans = async () => {
        try {
            const response = await api.get('/smart-calculator/loans')
            setLoans(response.data)
        } catch (error) {
            console.error('Error fetching loans:', error)
        }
    }

    // Calculate Pro-Rata Interest
    const calculateProRataInterest = async () => {
        if (!selectedLoan) {
            toast.error('Please select a loan')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/calculate/pro-rata-interest', {
                loan_id: selectedLoan,
                from_date: interestCalc.from_date || null,
                to_date: interestCalc.to_date || null
            })
            setInterestResult(response.data)
            toast.success('Interest calculated successfully')
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to calculate interest'
            toast.error(errorMsg)
            console.error('Error details:', error.response?.data || error)
            console.error('Full error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate Interest Projections
    const calculateProjections = async () => {
        if (!selectedLoan) {
            toast.error('Please select a loan')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/calculate/interest-projections', {
                loan_id: selectedLoan
            })
            setProjections(response.data)
            toast.success('Projections calculated')
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to calculate projections'
            toast.error(errorMsg)
            console.error('Error details:', error.response?.data || error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate Overdue with Penalty
    const calculateOverdue = async () => {
        if (!selectedLoan || !overdueCalc.overdue_amount || !overdueCalc.overdue_days) {
            toast.error('Please fill all fields')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/calculate/overdue-with-penalty', {
                loan_id: selectedLoan,
                overdue_amount: parseFloat(overdueCalc.overdue_amount),
                overdue_days: parseInt(overdueCalc.overdue_days)
            })
            setOverdueResult(response.data)
            toast.success('Overdue calculated')
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to calculate overdue'
            toast.error(errorMsg)
            console.error('Error details:', error.response?.data || error)
        } finally {
            setLoading(false)
        }
    }

    // Generate EMI Amortization Table
    const generateAmortization = async () => {
        if (!selectedLoan) {
            toast.error('Please select a loan')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/generate/emi-amortization', {
                loan_id: selectedLoan
            })
            setAmortizationTable(response.data)
            toast.success('Amortization table generated')
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to generate amortization')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Generate Loan Ledger
    const generateLedger = async () => {
        if (!selectedLoan) {
            toast.error('Please select a loan')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/generate/loan-ledger', {
                loan_id: selectedLoan
            })
            setLoanLedger(response.data)
            toast.success('Ledger generated')
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to generate ledger'
            toast.error(errorMsg)
            console.error('Error details:', error.response?.data || error)
        } finally {
            setLoading(false)
        }
    }

    // Compare Loan Schemes
    const compareLoanSchemes = async () => {
        if (!comparison.principal_amount || !comparison.tenure_months) {
            toast.error('Please enter principal amount and tenure')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/compare/loan-schemes', {
                principal_amount: parseFloat(comparison.principal_amount),
                tenure_months: parseInt(comparison.tenure_months),
                loan_types: comparison.loan_types
            })
            setComparisonResult(response.data)
            toast.success('Comparison complete')
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to compare loans'
            toast.error(errorMsg)
            console.error('Error details:', error.response?.data || error)
        } finally {
            setLoading(false)
        }
    }

    // Get Smart Recommendations
    const getRecommendations = async () => {
        if (!selectedLoan) {
            toast.error('Please select a loan')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/smart-calculator/recommendations/smart', {
                loan_id: selectedLoan,
                farmer_monthly_income: farmerIncome ? parseFloat(farmerIncome) : undefined
            })
            setRecommendations(response.data)
            toast.success('Recommendations generated')
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to get recommendations'
            toast.error(errorMsg)
            console.error('Error details:', error.response?.data || error)
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'interest', name: 'Pro-Rata Interest', icon: CalculatorIcon },
        { id: 'projections', name: 'Interest Projections', icon: CalendarIcon },
        { id: 'overdue', name: 'Overdue Calculator', icon: CurrencyRupeeIcon },
        { id: 'amortization', name: 'EMI Amortization', icon: ChartBarIcon },
        { id: 'ledger', name: 'Loan Ledger', icon: DocumentTextIcon },
        { id: 'comparison', name: 'Compare Schemes', icon: ArrowPathIcon },
        { id: 'recommendations', name: 'Smart Advice', icon: LightBulbIcon }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <CalculatorIcon className="h-8 w-8" />
                    Smart Loan Calculator
                </h1>
                <p className="mt-2 text-indigo-100">
                    Advanced loan calculations with AI-powered recommendations
                </p>
            </div>

            {/* Loan Selector */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Active Loan
                </label>
                <select
                    value={selectedLoan || ''}
                    onChange={(e) => setSelectedLoan(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                    <option value="">-- Choose a loan --</option>
                    {loans.map(loan => (
                        <option key={loan.id} value={loan.id}>
                            {loan.loan_number} - {loan.farmer_name} - {loan.loan_type.toUpperCase()} - ₹{loan.principal_amount?.toLocaleString()} @ {loan.interest_rate}%
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className="h-5 w-5" />
                                {tab.name}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow p-6">
                {/* Pro-Rata Interest Calculator */}
                {activeTab === 'interest' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Pro-Rata Interest Calculator</h2>
                        <p className="text-gray-600">
                            Calculate exact daily interest for any period. Automatically switches rate if loan crosses 1 year.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={interestCalc.from_date}
                                    onChange={(e) => setInterestCalc({ ...interestCalc, from_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={interestCalc.to_date}
                                    onChange={(e) => setInterestCalc({ ...interestCalc, to_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                        </div>

                        <button
                            onClick={calculateProRataInterest}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Calculate Interest'}
                        </button>

                        {interestResult && (
                            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-lg mb-4">Result</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Days</p>
                                        <p className="text-xl font-bold">{interestResult.total_days}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Principal</p>
                                        <p className="text-xl font-bold">₹{interestResult.principal?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Interest Rate</p>
                                        <p className="text-xl font-bold">{interestResult.annual_rate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Interest</p>
                                        <p className="text-xl font-bold text-green-600">₹{interestResult.total_interest?.toLocaleString()}</p>
                                    </div>
                                </div>
                                {interestResult.crosses_one_year && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                        <p className="text-sm font-medium text-yellow-800">
                                            ⚠️ Rate switched during this period
                                        </p>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <pre className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">
                                        {interestResult.explanation}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Interest Projections */}
                {activeTab === 'projections' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Interest Projections</h2>
                        <p className="text-gray-600">
                            See what the farmer owes today, tomorrow, after 10 days, and next month.
                        </p>

                        <button
                            onClick={calculateProjections}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Calculate Projections'}
                        </button>

                        {projections && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(projections.projections).map(([key, projection]) => (
                                    <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <h3 className="font-semibold text-lg mb-2 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">{projection.date}</p>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-gray-500">Interest Accrued</p>
                                                <p className="text-lg font-bold text-orange-600">
                                                    ₹{projection.interest_accrued?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Total Payable</p>
                                                <p className="text-xl font-bold text-green-600">
                                                    ₹{projection.total_payable?.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Overdue Calculator */}
                {activeTab === 'overdue' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Overdue Interest & Penalty Calculator</h2>
                        <p className="text-gray-600">
                            Calculate overdue interest with tiered penalty (2% for 0-30 days, 4% for 31-90 days, 6% for >90 days).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Overdue Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={overdueCalc.overdue_amount}
                                    onChange={(e) => setOverdueCalc({ ...overdueCalc, overdue_amount: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Overdue Days
                                </label>
                                <input
                                    type="number"
                                    value={overdueCalc.overdue_days}
                                    onChange={(e) => setOverdueCalc({ ...overdueCalc, overdue_days: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="Enter days"
                                />
                            </div>
                        </div>

                        <button
                            onClick={calculateOverdue}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Calculate Overdue'}
                        </button>

                        {overdueResult && (
                            <div className="mt-6 bg-red-50 rounded-lg p-6 border border-red-200">
                                <h3 className="font-semibold text-lg mb-4 text-red-800">Overdue Calculation</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Overdue Amount:</span>
                                        <span className="font-bold">₹{overdueResult.overdue_amount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Overdue Days:</span>
                                        <span className="font-bold">{overdueResult.overdue_days} days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Penalty Tier:</span>
                                        <span className="font-bold text-orange-600">{overdueResult.penalty_tier}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Overdue Interest:</span>
                                        <span className="font-bold">₹{overdueResult.overdue_interest?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Penalty:</span>
                                        <span className="font-bold text-red-600">₹{overdueResult.penalty_amount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t-2 border-red-300">
                                        <span className="text-lg font-semibold">Total Due:</span>
                                        <span className="text-xl font-bold text-red-700">₹{overdueResult.total_due?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* EMI Amortization */}
                {activeTab === 'amortization' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">EMI Amortization Table</h2>
                        <p className="text-gray-600">
                            Bank-style EMI schedule showing principal/interest split for each month.
                        </p>

                        <button
                            onClick={generateAmortization}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate Amortization Table'}
                        </button>

                        {amortizationTable && !amortizationTable.error && (
                            <div className="mt-6">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Principal</p>
                                            <p className="text-lg font-bold">₹{amortizationTable.principal_amount?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">EMI</p>
                                            <p className="text-lg font-bold">₹{amortizationTable.emi_amount?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Payment</p>
                                            <p className="text-lg font-bold">₹{amortizationTable.summary?.total_payment?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Interest</p>
                                            <p className="text-lg font-bold text-orange-600">
                                                ₹{amortizationTable.summary?.total_interest?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMI #</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">EMI Amount</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interest</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {amortizationTable.amortization_schedule?.map((row) => (
                                                <tr key={row.installment_number} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm">{row.installment_number}</td>
                                                    <td className="px-4 py-3 text-sm text-right">₹{row.emi_amount?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right">₹{row.principal_component?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-orange-600">₹{row.interest_component?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium">₹{row.outstanding_balance?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {amortizationTable && amortizationTable.error && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-800">{amortizationTable.error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Loan Ledger */}
                {activeTab === 'ledger' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Loan Ledger</h2>
                        <p className="text-gray-600">
                            Complete loan account statement with all transactions.
                        </p>

                        <button
                            onClick={generateLedger}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate Ledger'}
                        </button>

                        {loanLedger && (
                            <div className="mt-6">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Farmer</p>
                                            <p className="text-lg font-bold">{loanLedger.farmer_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Loan Type</p>
                                            <p className="text-lg font-bold capitalize">{loanLedger.loan_type?.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Principal</p>
                                            <p className="text-lg font-bold">₹{loanLedger.principal_amount?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Current Balance</p>
                                            <p className="text-lg font-bold text-green-600">
                                                ₹{loanLedger.summary?.current_balance?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interest</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {loanLedger.ledger_entries?.map((entry, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm whitespace-nowrap">{entry.date}</td>
                                                    <td className="px-4 py-3 text-sm">{entry.description}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-green-600">
                                                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-red-600">
                                                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                                                        {entry.interest > 0 ? `₹${entry.interest.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                                        ₹{entry.balance.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Loan Comparison */}
                {activeTab === 'comparison' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Compare Loan Schemes</h2>
                        <p className="text-gray-600">
                            Compare different loan types for the same amount and tenure.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Principal Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={comparison.principal_amount}
                                    onChange={(e) => setComparison({ ...comparison, principal_amount: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tenure (Months)
                                </label>
                                <input
                                    type="number"
                                    value={comparison.tenure_months}
                                    onChange={(e) => setComparison({ ...comparison, tenure_months: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="Enter months"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Schemes to Compare
                            </label>
                            <div className="space-y-2">
                                {['sao', 'long_term_emi', 'rythu_bandhu', 'rythu_nethany', 'amul_loan'].map(type => (
                                    <label key={type} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={comparison.loan_types.includes(type)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setComparison({ ...comparison, loan_types: [...comparison.loan_types, type] })
                                                } else {
                                                    setComparison({ ...comparison, loan_types: comparison.loan_types.filter(t => t !== type) })
                                                }
                                            }}
                                            className="mr-2"
                                        />
                                        <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={compareLoanSchemes}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Comparing...' : 'Compare Schemes'}
                        </button>

                        {comparisonResult && (
                            <div className="mt-6">
                                {comparisonResult.best_scheme && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                        <p className="font-semibold text-green-800">
                                            ✓ {comparisonResult.recommendation}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {comparisonResult.comparisons?.map((comp) => (
                                        <div
                                            key={comp.loan_type}
                                            className={`rounded-lg p-4 border-2 ${comp.loan_type === comparisonResult.best_scheme
                                                ? 'border-green-500 bg-green-50'
                                                : comp.eligible
                                                    ? 'border-gray-200 bg-white'
                                                    : 'border-red-200 bg-red-50'
                                                }`}
                                        >
                                            <h3 className="font-semibold text-lg mb-2">
                                                {comp.name}
                                                {comp.loan_type === comparisonResult.best_scheme && (
                                                    <span className="ml-2 text-sm text-green-600">✓ Best</span>
                                                )}
                                            </h3>

                                            {comp.eligible ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Interest Rate:</span>
                                                        <span className="font-medium">
                                                            {comp.rate_info || `${comp.interest_rate}%`}
                                                        </span>
                                                    </div>
                                                    {comp.rate_after_year && (
                                                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                                            Rate switches after 1 year: {comp.base_rate}% → {comp.rate_after_year}%
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">EMI:</span>
                                                        <span className="font-medium">₹{comp.emi_amount?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Total Interest:</span>
                                                        <span className="font-medium text-orange-600">
                                                            ₹{comp.total_interest?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                                                        <span>Total Payment:</span>
                                                        <span className="text-green-600">₹{comp.total_payment?.toLocaleString()}</span>
                                                    </div>

                                                    {comp.early_closure_benefit && (
                                                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                                                            <div className="text-xs font-semibold text-green-800 mb-2">
                                                                💡 Close within 1 year & save:
                                                            </div>
                                                            <div className="space-y-1 text-xs">
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-700">Interest (12 months):</span>
                                                                    <span className="font-semibold text-green-900">
                                                                        ₹{comp.early_closure_benefit.total_interest?.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-700">Total Payment:</span>
                                                                    <span className="font-semibold text-green-900">
                                                                        ₹{comp.early_closure_benefit.total_payment?.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between pt-1 border-t border-green-300">
                                                                    <span className="text-green-700 font-semibold">You Save:</span>
                                                                    <span className="font-bold text-green-600">
                                                                        ₹{comp.early_closure_benefit.savings?.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-red-600">{comp.reason}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Early Closure Comparison Table */}
                        {comparisonResult && comparisonResult.early_closure_comparison && (
                            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border border-green-200">
                                <h3 className="text-lg font-semibold text-green-900 mb-3">
                                    💰 Early Closure Benefits Summary
                                </h3>
                                <p className="text-sm text-green-700 mb-4">
                                    {comparisonResult.early_closure_comparison.message}
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                        <thead className="bg-green-600 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Loan Type</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold">Within 1 Year</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold">Full Tenure</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold">Savings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {comparisonResult.early_closure_comparison.comparisons.map((comp, idx) => (
                                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {comp.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                                                        ₹{comp.within_year_interest?.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-orange-600 font-semibold">
                                                        ₹{comp.full_tenure_interest?.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                                                        ₹{comp.savings?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                                    <p className="text-xs text-yellow-800">
                                        <strong>Recommendation:</strong> Consider closing the loan within 1 year to avoid higher interest rates
                                        that apply after the first year. Early repayment can save significant amounts.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Smart Recommendations */}
                {activeTab === 'recommendations' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Smart AI Recommendations</h2>
                        <p className="text-gray-600">
                            Get AI-powered advice on loan repayment and optimization.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Farmer's Monthly Income (₹) - Optional
                            </label>
                            <input
                                type="number"
                                value={farmerIncome}
                                onChange={(e) => setFarmerIncome(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Enter monthly income for better recommendations"
                            />
                        </div>

                        <button
                            onClick={getRecommendations}
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Get Smart Recommendations'}
                        </button>

                        {recommendations && (
                            <div className="mt-6 space-y-4">
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <LightBulbIcon className="h-6 w-6 text-yellow-500" />
                                        AI Recommendations
                                    </h3>

                                    {recommendations.daily_interest_cost && (
                                        <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                                            <div className="text-sm text-gray-600">Daily Interest Cost: <span className="font-semibold text-orange-600">₹{recommendations.daily_interest_cost?.toLocaleString()}</span></div>
                                            <div className="text-sm text-gray-600">Monthly Interest Cost: <span className="font-semibold text-orange-600">₹{recommendations.monthly_interest_cost?.toLocaleString()}</span></div>
                                            <div className="text-sm text-gray-600 mt-1">Total Potential Savings: <span className="font-semibold text-green-600">₹{recommendations.total_potential_savings?.toLocaleString()}</span></div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {recommendations.recommendations?.map((rec, index) => (
                                            <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                                                <div className="flex items-start gap-3">
                                                    <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold ${rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {rec.priority?.toUpperCase()}
                                                    </span>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                                                        <p className="text-gray-700 text-sm">{rec.description}</p>
                                                        {rec.potential_savings > 0 && (
                                                            <p className="text-green-600 text-sm font-medium mt-2">
                                                                💰 Potential Savings: ₹{rec.potential_savings?.toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {recommendations.quick_actions && recommendations.quick_actions.length > 0 && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="font-semibold mb-3">Quick Actions</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {recommendations.quick_actions.map((action, index) => (
                                                <button
                                                    key={index}
                                                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm"
                                                >
                                                    {action.label}
                                                    {action.amount && ` (₹${action.amount.toLocaleString()})`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
