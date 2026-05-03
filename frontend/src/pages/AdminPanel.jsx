import { useState, useEffect } from 'react';
import api from '../api/axios';

const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function DecideModal({ req, onClose, onDecided }) {
  const [decision, setDecision] = useState('');
  const [remarks,  setRemarks]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async () => {
    if (!decision) return setError('Please select Approve or Reject.');
    setLoading(true);
    setError('');
    try {
      await api.patch(`/requests/${req.request_id}/decide`, { decision, remarks });
      onDecided();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Decision failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 480 }}>
        <div className="card-header">
          <h3>Review Request #{req.request_id}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div className="card-body">
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <strong>{req.event_title}</strong> ({req.event_type})<br />
            🏛 {req.room_code} — {req.building} · {req.slot_label}<br />
            📅 {fmt(req.request_date)}<br />
            👤 Requested by <strong>{req.requester_name}</strong> ({req.requester_email})
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Decision *</label>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${decision === 'Approved' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => setDecision('Approved')}
              >✅ Approve</button>
              <button
                className={`btn btn-sm ${decision === 'Rejected' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setDecision('Rejected')}
              >🚫 Reject</button>
            </div>
          </div>

          <div className="form-group">
            <label>Remarks {decision === 'Rejected' ? '*' : '(optional)'}</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder={decision === 'Rejected' ? 'Reason for rejection…' : 'Any notes…'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-between">
            <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button
              className={`btn ${decision === 'Approved' ? 'btn-success' : 'btn-danger'}`}
              onClick={submit}
              disabled={loading || !decision}
            >
              {loading ? <span className="spinner" /> : null}
              Confirm {decision || 'Decision'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('Pending');
  const [modal,    setModal]    = useState(null);   // request object or null

  const fetch = async () => {
    setLoading(true);
    try {
      const url = filter ? `/requests?status=${filter}` : '/requests';
      const { data } = await api.get(url);
      setRequests(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [filter]); // eslint-disable-line

  return (
    <>
      {modal && (
        <DecideModal req={modal} onClose={() => setModal(null)} onDecided={fetch} />
      )}

      {/* Tab bar */}
      <div className="card mb-6">
        <div className="card-body" style={{ display: 'flex', gap: 10, padding: '14px 20px', alignItems: 'center' }}>
          {['Pending', 'Approved', 'Rejected', ''].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s || 'All'} {s === 'Pending' ? '🟡' : s === 'Approved' ? '🟢' : s === 'Rejected' ? '🔴' : ''}
            </button>
          ))}
          <span className="text-muted" style={{ marginLeft: 'auto' }}>{requests.length} result(s)</span>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner dark" style={{ width: 32, height: 32, margin: '0 auto' }} />
          <p>Loading…</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state card" style={{ padding: '48px 20px' }}>
          <span style={{ fontSize: 40 }}>📭</span>
          <p>No {filter.toLowerCase() || ''} requests found.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Room</th>
                  <th>Date / Slot</th>
                  <th>Requester</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  {filter === 'Pending' && <th>Action</th>}
                  {filter !== 'Pending' && <th>Decided By</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.request_id}>
                    <td className="text-muted">{req.request_id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{req.event_title}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{req.event_type}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{req.room_code}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{req.building} · Cap {req.capacity}</div>
                    </td>
                    <td>
                      <div>{fmt(req.request_date)}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{req.slot_label}</div>
                    </td>
                    <td>
                      <div>{req.requester_name}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{req.requester_role}</div>
                    </td>
                    <td className="text-muted text-sm">{fmtTime(req.created_at)}</td>
                    <td>
                      <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                      {req.remarks && (
                        <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }} title={req.remarks}>
                          {req.remarks.substring(0, 30)}{req.remarks.length > 30 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    {filter === 'Pending' && (
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => setModal(req)}>
                          Review
                        </button>
                      </td>
                    )}
                    {filter !== 'Pending' && (
                      <td className="text-muted text-sm">{req.decided_by_name || '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
