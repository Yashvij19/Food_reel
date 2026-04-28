import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import Home from './pages/Home';
import Feed from './pages/Feed';
import ReelDetail from './pages/ReelDetail';
import Restaurant from './pages/Restaurant';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import SavedReels from './pages/SavedReels';
import Login from './pages/Login';
import Register from './pages/Register';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantManage from './pages/RestaurantManage';

// Components
import Navbar from './components/Navbar/Navbar';
import Toast from './components/Toast/Toast';
import { useUIStore } from './store/uiStore';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

function App() {
  const { toasts } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-950">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Feed - accessible but personalized when logged in */}
        <Route path="/feed" element={<Feed />} />
        <Route path="/reel/:id" element={<ReelDetail />} />
        <Route path="/restaurant/:id" element={<Restaurant />} />

        {/* Protected Routes - Customer */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile/saved" element={
          <ProtectedRoute>
            <SavedReels />
          </ProtectedRoute>
        } />

        {/* Protected Routes - Restaurant Owner */}
        <Route path="/restaurant/dashboard" element={
          <ProtectedRoute requiredRole="restaurant_owner">
            <RestaurantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/manage" element={
          <ProtectedRoute requiredRole="restaurant_owner">
            <RestaurantManage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Navbar - hidden on feed */}
      <Navbar />

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}

export default App;