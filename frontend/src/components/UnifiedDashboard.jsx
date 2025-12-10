import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import FarmerDashboard from '../pages/farmer/Dashboard'
import EmployeeDashboard from '../pages/employee/Dashboard'
import AdminDashboard from '../pages/admin/Dashboard'

/**
 * UnifiedDashboard - Routes to the appropriate dashboard based on active role
 * This component supports role switching for users with multiple access levels
 */
export default function UnifiedDashboard() {
    const { user, activeRole } = useAuthStore()

    if (!user) {
        return <Navigate to="/login" />
    }

    // Determine which dashboard to show based on active role
    // If no active role is set, use the user's primary role
    const currentRole = activeRole || user.role

    // Verify user has access to the requested role
    const hasAccess = () => {
        switch (user.role) {
            case 'admin':
                // Admin can access all dashboards
                return ['admin', 'employee', 'farmer'].includes(currentRole)
            case 'employee':
                // Employee can access employee and farmer dashboards
                return ['employee', 'farmer'].includes(currentRole)
            case 'farmer':
                // Farmer can only access farmer dashboard
                return currentRole === 'farmer'
            default:
                return false
        }
    }

    if (!hasAccess()) {
        // If user doesn't have access to the requested role, redirect to their primary dashboard
        return <Navigate to={`/dashboard/${user.role}`} />
    }

    // Render the appropriate dashboard component
    switch (currentRole) {
        case 'farmer':
            return <FarmerDashboard />
        case 'employee':
            return <EmployeeDashboard />
        case 'admin':
            return <AdminDashboard />
        default:
            return <Navigate to={`/dashboard/${user.role}`} />
    }
}
