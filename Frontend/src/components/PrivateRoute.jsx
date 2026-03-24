// src/components/PrivateRoute.js
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredPermissions, requireAll = false }) => {
  const { hasPermission } = usePermissions();
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  if (requiredPermissions && !hasPermission(requiredPermissions, requireAll)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Uso:
<Route
  path="/admin"
  element={
    <PrivateRoute requiredPermissions={["admin_panel", "super_access"]} requireAll>
      <AdminPage />
    </PrivateRoute>
  }
/>