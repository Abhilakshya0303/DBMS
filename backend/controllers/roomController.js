const dataService = require('../services/dataService');

// ─── GET ALL ROOMS ─────────────────────────────────────────────────────────────
const getAllRooms = async (req, res) => {
  try {
    const rooms = await dataService.listRooms(req.query);
    return res.json({ success: true, data: rooms });
  } catch (err) {
    console.error('getAllRooms error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch rooms.' });
  }
};

// ─── GET ROOM BY ID ────────────────────────────────────────────────────────────
const getRoomById = async (req, res) => {
  try {
    const room = await dataService.getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    return res.json({ success: true, data: room });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch room.' });
  }
};

// ─── CHECK ROOM AVAILABILITY ────────────────────────────────────────────────────
// GET /api/rooms/availability?room_id=1&date=2025-06-01&slot_id=2
const checkAvailability = async (req, res) => {
  const { room_id, date, slot_id } = req.query;

  if (!room_id || !date || !slot_id) {
    return res.status(400).json({
      success: false,
      message: 'room_id, date, and slot_id are required query parameters.',
    });
  }

  try {
    const result = await dataService.checkRoomAvailability(room_id, date, slot_id);

    return res.json({
      success: true,
      room_id: parseInt(room_id),
      date,
      slot_id: parseInt(slot_id),
      is_available: result.is_available,
      conflict: result.conflict,
    });
  } catch (err) {
    console.error('checkAvailability error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check availability.' });
  }
};

// ─── GET ALL AVAILABILITIES FOR A DATE ────────────────────────────────────────
// GET /api/rooms/schedule?date=2025-06-01
const getDaySchedule = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'date query param is required.' });
  }

  try {
    const rows = await dataService.getDaySchedule(date);
    return res.json({ success: true, date, data: rows });
  } catch (err) {
    console.error('getDaySchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch schedule.' });
  }
};

// ─── ADD ROOM (Admin only) ─────────────────────────────────────────────────────
const addRoom = async (req, res) => {
  const { room_code, building, capacity, room_type } = req.body;
  if (!room_code || !building || !capacity || !room_type) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  try {
    const room = await dataService.addRoom({ room_code, building, capacity, room_type });
    return res.status(201).json({ success: true, message: 'Room added.', room_id: room.room_id });
  } catch (err) {
    if (err.code === 'DUPLICATE_ROOM') {
      return res.status(409).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to add room.' });
  }
};

// ─── GET ALL TIME SLOTS ────────────────────────────────────────────────────────
const getTimeSlots = async (req, res) => {
  try {
    const slots = await dataService.listTimeSlots();
    return res.json({ success: true, data: slots });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch time slots.' });
  }
};

module.exports = { getAllRooms, getRoomById, checkAvailability, getDaySchedule, addRoom, getTimeSlots };
