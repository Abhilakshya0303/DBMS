const PASSWORD_HASH = '$2a$10$hF5eqwuc2S9NDAD0.vvF1uEvqlW1lH2FRd3yCeyUuV62D2nDiEb0q';

function toLocalIsoDate(date) {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 10);
}

function addDays(base, days) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function addHours(base, hours) {
  return new Date(base.getTime() + (hours * 60 * 60 * 1000));
}

function createSeedData() {
  const now = new Date();
  const today = toLocalIsoDate(now);
  const inTwoDays = toLocalIsoDate(addDays(now, 2));
  const inThreeDays = toLocalIsoDate(addDays(now, 3));
  const inFiveDays = toLocalIsoDate(addDays(now, 5));

  const requestOneCreatedAt = addHours(now, -8).toISOString();
  const requestTwoCreatedAt = addHours(now, -3).toISOString();

  return {
    meta: {
      driver: 'file',
      initialized_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    counters: {
      department: 5,
      room: 10,
      time_slot: 9,
      user: 5,
      event: 5,
      request: 2,
      allocation: 3,
      log: 2,
    },
    departments: [
      { dept_id: 1, dept_name: 'Computer Science & Engineering' },
      { dept_id: 2, dept_name: 'Electronics & Communication Engineering' },
      { dept_id: 3, dept_name: 'Mechanical Engineering' },
      { dept_id: 4, dept_name: 'Civil Engineering' },
      { dept_id: 5, dept_name: 'Administration' },
    ],
    rooms: [
      { room_id: 1, room_code: 'CS-101', building: 'CSE Block', capacity: 60, room_type: 'Classroom' },
      { room_id: 2, room_code: 'CS-102', building: 'CSE Block', capacity: 60, room_type: 'Classroom' },
      { room_id: 3, room_code: 'CS-LAB-1', building: 'CSE Block', capacity: 30, room_type: 'Lab' },
      { room_id: 4, room_code: 'CS-LAB-2', building: 'CSE Block', capacity: 30, room_type: 'Lab' },
      { room_id: 5, room_code: 'SH-101', building: 'Main Block', capacity: 200, room_type: 'Seminar Hall' },
      { room_id: 6, room_code: 'AUD-01', building: 'Central Block', capacity: 500, room_type: 'Auditorium' },
      { room_id: 7, room_code: 'EC-101', building: 'ECE Block', capacity: 60, room_type: 'Classroom' },
      { room_id: 8, room_code: 'ME-101', building: 'ME Block', capacity: 60, room_type: 'Classroom' },
      { room_id: 9, room_code: 'CONF-01', building: 'Admin Block', capacity: 20, room_type: 'Conference Room' },
      { room_id: 10, room_code: 'LIB-SEM', building: 'Library Block', capacity: 80, room_type: 'Seminar Hall' },
    ],
    timeSlots: [
      { slot_id: 1, label: 'Slot 1 (8:00-9:00)', start_time: '08:00:00', end_time: '09:00:00' },
      { slot_id: 2, label: 'Slot 2 (9:00-10:00)', start_time: '09:00:00', end_time: '10:00:00' },
      { slot_id: 3, label: 'Slot 3 (10:00-11:00)', start_time: '10:00:00', end_time: '11:00:00' },
      { slot_id: 4, label: 'Slot 4 (11:00-12:00)', start_time: '11:00:00', end_time: '12:00:00' },
      { slot_id: 5, label: 'Slot 5 (12:00-13:00)', start_time: '12:00:00', end_time: '13:00:00' },
      { slot_id: 6, label: 'Slot 6 (13:00-14:00)', start_time: '13:00:00', end_time: '14:00:00' },
      { slot_id: 7, label: 'Slot 7 (14:00-15:00)', start_time: '14:00:00', end_time: '15:00:00' },
      { slot_id: 8, label: 'Slot 8 (15:00-16:00)', start_time: '15:00:00', end_time: '16:00:00' },
      { slot_id: 9, label: 'Slot 9 (16:00-17:00)', start_time: '16:00:00', end_time: '17:00:00' },
    ],
    users: [
      {
        user_id: 1,
        full_name: 'Admin User',
        email: 'admin@thapar.edu',
        password_hash: PASSWORD_HASH,
        role: 'Admin',
        dept_id: 5,
        created_at: addHours(now, -240).toISOString(),
      },
      {
        user_id: 2,
        full_name: 'Staff Member',
        email: 'staff@thapar.edu',
        password_hash: PASSWORD_HASH,
        role: 'Staff',
        dept_id: 1,
        created_at: addHours(now, -230).toISOString(),
      },
      {
        user_id: 3,
        full_name: 'Abhilakshya Puri',
        email: 'abhilakshya@thapar.edu',
        password_hash: PASSWORD_HASH,
        role: 'Requester',
        dept_id: 1,
        created_at: addHours(now, -220).toISOString(),
      },
      {
        user_id: 4,
        full_name: 'Aryan Gupta',
        email: 'aryan@thapar.edu',
        password_hash: PASSWORD_HASH,
        role: 'Requester',
        dept_id: 1,
        created_at: addHours(now, -210).toISOString(),
      },
      {
        user_id: 5,
        full_name: 'Academic Coordinator',
        email: 'coordinator@thapar.edu',
        password_hash: PASSWORD_HASH,
        role: 'Staff',
        dept_id: 2,
        created_at: addHours(now, -200).toISOString(),
      },
    ],
    events: [
      {
        event_id: 1,
        event_title: 'Data Structures Lecture',
        event_type: 'Class',
        organizer_id: 2,
        dept_id: 1,
        created_at: addHours(now, -72).toISOString(),
      },
      {
        event_id: 2,
        event_title: 'DBMS Lab Session',
        event_type: 'Class',
        organizer_id: 2,
        dept_id: 1,
        created_at: addHours(now, -70).toISOString(),
      },
      {
        event_id: 3,
        event_title: 'Algorithms Mid-Semester Exam',
        event_type: 'Exam',
        organizer_id: 2,
        dept_id: 1,
        created_at: addHours(now, -68).toISOString(),
      },
      {
        event_id: 4,
        event_title: 'IEEE Tech Fest Planning Meet',
        event_type: 'Society Event',
        organizer_id: 3,
        dept_id: 1,
        created_at: addHours(now, -66).toISOString(),
      },
      {
        event_id: 5,
        event_title: 'Python Workshop for Freshers',
        event_type: 'Workshop',
        organizer_id: 4,
        dept_id: 1,
        created_at: addHours(now, -64).toISOString(),
      },
    ],
    allocations: [
      {
        allocation_id: 1,
        room_id: 1,
        event_id: 1,
        alloc_date: today,
        slot_id: 1,
        status: 'Active',
        created_at: addHours(now, -60).toISOString(),
      },
      {
        allocation_id: 2,
        room_id: 3,
        event_id: 2,
        alloc_date: today,
        slot_id: 3,
        status: 'Active',
        created_at: addHours(now, -58).toISOString(),
      },
      {
        allocation_id: 3,
        room_id: 5,
        event_id: 3,
        alloc_date: inThreeDays,
        slot_id: 4,
        status: 'Active',
        created_at: addHours(now, -56).toISOString(),
      },
    ],
    requests: [
      {
        request_id: 1,
        requester_id: 3,
        event_id: 4,
        room_id: 5,
        request_date: inFiveDays,
        slot_id: 7,
        status: 'Pending',
        decided_by: null,
        remarks: '',
        created_at: requestOneCreatedAt,
        updated_at: requestOneCreatedAt,
      },
      {
        request_id: 2,
        requester_id: 4,
        event_id: 5,
        room_id: 1,
        request_date: inTwoDays,
        slot_id: 5,
        status: 'Pending',
        decided_by: null,
        remarks: '',
        created_at: requestTwoCreatedAt,
        updated_at: requestTwoCreatedAt,
      },
    ],
    approvalLogs: [
      {
        log_id: 1,
        request_id: 1,
        action: 'Submitted',
        action_by: 3,
        action_time: requestOneCreatedAt,
        comments: 'Room request created.',
      },
      {
        log_id: 2,
        request_id: 2,
        action: 'Submitted',
        action_by: 4,
        action_time: requestTwoCreatedAt,
        comments: 'Room request created.',
      },
    ],
  };
}

module.exports = { PASSWORD_HASH, createSeedData, toLocalIsoDate };
