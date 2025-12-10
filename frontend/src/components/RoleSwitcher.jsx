import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
    UserCircleIcon,
    BriefcaseIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline'

const ROLE_CONFIG = {
    farmer: {
        id: 'farmer',
        label: 'Farmer',
        icon: UserCircleIcon,
        color: 'bg-green-500',
        gradient: 'from-green-400 to-green-600',
        dashboard: '/dashboard/farmer',
        description: 'Farmer Dashboard'
    },
    employee: {
        id: 'employee',
        label: 'Employee',
        icon: BriefcaseIcon,
        color: 'bg-blue-500',
        gradient: 'from-blue-400 to-blue-600',
        dashboard: '/dashboard/employee',
        description: 'Employee Dashboard'
    },
    admin: {
        id: 'admin',
        label: 'Admin',
        icon: ShieldCheckIcon,
        color: 'bg-purple-500',
        gradient: 'from-purple-400 to-purple-600',
        dashboard: '/dashboard/admin',
        description: 'Admin Dashboard'
    }
}

export default function RoleSwitcher() {
    const { user, activeRole, setActiveRole } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    // Determine available roles based on user's actual role
    const getAvailableRoles = () => {
        if (!user) return []

        // Debug: Log user role to console
        console.log('RoleSwitcher - User object:', user)
        console.log('RoleSwitcher - User role:', user.role)

        // Normalize role to lowercase for comparison
        const userRole = user.role?.toLowerCase()
        console.log('RoleSwitcher - Normalized role:', userRole)

        switch (userRole) {
            case 'admin':
                // Admin can access all three dashboards
                console.log('RoleSwitcher - Admin detected, showing 3 roles')
                return ['admin', 'employee', 'farmer']
            case 'employee':
                // Employee can only access employee dashboard
                console.log('RoleSwitcher - Employee detected, showing 1 role')
                return ['employee']
            case 'farmer':
                // Farmer can only access farmer dashboard
                console.log('RoleSwitcher - Farmer detected, showing 1 role')
                return ['farmer']
            default:
                console.log('RoleSwitcher - Unknown role:', user.role)
                return []
        }
    }

    const availableRoles = getAvailableRoles()
    console.log('RoleSwitcher - Available roles:', availableRoles)

    // Set initial active role based on current route or user's primary role
    useEffect(() => {
        if (!user) return

        const path = location.pathname

        // First, try to determine role from current route
        let roleFromPath = null
        if (path.includes('/dashboard/admin')) {
            roleFromPath = 'admin'
        } else if (path.includes('/dashboard/employee')) {
            roleFromPath = 'employee'
        } else if (path.includes('/dashboard/farmer')) {
            roleFromPath = 'farmer'
        }

        // If we have a role from path and user has access to it, use it
        if (roleFromPath && availableRoles.includes(roleFromPath) && activeRole !== roleFromPath) {
            setActiveRole(roleFromPath)
        } else if (!activeRole) {
            // If no active role is set, use the user's primary role
            setActiveRole(user.role)
        }
    }, [user, location.pathname, activeRole, availableRoles, setActiveRole])

    const handleRoleSwitch = (roleId) => {
        if (!availableRoles.includes(roleId)) return

        // Update active role in store
        setActiveRole(roleId)

        // Navigate to the corresponding dashboard
        const roleConfig = ROLE_CONFIG[roleId]
        navigate(roleConfig.dashboard)
    }

    // Don't show switcher if user has access to only one role
    if (availableRoles.length <= 1) {
        return null
    }

    return (
        <div className="w-full bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Dashboard View</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {ROLE_CONFIG[activeRole]?.description || 'Select a dashboard'}
                        </p>
                    </div>
                </div>

                {/* Simple Tab Buttons */}
                <div className="flex space-x-2">
                    {availableRoles.map((roleId) => {
                        const role = ROLE_CONFIG[roleId]
                        const isActive = activeRole === roleId
                        const Icon = role.icon

                        return (
                            <button
                                key={roleId}
                                onClick={() => handleRoleSwitch(roleId)}
                                className={`
                                    flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm
                                    transition-all duration-200 border-2
                                    ${isActive
                                        ? `bg-gradient-to-r ${role.gradient} text-white border-transparent shadow-md`
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{role.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
