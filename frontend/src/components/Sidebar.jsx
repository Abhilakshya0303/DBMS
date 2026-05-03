import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icon = ({ name }) => {
  const icons = {
    dashboard:    '📊',
    rooms:        '🏛️',
    availability: '🔍',
    request:      '📝',
    approval:     '✅',
    history:      '📋',
    users:        '👥',
    report:       '📈',
    logout:       '🚪',
  };
  return <span style={{ fontSize: 16 }}>{icons[name] || '•'}</span>;
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItem = (to, icon, label) => (
    <NavLink
      to={to}
      className={({ isActive }) => isActive ? 'active' : ''}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h2>🏫 Room Allocation</h2>
        <p>TIET Patiala</p>
      </div>

      <nav className="sidebar-nav">
        {navItem('/dashboard',    'dashboard',    'Dashboard')}
        {navItem('/rooms',        'rooms',        'All Rooms')}
        {navItem('/availability', 'availability', 'Check Availability')}
        {navItem('/request',      'request',      'Request Room')}
        {navItem('/my-requests',  'history',      'My Requests')}

        {(user?.role === 'Staff' || user?.role === 'Admin') && (
          <>
            {navItem('/approvals', 'approval', 'Approvals')}
            {navItem('/admin/report', 'report', 'Utilisation')}
          </>
        )}

        {user?.role === 'Admin' && (
          navItem('/admin/users', 'users', 'Users')
        )}
      </nav>

      <div className="sidebar-footer">
        <strong>{user?.full_name}</strong>
        <small style={{ color: '#9ca3af', display: 'block', marginTop: 2 }}>
          {user?.role} {user?.dept_name ? `· ${user.dept_name}` : ''}
        </small>
        <button
          onClick={handleLogout}
          style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                   background: 'none', border: 'none', color: '#9ca3af',
                   cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          <Icon name="logout" /> Logout
        </button>
      </div>
    </div>
  );
}
