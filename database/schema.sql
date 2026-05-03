CREATE DATABASE IF NOT EXISTS room_allocation_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE room_allocation_db;

CREATE TABLE IF NOT EXISTS DEPARTMENT (
    dept_id   INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ROOM (
    room_id   INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(20)  NOT NULL UNIQUE,
    building  VARCHAR(50)  NOT NULL,
    capacity  INT          NOT NULL,
    room_type ENUM('Classroom','Lab','Seminar Hall','Conference Room','Auditorium') NOT NULL,
    CONSTRAINT chk_capacity CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS TIME_SLOT (
    slot_id    INT AUTO_INCREMENT PRIMARY KEY,
    label      VARCHAR(30) NOT NULL,
    start_time TIME        NOT NULL,
    end_time   TIME        NOT NULL,
    CONSTRAINT chk_slot_time CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('Admin','Staff','Requester') NOT NULL DEFAULT 'Requester',
    dept_id       INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS CLASS_EVENT (
    event_id     INT AUTO_INCREMENT PRIMARY KEY,
    event_title  VARCHAR(150) NOT NULL,
    event_type   ENUM('Class','Exam','Society Event','Workshop','Seminar','Other') NOT NULL,
    organizer_id INT NOT NULL,
    dept_id      INT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES USER_ACCOUNT(user_id),
    FOREIGN KEY (dept_id)      REFERENCES DEPARTMENT(dept_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ROOM_REQUEST (
    request_id   INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT  NOT NULL,
    event_id     INT  NOT NULL,
    room_id      INT  NOT NULL,
    request_date DATE NOT NULL,
    slot_id      INT  NOT NULL,
    status       ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    decided_by   INT,
    remarks      TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES USER_ACCOUNT(user_id),
    FOREIGN KEY (event_id)     REFERENCES CLASS_EVENT(event_id),
    FOREIGN KEY (room_id)      REFERENCES ROOM(room_id),
    FOREIGN KEY (slot_id)      REFERENCES TIME_SLOT(slot_id),
    FOREIGN KEY (decided_by)   REFERENCES USER_ACCOUNT(user_id)
);

CREATE TABLE IF NOT EXISTS ROOM_ALLOCATION (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id       INT  NOT NULL,
    event_id      INT  NOT NULL,
    alloc_date    DATE NOT NULL,
    slot_id       INT  NOT NULL,
    status        ENUM('Active','Cancelled') NOT NULL DEFAULT 'Active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id)  REFERENCES ROOM(room_id),
    FOREIGN KEY (event_id) REFERENCES CLASS_EVENT(event_id),
    FOREIGN KEY (slot_id)  REFERENCES TIME_SLOT(slot_id)
);

CREATE TABLE IF NOT EXISTS APPROVAL_LOG (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    request_id  INT NOT NULL,
    action      ENUM('Submitted','Approved','Rejected','Cancelled') NOT NULL,
    action_by   INT NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments    TEXT,
    FOREIGN KEY (request_id) REFERENCES ROOM_REQUEST(request_id),
    FOREIGN KEY (action_by)  REFERENCES USER_ACCOUNT(user_id)
);
