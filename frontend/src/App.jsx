import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'

// Components
import UnifiedDashboard from './components/UnifiedDashboard'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import FarmerLogin from './pages/auth/FarmerLogin'
import EmployeeLogin from './pages/auth/EmployeeLogin'
import AdminLogin from './pages/auth/AdminLogin'
import FarmerRegister from './pages/auth/FarmerRegister'
import EmployeeRegister from './pages/auth/EmployeeRegister'
import ForgotPassword from './pages/auth/ForgotPassword'
import FarmerDashboard from './pages/farmer/Dashboard'
import EmployeeDashboard from './pages/employee/Dashboard'
import FarmerManagement from './pages/employee/FarmerManagement'
import AdminDashboard from './pages/admin/Dashboard'
import AdminSystemDashboard from './pages/admin/AdminDashboard'
import EmployeeManagement from './pages/admin/EmployeeManagement'
import UserManagement from './pages/admin/UserManagement'
import SystemConfiguration from './pages/admin/SystemConfiguration'
import LoanList from './pages/loans/LoanList'
import LoanDetail from './pages/loans/LoanDetail'
import CreateLoan from './pages/loans/CreateLoan'
import Payments from './pages/payments/Payments'
import Profile from './pages/Profile'
import OverdueManagement from './pages/overdue/OverdueManagement'
import DocumentManagement from './pages/documents/DocumentManagement'
import BranchAnalytics from './pages/branches/BranchAnalytics'
import Reports from './pages/reports/Reports'
import SmartCalculator from './pages/calculator/SmartCalculator'
import ProRataCalculatorAdmin from './pages/admin/ProRataCalculator'
import ProRataCalculatorEmployee from './pages/employee/ProRataCalculator'

function App() {
    const { user, isAuthenticated } = useAuthStore()

    const PrivateRoute = ({ children }) => {
        return isAuthenticated ? children : <Navigate to="/login" />
    }

    const getDashboard = () => {
        if (!user) return <Navigate to="/login" />

        switch (user.role) {
            case 'farmer':
                return <FarmerDashboard />
            case 'employee':
                return <EmployeeDashboard />
            case 'admin':
                return <AdminDashboard />
            default:
                return <Navigate to="/login" />
        }
    }

    return (
        <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
                {/* Legacy routes - redirect to farmer login */}
                <Route path="/login" element={<Navigate to="/login/farmer" />} />
                <Route path="/register" element={<Navigate to="/login/employee" />} />

                {/* Farmer Auth - Login only (no registration) */}
                <Route path="/login/farmer" element={<FarmerLogin />} />

                {/* Employee Auth */}
                <Route path="/login/employee" element={<EmployeeLogin />} />
                <Route path="/register/employee" element={<EmployeeRegister />} />

                {/* Admin Auth */}
                <Route path="/login/admin" element={<AdminLogin />} />

                {/* Forgot Password - for farmers, employees, and admins */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected Routes */}
            <Route
                element={
                    <PrivateRoute>
                        <DashboardLayout />
                    </PrivateRoute>
                }
            >
                <Route path="/" element={getDashboard()} />
                <Route path="/dashboard" element={getDashboard()} />

                {/* Role-based dashboard routes */}
                <Route path="/dashboard/farmer" element={<UnifiedDashboard />} />
                <Route path="/dashboard/employee" element={<UnifiedDashboard />} />
                <Route path="/dashboard/admin" element={<UnifiedDashboard />} />

                <Route path="/loans" element={<LoanList />} />
                <Route path="/loans/:id" element={<LoanDetail />} />
                <Route path="/loans/create" element={<CreateLoan />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/overdue" element={<OverdueManagement />} />
                <Route path="/farmers" element={<FarmerManagement />} />
                <Route path="/calculator" element={<SmartCalculator />} />
                <Route path="/documents/:loanId" element={<DocumentManagement />} />
                <Route path="/branches" element={<BranchAnalytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />

                {/* Admin Routes */}
                <Route path="/admin/overview" element={<AdminSystemDashboard />} />
                <Route path="/admin/employees" element={<UserManagement />} />
                <Route path="/admin/configuration" element={<SystemConfiguration />} />
                <Route path="/admin/pro-rata-calculator" element={<ProRataCalculatorAdmin />} />

                {/* Employee Routes */}
                <Route path="/employee/pro-rata-calculator" element={<ProRataCalculatorEmployee />} />
            </Route>

            {/* Landing Page */}
            <Route path="/home" element={<LandingPage />} />

            {/* Fallback */}
            <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/home" />} />
        </Routes>
    )
}

export default App
