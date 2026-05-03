USE room_allocation_db;

INSERT INTO DEPARTMENT (dept_name) VALUES
  ('Computer Science & Engineering'),
  ('Electronics & Communication Engineering'),
  ('Mechanical Engineering'),
  ('Civil Engineering'),
  ('Administration');

INSERT INTO ROOM (room_code, building, capacity, room_type) VALUES
  ('CS-101', 'CSE Block', 60,  'Classroom'),
  ('CS-102', 'CSE Block', 60,  'Classroom'),
  ('CS-LAB-1', 'CSE Block', 30, 'Lab'),
  ('CS-LAB-2', 'CSE Block', 30, 'Lab'),
  ('SH-101', 'Main Block', 200, 'Seminar Hall'),
  ('AUD-01', 'Central Block', 500, 'Auditorium'),
  ('EC-101', 'ECE Block', 60,  'Classroom'),
  ('ME-101', 'ME Block',  60,  'Classroom'),
  ('CONF-01', 'Admin Block', 20, 'Conference Room'),
  ('LIB-SEM', 'Library Block', 80, 'Seminar Hall');

INSERT INTO TIME_SLOT (label, start_time, end_time) VALUES
  ('Slot 1 (8:00-9:00)',   '08:00:00', '09:00:00'),
  ('Slot 2 (9:00-10:00)',  '09:00:00', '10:00:00'),
  ('Slot 3 (10:00-11:00)', '10:00:00', '11:00:00'),
  ('Slot 4 (11:00-12:00)', '11:00:00', '12:00:00'),
  ('Slot 5 (12:00-13:00)', '12:00:00', '13:00:00'),
  ('Slot 6 (13:00-14:00)', '13:00:00', '14:00:00'),
  ('Slot 7 (14:00-15:00)', '14:00:00', '15:00:00'),
  ('Slot 8 (15:00-16:00)', '15:00:00', '16:00:00'),
  ('Slot 9 (16:00-17:00)', '16:00:00', '17:00:00');

INSERT INTO USER_ACCOUNT (full_name, email, password_hash, role, dept_id) VALUES
  ('Admin User',    'admin@thapar.edu',
   '$2a$10$hF5eqwuc2S9NDAD0.vvF1uEvqlW1lH2FRd3yCeyUuV62D2nDiEb0q',
   'Admin', 5),
  ('Staff Member',  'staff@thapar.edu',
   '$2a$10$hF5eqwuc2S9NDAD0.vvF1uEvqlW1lH2FRd3yCeyUuV62D2nDiEb0q',
   'Staff', 2),
  ('Abhilakshya Puri', 'abhilakshya@thapar.edu',
   '$2a$10$hF5eqwuc2S9NDAD0.vvF1uEvqlW1lH2FRd3yCeyUuV62D2nDiEb0q',
   'Requester', 1),
  ('Aryan Gupta',   'aryan@thapar.edu',
   '$2a$10$hF5eqwuc2S9NDAD0.vvF1uEvqlW1lH2FRd3yCeyUuV62D2nDiEb0q',
   'Requester', 1);

INSERT INTO CLASS_EVENT (event_title, event_type, organizer_id, dept_id) VALUES
  ('Data Structures Lecture',        'Class',        2, 1),
  ('DBMS Lab Session',               'Class',        2, 1),
  ('Algorithms Mid-Semester Exam',   'Exam',         2, 1),
  ('IEEE Tech Fest Planning Meet',   'Society Event',3, 1),
  ('Python Workshop for Freshers',   'Workshop',     4, 1);

INSERT INTO ROOM_ALLOCATION (room_id, event_id, alloc_date, slot_id, status) VALUES
  (1, 1, CURDATE(), 1, 'Active'),
  (3, 2, CURDATE(), 3, 'Active'),
  (5, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 4, 'Active');

INSERT INTO ROOM_REQUEST (requester_id, event_id, room_id, request_date, slot_id, status) VALUES
  (3, 4, 5, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 7, 'Pending'),
  (4, 5, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 5, 'Pending');
