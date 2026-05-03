const dataService = require('../services/dataService');

// ─── SUBMIT ROOM REQUEST ───────────────────────────────────────────────────────
// Calls stored procedure sp_submit_request
const submitRequest = async (req, res) => {
  const { event_title, event_type, dept_id, room_id, request_date, slot_id } = req.body;
  const requester_id = req.user.user_id;

  if (!event_title || !event_type || !room_id || !request_date || !slot_id) {
    return res.status(400).json({
      success: false,
      message: 'event_title, event_type, room_id, request_date, and slot_id are required.',
    });
  }

  try {
    const result = await dataService.submitRequest({
      requester_id,
      event_title,
      event_type,
      dept_id: dept_id || req.user.dept_id,
      room_id,
      request_date,
      slot_id,
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      request_id: result.request_id,
    });
  } catch (err) {
    console.error('submitRequest error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to submit request.' });
  }
};

// ─── GET MY REQUESTS ───────────────────────────────────────────────────────────
const getMyRequests = async (req, res) => {
  try {
    const rows = await dataService.listMyRequests(req.user.user_id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMyRequests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

// ─── GET ALL REQUESTS (Admin/Staff) ───────────────────────────────────────────
const getAllRequests = async (req, res) => {
  try {
    const rows = await dataService.listRequests(req.query.status);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAllRequests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

// ─── DECIDE REQUEST (Admin/Staff) ─────────────────────────────────────────────
const decideRequest = async (req, res) => {
  const { request_id } = req.params;
  const { decision, remarks } = req.body;
  const decided_by = req.user.user_id;

  if (!['Approved', 'Rejected'].includes(decision)) {
    return res.status(400).json({ success: false, message: 'decision must be Approved or Rejected.' });
  }

  try {
    const result = await dataService.decideRequest({
      request_id,
      decided_by,
      decision,
      remarks,
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    return res.json({ success: true, message: result.message });
  } catch (err) {
    console.error('decideRequest error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to decide request.' });
  }
};

// ─── GET APPROVAL LOG ──────────────────────────────────────────────────────────
const getApprovalLog = async (req, res) => {
  try {
    const rows = await dataService.listApprovalLogs(req.query.request_id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch logs.' });
  }
};

module.exports = { submitRequest, getMyRequests, getAllRequests, decideRequest, getApprovalLog };
