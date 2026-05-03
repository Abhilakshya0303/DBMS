import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const fmt = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Dashboard() {
  const { user }          = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="empty-state">
      <div className="spinner dark" style={{ width: 32, height: 32, margin: '0 auto' }} />
      <p>Loading dashboard…</p>
    </div>
  );

  return (
    <div>
      {/* Welcome banner */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff', border: 'none' }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              👋 Welcome, {user?.full_name}
            </h2>
            <p style={{ color: '#bfdbfe', marginTop: 4 }}>
              {user?.role} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ fontSize: 48 }}>🏛️</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Rooms</div>
          <div className="stat-value">{stats?.stats?.total_rooms ?? 0}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Pending Requests</div>
          <div className="stat-value">{stats?.stats?.pending ?? 0}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{stats?.stats?.approved ?? 0}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{stats?.stats?.rejected ?? 0}</div>
        </div>
        <div className="stat-card gray">
          <div className="stat-label">Active Bookings</div>
          <div className="stat-value">{stats?.stats?.active_allocs ?? 0}</div>
        </div>
        <div className="stat-card gray">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats?.stats?.total_users ?? 0}</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Today's schedule */}
        <div className="card">
          <div className="card-header">
            <h3>📅 Today's Schedule</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {(stats?.today_schedule ?? []).length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 20px' }}>
                <span style={{ fontSize: 32 }}>🗓️</span>
                <p>No bookings today.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Slot</th>
                      <th>Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.today_schedule.map((row, i) => (
                      <tr key={i}>
                        <td><strong>{row.room_code}</strong></td>
                        <td>{row.label}</td>
                        <td>{row.event_title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent requests */}
        <div className="card">
          <div className="card-header">
            <h3>🕐 Recent Requests</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {(stats?.recent_requests ?? []).length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 20px' }}>
                <span style={{ fontSize: 32 }}>📭</span>
                <p>No requests yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Room</th>
                      <th>By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_requests.map((r) => (
                      <tr key={r.request_id}>
                        <td>{r.event_title}</td>
                        <td>{r.room_code}</td>
                        <td className="text-muted">{r.requester}</td>
                        <td>
                          <span className={`badge badge-${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
