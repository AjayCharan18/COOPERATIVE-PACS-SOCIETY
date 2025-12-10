import { Link } from 'react-router-dom'
import { UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-2">
                                <span className="text-2xl">🏦</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">COOPERATIVE PACS Loan Management</h1>
                                <p className="text-sm text-gray-600">District Central Cooperative Bank</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Welcome to COOPERATIVE PACS Loan Portal
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Empowering farmers with accessible credit and efficient loan management for cooperative banks
                    </p>
                </div>

                {/* Portal Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Farmer Portal */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="bg-gradient-to-br from-green-500 to-teal-600 p-8 text-white">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <span className="text-4xl">🌾</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-2">Farmer Portal</h3>
                            <p className="text-green-100">For farmers seeking agricultural loans</p>
                        </div>

                        <div className="p-8">
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">Apply for agricultural loans online</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">Track your loan status and payments</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">View payment history and schedules</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">Make EMI payments easily</span>
                                </li>
                            </ul>

                            <div className="space-y-3">
                                <Link
                                    to="/login/farmer"
                                    className="block w-full bg-gradient-to-r from-green-600 to-teal-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Login as Farmer
                                </Link>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-800 text-center">
                                        <strong>New Farmer?</strong> Contact your nearest COOPERATIVE PACS branch to create your account
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee Portal */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <ShieldCheckIcon className="h-10 w-10" />
                            </div>
                            <h3 className="text-3xl font-bold mb-2">Employee Portal</h3>
                            <p className="text-blue-100">For COOPERATIVE PACS staff and administrators</p>
                        </div>

                        <div className="p-8">
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">Manage farmer applications</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">Approve and disburse loans</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">Track collections and overdue loans</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-700">Generate reports and analytics</span>
                                </li>
                            </ul>

                            <div className="space-y-3">
                                <Link
                                    to="/login/employee"
                                    className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Login as Employee
                                </Link>
                                <Link
                                    to="/register/employee"
                                    className="block w-full border-2 border-blue-600 text-blue-700 text-center font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition-all duration-200"
                                >
                                    Register Employee Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-20">
                    <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Choose COOPERATIVE PACS Loan Management?
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">⚡</span>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Fast Processing</h4>
                            <p className="text-gray-600">Quick loan approvals with minimal documentation</p>
                        </div>

                        <div className="text-center">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">🔒</span>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Secure Platform</h4>
                            <p className="text-gray-600">Bank-grade security for your data</p>
                        </div>

                        <div className="text-center">
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">📊</span>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Real-time Tracking</h4>
                            <p className="text-gray-600">Monitor your loans and payments anytime</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-400">
                        © 2025 District Central Cooperative Bank. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Empowering farmers with accessible agricultural credit
                    </p>
                </div>
            </footer>
        </div>
    )
}
