const db = require('../config/db');

function classifyDecisionMessage(message) {
  if (!message) return { status: 400, message: 'Unknown database response.' };
  if (message.includes('already been decided')) return { status: 400, message };
  if (message.includes('already booked') || message.includes('CONFLICT')) return { status: 409, message };
  if (message.includes('Request not found')) return { status: 404, message };
  if (message.includes('Error') || message.includes('rolled back')) return { status: 400, message };
  return { status: 400, message };
}

async function getMetadata() {
  const [[row]] = await db.query('SELECT DATABASE() AS database_name, VERSION() AS version');
  return {
    driver: 'mysql',
    database: row.database_name,
    version: row.version,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
  };
}

async function listDepartments() {
  const [rows] = await db.query('SELECT * FROM DEPARTMENT ORDER BY dept_name');
  return rows;
}

async function getUserByEmail(email) {
  const [rows] = await db.query(
    `SELECT u.user_id, u.full_name, u.email, u.password_hash, u.role,
            u.dept_id, d.dept_name, u.created_at
     FROM USER_ACCOUNT u
     LEFT JOIN DEPARTMENT d ON d.dept_id = u.dept_id
     WHERE u.email = ?`,
    [String(email).toLowerCase()]
  );

  return rows[0] || null;
}

async function getUserById(userId) {
  const [rows] = await db.query(
    `SELECT u.user_id, u.full_name, u.email, u.role, u.dept_id,
            d.dept_name, u.created_at
     FROM USER_ACCOUNT u
     LEFT JOIN DEPARTMENT d ON d.dept_id = u.dept_id
     WHERE u.user_id = ?`,
    [userId]
  );

  return rows[0] || null;
}

async function createUser({ full_name, email, password_hash, role, dept_id }) {
  try {
    const [result] = await db.query(
      `INSERT INTO USER_ACCOUNT (full_name, email, password_hash, role, dept_id)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, String(email).toLowerCase(), password_hash, role, dept_id || null]
    );

    return {
      user_id: result.insertId,
      full_name,
      email: String(email).toLowerCase(),
      role,
      dept_id: dept_id || null,
    };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error('Email already registered.');
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }
    throw err;
  }
}

async function listUsers() {
  const [rows] = await db.query(
    `SELECT u.user_id, u.full_name, u.email, u.role, u.created_at,
            d.dept_name
     FROM USER_ACCOUNT u
     LEFT JOIN DEPARTMENT d ON d.dept_id = u.dept_id
     ORDER BY u.created_at DESC`
  );

  return rows;
}

async function listRooms({ type, building } = {}) {
  let sql = 'SELECT * FROM ROOM WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND room_type = ?';
    params.push(type);
  }
  if (building) {
    sql += ' AND building LIKE ?';
    params.push(`%${building}%`);
  }

  sql += ' ORDER BY building, room_code';
  const [rows] = await db.query(sql, params);
  return rows;
}

async function getRoomById(roomId) {
  const [rows] = await db.query('SELECT * FROM ROOM WHERE room_id = ?', [roomId]);
  return rows[0] || null;
}

async function addRoom({ room_code, building, capacity, room_type }) {
  try {
    const [result] = await db.query(
      'INSERT INTO ROOM (room_code, building, capacity, room_type) VALUES (?, ?, ?, ?)',
      [room_code, building, Number(capacity), room_type]
    );

    return {
      room_id: result.insertId,
      room_code,
      building,
      capacity: Number(capacity),
      room_type,
    };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error('Room code already exists.');
      error.code = 'DUPLICATE_ROOM';
      throw error;
    }
    throw err;
  }
}

async function listTimeSlots() {
  const [rows] = await db.query('SELECT * FROM TIME_SLOT ORDER BY start_time');
  return rows;
}

async function checkRoomAvailability(roomId, date, slotId) {
  const [[availability]] = await db.query(
    'SELECT fn_is_room_available(?, ?, ?) AS is_available',
    [roomId, date, slotId]
  );

  let conflict = null;
  if (availability.is_available !== 1) {
    const [rows] = await db.query(
      `SELECT ra.allocation_id, ra.alloc_date, ts.label AS slot_label,
              ce.event_title, ua.full_name AS organizer
       FROM ROOM_ALLOCATION ra
       JOIN TIME_SLOT ts ON ts.slot_id = ra.slot_id
       JOIN CLASS_EVENT ce ON ce.event_id = ra.event_id
       JOIN USER_ACCOUNT ua ON ua.user_id = ce.organizer_id
       WHERE ra.room_id = ?
         AND ra.alloc_date = ?
         AND ra.slot_id = ?
         AND ra.status = 'Active'`,
      [roomId, date, slotId]
    );
    conflict = rows[0] || null;
  }

  return {
    is_available: availability.is_available === 1,
    conflict,
  };
}

async function getDaySchedule(date) {
  const [rows] = await db.query(
    `SELECT r.room_id, r.room_code, r.building, r.capacity, r.room_type,
            ts.slot_id, ts.label AS slot_label, ts.start_time, ts.end_time,
            CASE WHEN ra.allocation_id IS NOT NULL THEN 'Occupied' ELSE 'Free' END AS availability,
            ce.event_title, ua.full_name AS organizer
     FROM ROOM r
     CROSS JOIN TIME_SLOT ts
     LEFT JOIN ROOM_ALLOCATION ra
       ON ra.room_id = r.room_id
      AND ra.slot_id = ts.slot_id
      AND ra.alloc_date = ?
      AND ra.status = 'Active'
     LEFT JOIN CLASS_EVENT ce ON ce.event_id = ra.event_id
     LEFT JOIN USER_ACCOUNT ua ON ua.user_id = ce.organizer_id
     ORDER BY r.building, r.room_code, ts.start_time`,
    [date]
  );

  return rows;
}

async function submitRequest({ requester_id, event_title, event_type, dept_id, room_id, request_date, slot_id }) {
  await db.query(
    'CALL sp_submit_request(?, ?, ?, ?, ?, ?, ?, @p_request_id, @p_message)',
    [requester_id, event_title, event_type, dept_id || null, room_id, request_date, slot_id]
  );

  const [[out]] = await db.query('SELECT @p_request_id AS request_id, @p_message AS message');
  if (out.request_id === -1) {
    return { ok: false, status: 409, message: out.message };
  }

  return {
    ok: true,
    request_id: out.request_id,
    message: out.message,
  };
}

async function listMyRequests(userId) {
  const [rows] = await db.query(
    `SELECT rr.request_id, rr.request_date, rr.status, rr.remarks, rr.created_at, rr.updated_at,
            ce.event_title, ce.event_type,
            r.room_code, r.building, r.room_type, r.capacity,
            ts.label AS slot_label, ts.start_time, ts.end_time,
            ua.full_name AS decided_by_name
     FROM ROOM_REQUEST rr
     JOIN CLASS_EVENT ce ON ce.event_id = rr.event_id
     JOIN ROOM r ON r.room_id = rr.room_id
     JOIN TIME_SLOT ts ON ts.slot_id = rr.slot_id
     LEFT JOIN USER_ACCOUNT ua ON ua.user_id = rr.decided_by
     WHERE rr.requester_id = ?
     ORDER BY rr.created_at DESC`,
    [userId]
  );

  return rows;
}

async function listRequests(status) {
  let sql = `
    SELECT rr.request_id, rr.request_date, rr.status, rr.remarks, rr.created_at, rr.updated_at,
           ce.event_title, ce.event_type,
           r.room_code, r.building, r.room_type, r.capacity,
           ts.label AS slot_label, ts.start_time, ts.end_time,
           req.full_name AS requester_name, req.email AS requester_email,
           req.role AS requester_role,
           ua.full_name AS decided_by_name
    FROM ROOM_REQUEST rr
    JOIN CLASS_EVENT ce ON ce.event_id = rr.event_id
    JOIN ROOM r ON r.room_id = rr.room_id
    JOIN TIME_SLOT ts ON ts.slot_id = rr.slot_id
    JOIN USER_ACCOUNT req ON req.user_id = rr.requester_id
    LEFT JOIN USER_ACCOUNT ua ON ua.user_id = rr.decided_by
    WHERE 1=1`;
  const params = [];

  if (status) {
    sql += ' AND rr.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY rr.created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
}

async function decideRequest({ request_id, decided_by, decision, remarks }) {
  const [existingRows] = await db.query(
    'SELECT request_id FROM ROOM_REQUEST WHERE request_id = ?',
    [request_id]
  );

  if (existingRows.length === 0) {
    return { ok: false, status: 404, message: 'Request not found.' };
  }

  await db.query(
    'CALL sp_decide_request(?, ?, ?, ?, @p_message)',
    [request_id, decided_by, decision, remarks || '']
  );

  const [[out]] = await db.query('SELECT @p_message AS message');
  if (out.message !== `Request ${decision} successfully.`) {
    return { ok: false, ...classifyDecisionMessage(out.message) };
  }

  return { ok: true, message: out.message };
}

async function listApprovalLogs(requestId) {
  let sql = `
    SELECT al.log_id, al.action, al.action_time, al.comments,
           ua.full_name AS action_by_name, ua.role AS action_by_role,
           al.request_id
    FROM APPROVAL_LOG al
    JOIN USER_ACCOUNT ua ON ua.user_id = al.action_by
    WHERE 1=1`;
  const params = [];

  if (requestId) {
    sql += ' AND al.request_id = ?';
    params.push(requestId);
  }

  sql += ' ORDER BY al.action_time DESC';
  const [rows] = await db.query(sql, params);
  return rows;
}

async function getDashboardStats() {
  const [[rooms]] = await db.query('SELECT COUNT(*) AS total FROM ROOM');
  const [[users]] = await db.query('SELECT COUNT(*) AS total FROM USER_ACCOUNT');
  const [[pending]] = await db.query("SELECT COUNT(*) AS total FROM ROOM_REQUEST WHERE status = 'Pending'");
  const [[approved]] = await db.query("SELECT COUNT(*) AS total FROM ROOM_REQUEST WHERE status = 'Approved'");
  const [[rejected]] = await db.query("SELECT COUNT(*) AS total FROM ROOM_REQUEST WHERE status = 'Rejected'");
  const [[active]] = await db.query("SELECT COUNT(*) AS total FROM ROOM_ALLOCATION WHERE status = 'Active'");

  const [todaySchedule] = await db.query(
    `SELECT r.room_code, ts.label, ce.event_title
     FROM ROOM_ALLOCATION ra
     JOIN ROOM r ON r.room_id = ra.room_id
     JOIN TIME_SLOT ts ON ts.slot_id = ra.slot_id
     JOIN CLASS_EVENT ce ON ce.event_id = ra.event_id
     WHERE ra.alloc_date = CURDATE() AND ra.status = 'Active'
     ORDER BY ts.start_time
     LIMIT 10`
  );

  const [recentRequests] = await db.query(
    `SELECT rr.request_id, rr.status, rr.created_at,
            ce.event_title, ua.full_name AS requester, r.room_code
     FROM ROOM_REQUEST rr
     JOIN CLASS_EVENT ce ON ce.event_id = rr.event_id
     JOIN USER_ACCOUNT ua ON ua.user_id = rr.requester_id
     JOIN ROOM r ON r.room_id = rr.room_id
     ORDER BY rr.created_at DESC
     LIMIT 5`
  );

  return {
    stats: {
      total_rooms: rooms.total,
      total_users: users.total,
      pending: pending.total,
      approved: approved.total,
      rejected: rejected.total,
      active_allocs: active.total,
    },
    today_schedule: todaySchedule,
    recent_requests: recentRequests,
  };
}

async function getUtilisationReport() {
  const [rows] = await db.query(
    `SELECT r.room_code, r.building, r.room_type, r.capacity,
            COUNT(ra.allocation_id) AS total_bookings,
            SUM(CASE WHEN ra.alloc_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                 THEN 1 ELSE 0 END) AS bookings_last_30_days
     FROM ROOM r
     LEFT JOIN ROOM_ALLOCATION ra
       ON ra.room_id = r.room_id
      AND ra.status = 'Active'
     GROUP BY r.room_id, r.room_code, r.building, r.room_type, r.capacity
     ORDER BY total_bookings DESC, r.room_code ASC`
  );

  return rows;
}

module.exports = {
  addRoom,
  checkRoomAvailability,
  createUser,
  decideRequest,
  getDashboardStats,
  getDaySchedule,
  getMetadata,
  getRoomById,
  getUserByEmail,
  getUserById,
  getUtilisationReport,
  listApprovalLogs,
  listDepartments,
  listMyRequests,
  listRequests,
  listRooms,
  listTimeSlots,
  listUsers,
  submitRequest,
};
