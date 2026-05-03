import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ROOM_TYPES = ['Classroom', 'Lab', 'Seminar Hall', 'Conference Room', 'Auditorium'];

export default function Rooms() {
  const { user } = useAuth();
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ type: '', search: '' });
  const [addForm, setAddForm] = useState({ room_code: '', building: '', capacity: '', room_type: 'Classroom' });
  const [adding,  setAdding]  = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [msg,     setMsg]     = useState({ text: '', type: '' });

  const fetchRooms = () => {
    setLoading(true);
    api.get('/rooms')
      .then(({ data }) => setRooms(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setMsg({ text: '', type: '' });
    try {
      await api.post('/rooms', { ...addForm, capacity: parseInt(addForm.capacity) });
      setMsg({ text: 'Room added successfully!', type: 'success' });
      setAddForm({ room_code: '', building: '', capacity: '', room_type: 'Classroom' });
      setShowAdd(false);
      fetchRooms();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to add room.', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const filtered = rooms.filter(r => {
    if (filter.type && r.room_type !== filter.type) return false;
    if (filter.search && !`${r.room_code} ${r.building}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const typeColor = {
    'Classroom':       '#dbeafe',
    'Lab':             '#dcfce7',
    'Seminar Hall':    '#fef3c7',
    'Conference Room': '#f3e8ff',
    'Auditorium':      '#ffe4e6',
  };

  return (
    <div>
      {/* Filters + Add button */}
      <div className="card mb-6">
        <div className="card-body" style={{ display: 'flex', gap: 12, padding: '14px 20px', flexWrap: 'wrap' }}>
          <input
            className="form-control" style={{ maxWidth: 220 }}
            placeholder="🔍 Search room / building"
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          />
          <select className="form-control" style={{ maxWidth: 180 }}
            value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-muted" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            {filtered.length} room(s)
          </span>
          {user?.role === 'Admin' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(v => !v)}>
              {showAdd ? '✕ Cancel' : '+ Add Room'}
            </button>
          )}
        </div>

        {/* Add Room Form (Admin only) */}
        {showAdd && user?.role === 'Admin' && (
          <div style={{ padding: '0 20px 20px' }}>
            <div className="divider" style={{ marginTop: 0 }} />
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Room</h4>
            {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
            <form onSubmit={handleAdd}>
              <div className="grid-3" style={{ gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Room Code *</label>
                  <input className="form-control" required value={addForm.room_code}
                    placeholder="CS-103" onChange={e => setAddForm(f => ({ ...f, room_code: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Building *</label>
                  <input className="form-control" required value={addForm.building}
                    placeholder="CSE Block" onChange={e => setAddForm(f => ({ ...f, building: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Capacity *</label>
                  <input type="number" min="1" className="form-control" required value={addForm.capacity}
                    onChange={e => setAddForm(f => ({ ...f, capacity: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                  <label>Room Type *</label>
                  <select className="form-control" value={addForm.room_type}
                    onChange={e => setAddForm(f => ({ ...f, room_type: e.target.value }))}>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-success btn-block" disabled={adding}>
                    {adding ? <span className="spinner" /> : 'Add Room'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner dark" style={{ width: 32, height: 32, margin: '0 auto' }} />
          <p>Loading rooms…</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 14 }}>
          {filtered.map(room => (
            <div key={room.room_id} className="card">
              <div className="card-body">
                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                  background: typeColor[room.room_type] || '#f3f4f6', fontSize: 11, fontWeight: 600,
                  marginBottom: 10, color: '#374151'
                }}>
                  {room.room_type}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{room.room_code}</h3>
                <p className="text-muted" style={{ marginTop: 2 }}>{room.building}</p>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Capacity</span>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>{room.capacity}</div>
                  </div>
                  <div style={{ fontSize: 28 }}>
                    {room.room_type === 'Classroom' ? '🏫' : room.room_type === 'Lab' ? '🔬' :
                     room.room_type === 'Seminar Hall' ? '🎓' : room.room_type === 'Auditorium' ? '🎭' : '🏢'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <span style={{ fontSize: 36 }}>🏛️</span>
              <p>No rooms found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
