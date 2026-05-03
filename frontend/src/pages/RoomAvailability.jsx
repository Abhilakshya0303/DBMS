import { useState, useEffect } from 'react';
import api from '../api/axios';

const today = () => {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

export default function RoomAvailability() {
  const [rooms,    setRooms]    = useState([]);
  const [slots,    setSlots]    = useState([]);
  const [date,     setDate]     = useState(today());
  const [schedule, setSchedule] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState({ type: '', building: '' });

  // Load rooms + slots on mount
  useEffect(() => {
    Promise.all([api.get('/rooms'), api.get('/rooms/slots')])
      .then(([r, s]) => { setRooms(r.data.data); setSlots(s.data.data); })
      .catch(console.error);
  }, []);

  // Load schedule whenever date changes
  useEffect(() => { fetchSchedule(); }, [date]); // eslint-disable-line

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/rooms/schedule?date=${date}`);
      setSchedule(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Build a lookup: room_id → slot_id → schedule row
  const lookup = {};
  schedule.forEach(row => {
    if (!lookup[row.room_id]) lookup[row.room_id] = {};
    lookup[row.room_id][row.slot_id] = row;
  });

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    if (filter.type     && r.room_type !== filter.type)       return false;
    if (filter.building && !r.building.includes(filter.building)) return false;
    return true;
  });

  const buildings = [...new Set(rooms.map(r => r.building))];
  const roomTypes = ['Classroom', 'Lab', 'Seminar Hall', 'Conference Room', 'Auditorium'];

  return (
    <div>
      {/* Filters */}
      <div className="card mb-6">
        <div className="card-header"><h3>🔍 Room Availability Checker</h3></div>
        <div className="card-body">
          <div className="grid-3" style={{ gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Date</label>
              <input type="date" className="form-control" value={date}
                min={today()} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Room Type</label>
              <select className="form-control" value={filter.type}
                onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
                <option value="">All Types</option>
                {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Building</label>
              <select className="form-control" value={filter.building}
                onChange={e => setFilter(f => ({ ...f, building: e.target.value }))}>
                <option value="">All Buildings</option>
                {buildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-2 mb-4 items-center">
        <span className="badge badge-free">Free</span>
        <span className="badge badge-occupied">Occupied</span>
        <span className="text-muted" style={{ marginLeft: 8 }}>
          Showing availability for <strong>{new Date(date + 'T00:00:00').toDateString()}</strong>
          {' '}— {filteredRooms.length} room(s)
        </span>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner dark" style={{ width: 32, height: 32, margin: '0 auto' }} />
          <p>Loading schedule…</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 120 }}>Room</th>
                  <th>Type</th>
                  <th>Cap.</th>
                  {slots.map(s => (
                    <th key={s.slot_id} style={{ minWidth: 90, fontSize: 11 }}>
                      {s.label.replace(/Slot \d+ /, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(room => (
                  <tr key={room.room_id}>
                    <td>
                      <strong>{room.room_code}</strong>
                      <div className="text-muted" style={{ fontSize: 11 }}>{room.building}</div>
                    </td>
                    <td className="text-muted text-sm">{room.room_type}</td>
                    <td className="text-muted text-sm">{room.capacity}</td>
                    {slots.map(slot => {
                      const cell = lookup[room.room_id]?.[slot.slot_id];
                      const isOccupied = cell?.availability === 'Occupied';
                      return (
                        <td key={slot.slot_id} style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {isOccupied ? (
                            <span
                              className="badge badge-occupied"
                              title={cell?.event_title || 'Occupied'}
                              style={{ fontSize: 10, cursor: 'help' }}
                            >
                              Busy
                            </span>
                          ) : (
                            <span className="badge badge-free" style={{ fontSize: 10 }}>Free</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={slots.length + 3} className="empty-state">
                      No rooms match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
