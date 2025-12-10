import React, { useState, useEffect } from 'react';
import {
    CalculatorIcon,
    SparklesIcon,
    CurrencyRupeeIcon,
    CalendarIcon,
    ChartBarIcon,
    LightBulbIcon,
    ArrowTrendingUpIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function SmartCalculator({ loanId, userRole }) {
    const [activeTab, setActiveTab] = useState('instant');
    const [loading, setLoading] = useState(false);

    // Instant calculation states
    const [days, setDays] = useState(10);
    const [interestResult, setInterestResult] = useState(null);
    const [tomorrowInterest, setTomorrowInterest] = useState(null);
    const [todayInterest, setTodayInterest] = useState(null);
    const [next10DaysInterest, setNext10DaysInterest] = useState(null);
    const [emiSchedule, setEmiSchedule] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Simulation states
    const [simulationType, setSimulationType] = useState('early_payment');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [reduceEmi, setReduceEmi] = useState(true);
    const [simulationResult, setSimulationResult] = useState(null);

    // Penalty states
    const [penaltyResult, setPenaltyResult] = useState(null);

    // AI states
    const [aiExplanation, setAiExplanation] = useState('');
    const [aiLanguage, setAiLanguage] = useState('english');
    const [repaymentSuggestion, setRepaymentSuggestion] = useState(null);
    const [farmerIncome, setFarmerIncome] = useState('');

    // Comprehensive analysis
    const [loanAnalysis, setLoanAnalysis] = useState(null);
    const [loanStatus, setLoanStatus] = useState(null);
    const [disbursementDate, setDisbursementDate] = useState(null);

    useEffect(() => {
        // Fetch loan details for eligibility check
        const fetchLoanDetails = async () => {
            try {
                const response = await api.get(`/loans/${loanId}`);
                setLoanStatus(response.data.status);
                setDisbursementDate(response.data.disbursement_date);
            } catch (error) {
                setLoanStatus(null);
                setDisbursementDate(null);
            }
        };
        if (loanId) {
            fetchLoanDetails();
            loadComprehensiveAnalysis();
            loadTodayInterest();
            loadNext10DaysInterest();
            loadTomorrowInterest();
        }
    }, [loanId]);

    // ==================== INSTANT CALCULATIONS ====================

    const loadTodayInterest = async () => {
        try {
            const response = await api.post('/smart-calculator/calculate/interest-for-days', {
                loan_id: loanId,
                days: 1,
                from_date: null
            });
            setTodayInterest(response.data);
        } catch (error) {
            console.error('Failed to load today interest:', error);
        }
    };

    const loadNext10DaysInterest = async () => {
        try {
            const response = await api.post('/smart-calculator/calculate/interest-for-days', {
                loan_id: loanId,
                days: 10,
                from_date: null
            });
            setNext10DaysInterest(response.data);
        } catch (error) {
            console.error('Failed to load next 10 days interest:', error);
        }
    };

    const loadTomorrowInterest = async () => {
        try {
            const response = await api.get(`/smart-calculator/calculate/interest-tomorrow/${loanId}`);
            setTomorrowInterest(response.data);
        } catch (error) {
            console.error('Failed to load tomorrow interest:', error);
        }
    };

    const calculateInterestForDays = async () => {
        setLoading(true);
        try {
            const response = await api.post('/smart-calculator/calculate/interest-for-days', {
                loan_id: loanId,
                days: parseInt(days),
                from_date: null
            });
            setInterestResult(response.data);
        } catch (error) {
            alert('Failed to calculate interest: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getEMISchedule = async () => {
        setLoading(true);
        try {
            const response = await api.post('/smart-calculator/calculate/emi-schedule', {
                loan_id: loanId,
                as_of_date: selectedDate
            });
            setEmiSchedule(response.data);
        } catch (error) {
            alert('Failed to get EMI schedule: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================== SIMULATION ====================

    const runSimulation = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            alert('Please enter valid payment amount');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/smart-calculator/simulate/payment', {
                loan_id: loanId,
                payment_amount: parseFloat(paymentAmount),
                payment_date: paymentDate,
                simulation_type: simulationType,
                reduce_emi: reduceEmi
            });
            setSimulationResult(response.data);
        } catch (error) {
            alert('Simulation failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================== AI ASSISTANCE ====================

    const explainWithAI = async (data) => {
        setLoading(true);
        try {
            const response = await api.post('/smart-calculator/ai/explain', {
                calculation_data: data,
                language: aiLanguage
            });
            setAiExplanation(response.data.explanation);
        } catch (error) {
            alert('AI explanation failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getSuggestedRepaymentPlan = async () => {
        setLoading(true);
        try {
            const response = await api.post('/smart-calculator/ai/suggest-repayment', {
                loan_id: loanId,
                farmer_income: farmerIncome ? parseFloat(farmerIncome) : null
            });
            setRepaymentSuggestion(response.data);
        } catch (error) {
            alert('Failed to get AI suggestion: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================== COMPREHENSIVE ANALYSIS ====================

    const loadComprehensiveAnalysis = async () => {
        try {
            const response = await api.get(`/smart-calculator/analyze/${loanId}`, {
                params: { include_ai: false }
            });
            setLoanAnalysis(response.data);
        } catch (error) {
            console.error('Failed to load analysis:', error);
        }
    };

    // ==================== ELIGIBILITY LOGIC ====================
    // Move eligibility logic above return
    const isEligible = loanStatus === 'active' && disbursementDate;

    return (
        <div className="smart-calculator-wrapper">
            {!isEligible ? (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500 text-sm">
                    No active disbursed loans available. Only loans that have been disbursed can use the calculator.
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-lg">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CalculatorIcon className="h-8 w-8 text-white" />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Smart Loan Calculator</h2>
                                    <p className="text-indigo-100 text-sm">AI-powered calculations & simulations</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {todayInterest && (
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                        <div className="text-white/80 text-xs">Today's Interest</div>
                                        <div className="text-2xl font-bold text-white">
                                            ₹{parseFloat(todayInterest.interest_amount).toFixed(2)}
                                        </div>
                                    </div>
                                )}
                                {next10DaysInterest && (
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                        <div className="text-white/80 text-xs">Next 10 Days Interest</div>
                                        <div className="text-2xl font-bold text-white">
                                            ₹{parseFloat(next10DaysInterest.interest_amount).toFixed(2)}
                                        </div>
                                    </div>
                                )}
                                {tomorrowInterest && (
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                        <div className="text-white/80 text-xs">Tomorrow's Interest</div>
                                        <div className="text-2xl font-bold text-white">
                                            ₹{parseFloat(tomorrowInterest.interest_amount).toFixed(2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('instant')}
                                className={`px-6 py-3 font-medium ${activeTab === 'instant'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <ClockIcon className="h-5 w-5 inline mr-2" />
                                Instant Calculations
                            </button>
                            <button
                                onClick={() => setActiveTab('simulation')}
                                className={`px-6 py-3 font-medium ${activeTab === 'simulation'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <ChartBarIcon className="h-5 w-5 inline mr-2" />
                                What-If Simulations
                            </button>
                            <button
                                onClick={() => setActiveTab('ai')}
                                className={`px-6 py-3 font-medium ${activeTab === 'ai'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <SparklesIcon className="h-5 w-5 inline mr-2" />
                                AI Assistant
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* INSTANT CALCULATIONS TAB */}
                        {activeTab === 'instant' && (
                            <div className="space-y-6">
                                {/* Interest for Days */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <CurrencyRupeeIcon className="h-5 w-5 text-indigo-600" />
                                        Calculate Interest for Custom Days
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Number of Days
                                            </label>
                                            <input
                                                type="number"
                                                value={days}
                                                onChange={(e) => setDays(e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                                min={1}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={calculateInterestForDays}
                                                disabled={loading}
                                                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                                            >
                                                {loading ? 'Calculating...' : 'Calculate'}
                                            </button>
                                        </div>
                                    </div>
                                    {interestResult && (
                                        <div className="mt-4 bg-white p-4 rounded-lg border border-indigo-200">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-500">Principal</div>
                                                    <div className="text-lg font-semibold">
                                                        ₹{parseFloat(interestResult.principal).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Annual Rate</div>
                                                    <div className="text-lg font-semibold">
                                                        {interestResult.annual_rate}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Days</div>
                                                    <div className="text-lg font-semibold">{interestResult.days}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Interest Amount</div>
                                                    <div className="text-lg font-semibold text-indigo-600">
                                                        ₹{parseFloat(interestResult.interest_amount).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                                                {interestResult.explanation}
                                            </div>
                                            <button
                                                onClick={() => explainWithAI(interestResult)}
                                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                            >
                                                <SparklesIcon className="h-4 w-4" />
                                                Explain with AI
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* EMI Schedule as of Date */}
                                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5 text-indigo-600" />
                                        EMI Schedule & Outstanding
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                As of Date
                                            </label>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={getEMISchedule}
                                                disabled={loading}
                                                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                                            >
                                                {loading ? 'Loading...' : 'Get Schedule'}
                                            </button>
                                        </div>
                                    </div>
                                    {emiSchedule && (
                                        <div className="mt-4 space-y-3">
                                            <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-500">Principal Amount</div>
                                                        <div className="text-lg font-semibold">
                                                            ₹{parseFloat(emiSchedule.principal_amount).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">Total Paid</div>
                                                        <div className="text-lg font-semibold text-green-600">
                                                            ₹{parseFloat(emiSchedule.total_paid).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">Outstanding</div>
                                                        <div className="text-lg font-semibold text-orange-600">
                                                            ₹{parseFloat(emiSchedule.outstanding_balance).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                <table className="min-w-full bg-white text-sm">
                                                    <thead className="bg-gray-100 sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">EMI #</th>
                                                            <th className="px-3 py-2 text-left">Due Date</th>
                                                            <th className="px-3 py-2 text-right">EMI Amount</th>
                                                            <th className="px-3 py-2 text-right">Paid</th>
                                                            <th className="px-3 py-2 text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {emiSchedule.emi_schedule.map((emi) => (
                                                            <tr key={emi.installment_number}>
                                                                <td className="px-3 py-2">{emi.installment_number}</td>
                                                                <td className="px-3 py-2">{new Date(emi.due_date).toLocaleDateString()}</td>
                                                                <td className="px-3 py-2 text-right">
                                                                    ₹{parseFloat(emi.emi_amount).toFixed(2)}
                                                                </td>
                                                                <td className="px-3 py-2 text-right">
                                                                    ₹{parseFloat(emi.paid_amount).toFixed(2)}
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span
                                                                        className={`px-2 py-1 rounded-full text-xs ${emi.status === 'paid'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : emi.status === 'overdue'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : 'bg-yellow-100 text-yellow-800'
                                                                            }`}
                                                                    >
                                                                        {emi.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* ...other tabs and calculator logic... */}
                            </div>
                        )}
                        {/* SIMULATION TAB */}
                        {activeTab === 'simulation' && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
                                        Payment Simulation
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Simulation Type
                                            </label>
                                            <select
                                                value={simulationType}
                                                onChange={(e) => setSimulationType(e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                            >
                                                <option value="early_payment">Early Payment</option>
                                                <option value="prepayment">Prepayment</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Amount (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                                placeholder="Enter amount"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Date
                                            </label>
                                            <input
                                                type="date"
                                                value={paymentDate}
                                                onChange={(e) => setPaymentDate(e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={runSimulation}
                                                disabled={loading}
                                                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                                            >
                                                {loading ? 'Simulating...' : 'Run Simulation'}
                                            </button>
                                        </div>
                                    </div>
                                    {/* ...simulation results rendering... */}
                                </div>
                            </div>
                        )}
                        {/* ...other tabs and calculator logic... */}
                    </div>
                </div>
            )}
        </div>
    );
}

