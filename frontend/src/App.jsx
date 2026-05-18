import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Loading from './components/Loading'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import Credits from './pages/Credits'
import Expenses from './pages/Expenses'
import Reinvestments from './pages/Reinvestments'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Projections from './pages/Projections'
import Chat from './pages/Chat'
import Billing from './pages/Billing'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './components/AdminLayout'
import AdminOverview from './pages/admin/Overview'
import AdminUsers from './pages/admin/Users'
import AdminPayments from './pages/admin/Payments'
import AdminSubscriptions from './pages/admin/Subscriptions'
import AdminActivity from './pages/admin/Activity'
import NotFound from './pages/NotFound'

function UserArea({ children }) {
  const location = useLocation()
  const { user } = useAuthStore()

  if (user?.is_staff) {
    return <Navigate to="/admin/overview" replace />
  }

  if (user?.access_status === 'expired' && location.pathname !== '/app/billing') {
    return <Navigate to="/app/billing" replace />
  }

  return children
}

function AdminArea({ children }) {
  const { user } = useAuthStore()
  if (!user?.is_staff) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function App() {
  const { isAuthenticated, hydrateSession, sessionLoading, user } = useAuthStore()

  useEffect(() => {
    hydrateSession()
  }, [hydrateSession])

  if (sessionLoading) {
    return <Loading fullScreen />
  }

  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : user?.is_staff ? <Navigate to="/admin/overview" replace /> : <Navigate to={user?.access_status === 'expired' ? '/app/billing' : '/app/dashboard'} replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : user?.is_staff ? <Navigate to="/admin/overview" replace /> : <Navigate to={user?.access_status === 'expired' ? '/app/billing' : '/app/dashboard'} replace />} />
        <Route path="/admin/login" element={!isAuthenticated ? <AdminLogin /> : user?.is_staff ? <Navigate to="/admin/overview" replace /> : <Navigate to={user?.access_status === 'expired' ? '/app/billing' : '/app/dashboard'} replace />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminArea><AdminLayout /></AdminArea> : <Navigate to="/admin/login" replace />}
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="activity" element={<AdminActivity />} />
        </Route>

        {/* Protected routes */}
        <Route path="/app" element={isAuthenticated ? <UserArea><Layout /></UserArea> : <Navigate to="/login" />}> 
          <Route index element={<Navigate to="/app/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="sales" element={<Sales />} />
          <Route path="customers" element={<Customers />} />
          <Route path="credits" element={<Credits />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reinvestments" element={<Reinvestments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="projections" element={<Projections />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="billing" element={<Billing />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
