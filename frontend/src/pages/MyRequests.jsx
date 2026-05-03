import { useState, useEffect } from 'react';
import api from '../api/axios';

const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  useEffect(() => {
    api.get('/requests/mine')
      .then(({ data }) => setRequests(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? requests.filter(r => r.status === filter) : requests;

  return (
    <div>
      {/* Filter bar */}
      <div className="card mb-6">
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 20px' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Filter:</span>
          {['', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s || 'All'}
            </button>
          ))}
          <span className="text-muted" style={{ marginLeft: 'auto' }}>{filtered.length} request(s)</span>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner dark" style={{ width: 32, height: 32, margin: '0 auto' }} />
          <p>Loading…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ padding: '48px 20px' }}>
          <span style={{ fontSize: 40 }}>📭</span>
          <p>No requests found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(req => (
            <div key={req.request_id} className="card">
              <div className="card-body">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Request #{req.request_id}</span>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{req.event_title}</h4>
                    <span className="badge" style={{
                      background: '#f3f4f6', color: '#374151', marginTop: 4, fontSize: 11
                    }}>{req.event_type}</span>
                  </div>
                  <span className={`badge badge-${req.status.toLowerCase()}`} style={{ fontSize: 13 }}>
                    {req.status}
                  </span>
                </div>

                <div className="grid-3" style={{ marginTop: 12 }}>
                  <div>
                    <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Room</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{req.room_code}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{req.building}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Date</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{fmt(req.request_date)}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{req.slot_label}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Submitted</div>
                    <div style={{ fontSize: 13 }}>{fmtTime(req.created_at)}</div>
                  </div>
                </div>

                {(req.status === 'Approved' || req.status === 'Rejected') && (
                  <div className={`alert alert-${req.status === 'Approved' ? 'success' : 'error'}`}
                    style={{ marginTop: 14, marginBottom: 0 }}>
                    <strong>{req.status} by {req.decided_by_name}</strong>
                    {req.remarks && <span> — {req.remarks}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
