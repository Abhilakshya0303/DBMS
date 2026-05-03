import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AppLayout } from './components/ProtectedRoute';

import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import RoomAvailability from './pages/RoomAvailability';
import RequestRoom     from './pages/RequestRoom';
import MyRequests      from './pages/MyRequests';
import AdminPanel      from './pages/AdminPanel';
import Rooms           from './pages/Rooms';
import { UsersPage, UtilisationReport } from './pages/AdminPages';

import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* All authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout title="Dashboard" />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<AppLayout title="All Rooms" />}>
              <Route path="/rooms" element={<Rooms />} />
            </Route>
            <Route element={<AppLayout title="Check Availability" />}>
              <Route path="/availability" element={<RoomAvailability />} />
            </Route>
            <Route element={<AppLayout title="My Requests" />}>
              <Route path="/my-requests" element={<MyRequests />} />
            </Route>
            <Route element={<AppLayout title="Request a Room" />}>
              <Route path="/request" element={<RequestRoom />} />
            </Route>
          </Route>

          {/* Admin + Staff */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Staff']} />}>
            <Route element={<AppLayout title="Approval Panel" />}>
              <Route path="/approvals" element={<AdminPanel />} />
            </Route>
            <Route element={<AppLayout title="Utilisation Report" />}>
              <Route path="/admin/report" element={<UtilisationReport />} />
            </Route>
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route element={<AppLayout title="User Management" />}>
              <Route path="/admin/users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
