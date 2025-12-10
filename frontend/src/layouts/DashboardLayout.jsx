import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import RoleSwitcher from '../components/RoleSwitcher'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import {
    HomeIcon,
    BanknotesIcon,
    CreditCardIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    UserGroupIcon,
    CalculatorIcon,
    Cog6ToothIcon,
    UsersIcon,
    ChartPieIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline'

export default function DashboardLayout() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Navigation items based on user role
    const getNavigation = () => {
        const baseNavigation = [
            { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['farmer', 'employee', 'admin'] },
            { name: 'Loans', href: '/loans', icon: BanknotesIcon, roles: ['farmer', 'employee', 'admin'] },
            { name: 'Payments', href: '/payments', icon: CreditCardIcon, roles: ['farmer', 'employee', 'admin'] },
            { name: 'Smart Calculator', href: '/calculator', icon: CalculatorIcon, roles: ['farmer', 'employee', 'admin'] },
        ]

        const employeeNavigation = [
            { name: 'Farmers', href: '/farmers', icon: UserGroupIcon, roles: ['employee', 'admin'] },
            { name: 'Overdue', href: '/overdue', icon: ExclamationTriangleIcon, roles: ['employee', 'admin'] },
            { name: 'Branches', href: '/branches', icon: BuildingOfficeIcon, roles: ['employee', 'admin'] },
            { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['employee', 'admin'] },
            { name: 'Pro-Rata Calculator', href: user?.role === 'admin' ? '/admin/pro-rata-calculator' : '/employee/pro-rata-calculator', icon: CalculatorIcon, roles: ['employee', 'admin'] },
        ]

        const adminNavigation = [
            { name: 'System Overview', href: '/admin/overview', icon: ChartPieIcon, roles: ['admin'] },
            { name: 'User Management', href: '/admin/employees', icon: UsersIcon, roles: ['admin'] },
            { name: 'Configuration', href: '/admin/configuration', icon: Cog6ToothIcon, roles: ['admin'] },
        ]

        const profileNavigation = [
            { name: 'Profile', href: '/profile', icon: UserCircleIcon, roles: ['farmer', 'employee', 'admin'] },
        ]

        const allNavigation = [...baseNavigation, ...employeeNavigation, ...adminNavigation, ...profileNavigation]
        return allNavigation.filter(item => item.roles.includes(user?.role))
    }

    const navigation = getNavigation()

    const isActiveRoute = (href) => {
        return location.pathname === href || location.pathname.startsWith(href + '/')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Vertical Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo/Header */}
                    <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <h1 className="text-lg font-bold text-white">
                            COOPERATIVE PACS
                        </h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-white"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {user?.full_name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.full_name}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = isActiveRoute(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:pl-64">
                {/* Top Bar (Mobile) */}
                <div className="sticky top-0 z-10 bg-white shadow-sm lg:hidden">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <h1 className="text-lg font-bold text-indigo-600">
                            COOPERATIVE PACS
                        </h1>
                        <div className="w-6" /> {/* Spacer for alignment */}
                    </div>
                </div>

                {/* Role Switcher */}
                {/* <RoleSwitcher /> */}

                {/* Main Content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-8">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <p className="text-center text-sm text-gray-500">
                            © 2025 COOPERATIVE PACS Loan Management System. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    )
}
