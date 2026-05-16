import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Verification from './pages/Verification';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Transactions from './pages/Transactions';
import Disputes from './pages/Disputes';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Deposits from './pages/Deposits';
import Withdrawals from './pages/Withdrawals';
import AdminLayout from './components/layout/AdminLayout';
import { authService } from './lib/auth';

// --- PROTECTED ROUTE WRAPPER ---
const ProtectedRoute = () => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = authService.getUser();
  if (user && user.role !== 'admin') {
    authService.logout();
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/users"        element={<Users />} />
          <Route path="/products"     element={<Products />} />
          <Route path="/orders"       element={<Orders />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/disputes"     element={<Disputes />} />
          <Route path="/deposits"     element={<Deposits />} />
          <Route path="/withdrawals"  element={<Withdrawals />} />
          <Route path="/analytics"    element={<Analytics />} />

          {/* Default redirect to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
