import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchProfile } from './store/slices/authSlice'

// Auth
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Customer
import CustomerHome       from './pages/customer/HomePage'
import ServicePage        from './pages/customer/ServicePage'
import WorkersListPage    from './pages/customer/WorkersListPage'
import BookingFormPage    from './pages/customer/BookingFormPage'
import MyBookingsPage     from './pages/customer/MyBookingsPage'
import BookingDetailPage  from './pages/customer/BookingDetailPage'
import SimplePaymentPage  from './pages/customer/SimplePaymentPage'
import PaymentPage        from './pages/customer/PaymentPage'
import PaymentHistoryPage from './pages/customer/PaymentHistoryPage'

// Worker
import WorkerDashboard    from './pages/worker/DashboardPage'
import WorkerJobsPage     from './pages/worker/JobsPage'
import WorkerProfilePage  from './pages/worker/ProfilePage'
import WorkerSubscribePage from './pages/worker/SubscribePage'

// Admin
import AdminLoginPage     from './pages/admin/LoginPage'
import AdminDashboard     from './pages/admin/DashboardPage'
import AdminWorkersPage   from './pages/admin/WorkersPage'
import AdminCustomersPage from './pages/admin/CustomersPage'
import AdminBookingsPage  from './pages/admin/BookingsPage'
import AdminPaymentsPage  from './pages/admin/PaymentsPage'
import AdminServicesPage  from './pages/admin/ServicesPage'

// Layouts
import Layout      from './components/common/Layout'
import AdminLayout from './components/admin/AdminLayout'

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { access, isBootstrapping } = useSelector(s => s.auth)
  if (isBootstrapping) return <FullScreenSpinner />
  return access ? children : <Navigate to="/login" replace />
}

function RequireWorker({ children }) {
  const { user, isBootstrapping } = useSelector(s => s.auth)
  if (isBootstrapping) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'worker') return <Navigate to="/" replace />
  return children
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('access')
  const user  = JSON.parse(localStorage.getItem('admin_user') || 'null')
  if (!token || !user) return <Navigate to="/admin" replace />
  return children
}

function AppBootstrap() {
  const dispatch = useDispatch()
  const { access } = useSelector(s => s.auth)

  useEffect(() => {
    if (access) dispatch(fetchProfile())
  }, [])

  return (
    <Routes>
      {/* Public auth */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="workers"   element={<AdminWorkersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="bookings"  element={<AdminBookingsPage />} />
        <Route path="payments"  element={<AdminPaymentsPage />} />
        <Route path="services"  element={<AdminServicesPage />} />
      </Route>

      {/* Customer */}
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index                         element={<CustomerHome />} />
        <Route path="services/:slug"         element={<ServicePage />} />
        <Route path="workers"                element={<WorkersListPage />} />
        <Route path="book/:workerId"         element={<BookingFormPage />} />
        <Route path="bookings"               element={<MyBookingsPage />} />
        <Route path="bookings/:id"           element={<BookingDetailPage />} />
        <Route path="simple-pay/:bookingId"  element={<SimplePaymentPage />} />
        <Route path="pay/:bookingId"         element={<PaymentPage />} />
        <Route path="payments/history"       element={<PaymentHistoryPage />} />
      </Route>

      {/* Worker */}
      <Route path="/worker" element={
        <RequireAuth><RequireWorker><Layout /></RequireWorker></RequireAuth>
      }>
        <Route index            element={<WorkerDashboard />} />
        <Route path="jobs"      element={<WorkerJobsPage />} />
        <Route path="profile"   element={<WorkerProfilePage />} />
        <Route path="subscribe" element={<WorkerSubscribePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppBootstrap />
    </BrowserRouter>
  )
}
