import { useState, useEffect } from 'react';
import api from '../api/axios';

// ─── Users Page ────────────────────────────────────────────────────────────────
export function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const roleBadge = (role) => ({
    Admin:     { bg: '#fee2e2', color: '#dc2626' },
    Staff:     { bg: '#fef3c7', color: '#d97706' },
    Requester: { bg: '#dbeafe', color: '#2563eb' },
  }[role] || { bg: '#f3f4f6', color: '#374151' });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>👥 All Users</h3>
          <span className="text-muted text-sm">{users.length} user(s)</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="spinner dark" style={{ width: 32, height: 32, margin: '0 auto' }} /><p>Loading…</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const style = roleBadge(u.role);
                  return (
                    <tr key={u.user_id}>
                      <td className="text-muted">{u.user_id}</td>
                      <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <span className="badge" style={{ background: style.bg, color: style.color }}>{u.role}</span>
                      </td>
                      <td className="text-muted">{u.dept_name || '—'}</td>
                      <td className="text-muted text-sm">
                        {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Utilisation Report ────────────────────────────────────────────────────────
export function UtilisationReport() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/utilisation')
      .then(({ data }) => setData(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxBookings = Math.max(...data.map(d => d.total_bookings), 1);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>📈 Room Utilisation Report</h3>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="spinner dark" style={{ width: 32, height: 32, margin: '0 auto' }} /><p>Loading…</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room</th><th>Building</th><th>Type</th><th>Capacity</th>
                  <th>Total Bookings</th><th>Last 30 Days</th><th>Usage Bar</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const pct = Math.round((row.total_bookings / maxBookings) * 100);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.room_code}</td>
                      <td className="text-muted">{row.building}</td>
                      <td className="text-muted">{row.room_type}</td>
                      <td className="text-muted">{row.capacity}</td>
                      <td style={{ fontWeight: 700, color: '#1d4ed8' }}>{row.total_bookings}</td>
                      <td>{row.bookings_last_30_days}</td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8, width: '100%' }}>
                          <div style={{
                            background: pct > 70 ? '#dc2626' : pct > 40 ? '#d97706' : '#16a34a',
                            width: `${pct}%`, height: '100%', borderRadius: 999, transition: 'width .3s'
                          }} />
                        </div>
                        <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{pct}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
