import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const today = () => {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

const EVENT_TYPES = ['Class', 'Exam', 'Society Event', 'Workshop', 'Seminar', 'Other'];
const ROOM_TYPES  = ['Classroom', 'Lab', 'Seminar Hall', 'Conference Room', 'Auditorium'];

export default function RequestRoom() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    event_title:  '',
    event_type:   'Society Event',
    dept_id:      user?.dept_id || '',
    room_id:      '',
    request_date: today(),
    slot_id:      '',
  });
  const [rooms,     setRooms]     = useState([]);
  const [slots,     setSlots]     = useState([]);
  const [depts,     setDepts]     = useState([]);
  const [avail,     setAvail]     = useState(null);   // null | {is_available, conflict}
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message,   setMessage]   = useState({ text: '', type: '' });
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/rooms'),
      api.get('/rooms/slots'),
      api.get('/admin/departments'),
    ]).then(([r, s, d]) => {
      setRooms(r.data.data);
      setSlots(s.data.data);
      setDepts(d.data.data);
    }).catch(console.error);
  }, []);

  // Check availability whenever room + date + slot are all filled
  useEffect(() => {
    if (form.room_id && form.request_date && form.slot_id) {
      checkAvailability();
    } else {
      setAvail(null);
    }
  }, [form.room_id, form.request_date, form.slot_id]); // eslint-disable-line

  const checkAvailability = async () => {
    setCheckingAvail(true);
    try {
      const { data } = await api.get(
        `/rooms/availability?room_id=${form.room_id}&date=${form.request_date}&slot_id=${form.slot_id}`
      );
      setAvail(data);
    } catch {
      setAvail(null);
    } finally {
      setCheckingAvail(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!avail?.is_available) {
      return setMessage({ text: 'Please select an available room slot before submitting.', type: 'error' });
    }
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      const { data } = await api.post('/requests', form);
      setMessage({ text: `✅ ${data.message} (Request #${data.request_id})`, type: 'success' });
      // Reset form
      setForm(f => ({ ...f, event_title: '', room_id: '', slot_id: '', request_date: today() }));
      setAvail(null);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Submission failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRooms = typeFilter ? rooms.filter(r => r.room_type === typeFilter) : rooms;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="card">
        <div className="card-header">
          <h3>📝 New Room Request</h3>
        </div>
        <div className="card-body">
          {message.text && (
            <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Event Info */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
              Event Details
            </h4>

            <div className="grid-2">
              <div className="form-group">
                <label>Event Title *</label>
                <input name="event_title" className="form-control" required
                  placeholder="e.g. IEEE Workshop on ML" value={form.event_title} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Event Type *</label>
                <select name="event_type" className="form-control" value={form.event_type} onChange={handleChange}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select name="dept_id" className="form-control" value={form.dept_id} onChange={handleChange}>
                <option value="">— Select Department —</option>
                {depts.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>

            <div className="divider" />

            {/* Room & Slot Selection */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
              Room &amp; Slot Selection
            </h4>

            <div className="form-group">
              <label>Filter by Room Type</label>
              <select className="form-control" value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setForm(f => ({ ...f, room_id: '' })); setAvail(null); }}>
                <option value="">All Types</option>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Select Room *</label>
              <select name="room_id" className="form-control" required value={form.room_id} onChange={handleChange}>
                <option value="">— Choose a Room —</option>
                {filteredRooms.map(r => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_code} — {r.building} ({r.room_type}, Cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" name="request_date" className="form-control" required
                  min={today()} value={form.request_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Time Slot *</label>
                <select name="slot_id" className="form-control" required value={form.slot_id} onChange={handleChange}>
                  <option value="">— Choose Slot —</option>
                  {slots.map(s => <option key={s.slot_id} value={s.slot_id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Live availability indicator */}
            {form.room_id && form.request_date && form.slot_id && (
              <div className={`alert alert-${checkingAvail ? 'info' : avail?.is_available ? 'success' : 'error'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {checkingAvail ? (
                  <><span className="spinner dark" style={{ width: 16, height: 16 }} /> Checking availability…</>
                ) : avail?.is_available ? (
                  <>✅ <strong>Room is available</strong> for the selected date and slot.</>
                ) : (
                  <>🚫 <strong>Room is already booked.</strong>
                    {avail?.conflict && (
                      <span className="text-sm" style={{ marginLeft: 8 }}>
                        (Reserved for: {avail.conflict.event_title})
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting || checkingAvail || !avail?.is_available}
              style={{ marginTop: 8 }}
            >
              {submitting ? <><span className="spinner" /> Submitting…</> : '📤 Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
