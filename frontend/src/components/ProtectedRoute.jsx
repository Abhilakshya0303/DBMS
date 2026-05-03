import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

// ─── Protects routes that require authentication ───────────────────────────────
export function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

// ─── Main shell layout with sidebar ───────────────────────────────────────────
export function AppLayout({ title }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>{title}</h1>
        </div>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
