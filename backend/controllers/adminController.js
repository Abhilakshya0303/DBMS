const dataService = require('../services/dataService');

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const dashboard = await dataService.getDashboardStats();
    return res.json({
      success: true,
      ...dashboard,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

// ─── GET ALL USERS ─────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const rows = await dataService.listUsers();
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ─── GET ALL DEPARTMENTS ───────────────────────────────────────────────────────
const getDepartments = async (req, res) => {
  try {
    const rows = await dataService.listDepartments();
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
};

// ─── ROOM UTILIZATION REPORT ──────────────────────────────────────────────────
const getUtilisationReport = async (req, res) => {
  try {
    const rows = await dataService.getUtilisationReport();
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch utilisation report.' });
  }
};

module.exports = { getDashboardStats, getAllUsers, getDepartments, getUtilisationReport };
