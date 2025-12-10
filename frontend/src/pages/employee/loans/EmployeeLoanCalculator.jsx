import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CurrencyRupeeIcon,
    CalendarIcon,
    BanknotesIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import SmartCalculator from '../../../components/SmartCalculator';
import api from '../../../services/api';

export default function EmployeeLoanCalculator() {
    const { id } = useParams();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLoanDetails();
    }, [id]);

    const loadLoanDetails = async () => {
        try {
            const response = await api.get(`/loans/${id}`);
            setLoan(response.data);
        } catch (error) {
            console.error('Failed to load loan:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading loan details...</div>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Loan not found</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Smart Loan Calculator</h1>
                        <p className="text-gray-600">Employee Tools</p>
                    </div>
                </div>
            </div>

            {/* Loan Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <UserIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Farmer</div>
                            <div className="text-lg font-semibold text-gray-900">
                                {loan.farmer?.full_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {loan.loan_number}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CurrencyRupeeIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Principal</div>
                            <div className="text-xl font-semibold text-gray-900">
                                ₹{parseFloat(loan.principal_amount).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BanknotesIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Interest Rate</div>
                            <div className="text-xl font-semibold text-gray-900">
                                {loan.interest_rate}%
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <CalendarIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Tenure</div>
                            <div className="text-xl font-semibold text-gray-900">
                                {loan.tenure_months} months
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <CurrencyRupeeIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">EMI</div>
                            <div className="text-xl font-semibold text-gray-900">
                                ₹{loan.emi_amount ? parseFloat(loan.emi_amount).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <span className="text-gray-500">Branch:</span>
                            <span className="ml-2 font-medium">{loan.branch?.name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    loan.status === 'disbursed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {loan.status}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Disbursement:</span>
                            <span className="ml-2 font-medium">
                                {loan.disbursement_date ? new Date(loan.disbursement_date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Maturity:</span>
                            <span className="ml-2 font-medium">
                                {loan.maturity_date ? new Date(loan.maturity_date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Calculator Component */}
            <SmartCalculator loanId={parseInt(id)} userRole="employee" />
        </div>
    );
}
