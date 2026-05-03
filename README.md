# 🏫 Room Allocation & Scheduling Management System
### Thapar Institute of Engineering & Technology — UCS310 DBMS Project

A full-stack web application for managing room allocations, class schedules, and booking requests with role-based access control.

---

## 📁 Project Structure

```
room-allocation-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Login, register, me
│   │   ├── roomController.js      # Room CRUD + availability
│   │   ├── requestController.js   # Submit, approve, reject
│   │   └── adminController.js     # Stats, users, reports
│   ├── middleware/
│   │   └── auth.js                # JWT verify + role guard
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   ├── requests.js
│   │   └── admin.js
│   ├── .env.example               # Copy to .env and fill values
│   ├── package.json
│   └── server.js                  # Express entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   └── ProtectedRoute.jsx # Auth + role guards
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global user state
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login + Register
│   │   │   ├── Dashboard.jsx      # Stats + today's schedule
│   │   │   ├── RoomAvailability.jsx  # Full grid view
│   │   │   ├── RequestRoom.jsx    # Submit booking request
│   │   │   ├── MyRequests.jsx     # Requester's request history
│   │   │   ├── AdminPanel.jsx     # Approve / Reject panel
│   │   │   ├── Rooms.jsx          # Room listing + add room
│   │   │   └── AdminPages.jsx     # Users list + Utilisation
│   │   ├── styles/
│   │   │   └── global.css         # All styles
│   │   ├── App.jsx                # Router + all routes
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── schema.sql                  # CREATE TABLE statements
│   ├── procedures_triggers.sql     # Triggers, procedures, function
│   └── seed.sql                    # Sample data
│
├── API_DOCS.txt                    # Postman-style API examples
└── README.md
```

---

## ⚙️ Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, React Router 6, Vite      |
| Backend  | Node.js 18+, Express 4              |
| Database | MySQL 8.0                           |
| Auth     | JWT (jsonwebtoken) + bcryptjs       |
| Styling  | Pure CSS (no framework required)    |

---

## 🗄️ Database Design

### Tables
| Table           | Purpose                                   |
|-----------------|-------------------------------------------|
| DEPARTMENT      | Academic departments                      |
| ROOM            | Room master data                          |
| TIME_SLOT       | Predefined time slots (8 AM – 5 PM)       |
| USER_ACCOUNT    | Users with roles (Admin, Staff, Requester)|
| CLASS_EVENT     | Events / classes to be allocated          |
| ROOM_REQUEST    | Booking requests (Pending/Approved/Rejected) |
| ROOM_ALLOCATION | Confirmed allocations                     |
| APPROVAL_LOG    | Immutable audit trail of all decisions    |

### Key DB Objects
- **fn_is_room_available** — SQL FUNCTION to check slot availability
- **trg_prevent_double_booking** — TRIGGER: blocks concurrent double bookings at DB level
- **trg_log_request_submit** — TRIGGER: auto-logs every new request
- **trg_log_request_update** — TRIGGER: auto-logs every approval/rejection
- **sp_submit_request** — PROCEDURE: creates event + request in one transaction
- **sp_decide_request** — PROCEDURE: approve/reject with row-level lock + allocation insert

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8.0
- npm 9+

### Quick Start (Project-Local MySQL)

The app is configured to use a project-local MySQL instance on `127.0.0.1:3307`.
If that instance is not running, start it first:

```powershell
powershell -ExecutionPolicy Bypass -File backend\start-local-mysql.ps1
```

```bash
cd backend
npm install
npm start

cd ../frontend
npm install
npm run dev
```

The original SQL deliverables are still available in `database/` as part of the DBMS project submission.

---

### Step 1 — Set Up the Database

Project-local database credentials used by this repo:

```text
Host: 127.0.0.1
Port: 3307
User: room_app
Password: RoomApp!2026
Database: room_allocation_db
```

```bash
# Log into MySQL
mysql -u root -p

# Run all three SQL files in order:
source /path/to/room-allocation-system/database/schema.sql
source /path/to/room-allocation-system/database/procedures_triggers.sql
source /path/to/room-allocation-system/database/seed.sql
```

OR run them as a pipeline:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p room_allocation_db < database/procedures_triggers.sql
mysql -u root -p room_allocation_db < database/seed.sql
```

---

### Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=room_app
DB_PASSWORD=RoomApp!2026
DB_NAME=room_allocation_db
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://127.0.0.1:5173
```

---

### Step 3 — Install & Run Backend

```bash
cd backend
npm install
npm run dev       # development (nodemon, auto-restart)
# OR
npm start         # production
```

The backend will start on: **http://localhost:5000**

Verify: `curl http://localhost:5000/api/health`

---

### Step 4 — Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on: **http://localhost:5173**

---

### Step 5 — Open in Browser

Navigate to: **http://localhost:5173**

**Demo Login Credentials:**

| Role       | Email                    | Password    |
|------------|--------------------------|-------------|
| 🔴 Admin   | admin@thapar.edu         | password123 |
| 🟡 Staff   | staff@thapar.edu        | password123 |
| 🟢 Requester | aryan@thapar.edu       | password123 |

---

## 👥 Role Capabilities

| Feature                    | Admin | Staff | Requester |
|----------------------------|:-----:|:-----:|:---------:|
| View dashboard stats        | ✅    | ✅    | ✅        |
| View all rooms              | ✅    | ✅    | ✅        |
| Check availability grid     | ✅    | ✅    | ✅        |
| Submit room request         | ✅    | ✅    | ✅        |
| View own requests           | ✅    | ✅    | ✅        |
| Approve / Reject requests   | ✅    | ✅    | ❌        |
| View all requests           | ✅    | ✅    | ❌        |
| Add new rooms               | ✅    | ❌    | ❌        |
| Manage users                | ✅    | ❌    | ❌        |
| View utilisation report     | ✅    | ✅    | ❌        |

---

## 🔐 Business Rules Enforced

1. **No Double Booking** — enforced at BOTH backend (fn_is_room_available) AND database (trg_prevent_double_booking trigger). Even concurrent requests cannot create a conflict due to row-level locking in sp_decide_request.

2. **Availability Check Before Request** — the frontend checks availability live as the user selects room/date/slot. The submit button is disabled if the room is busy.

3. **Approval Workflow** — requests go: Submitted → Pending → Approved/Rejected. Only Admin and Staff can decide.

4. **Immutable Audit Log** — every state change is recorded in APPROVAL_LOG via database triggers. Cannot be modified via the API.

5. **Role-Based Access** — JWT tokens carry the user's role. Every API route checks the role server-side. Frontend routes also redirect unauthorized users.

6. **Transaction Safety** — sp_submit_request and sp_decide_request use START TRANSACTION / COMMIT / ROLLBACK. Failures are fully rolled back.

---

## 🧪 Running SQL Manually to Test Triggers/Procedures

```sql
USE room_allocation_db;

-- Test availability function
SELECT fn_is_room_available(1, CURDATE(), 1) AS is_free;  -- Should return 0 (seeded as busy)
SELECT fn_is_room_available(1, CURDATE(), 2) AS is_free;  -- Should return 1 (free)

-- Test submit procedure
CALL sp_submit_request(3, 'Test Event', 'Workshop', 1, 2, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 5, @rid, @msg);
SELECT @rid AS request_id, @msg AS message;

-- Test approval procedure
CALL sp_decide_request(@rid, 2, 'Approved', 'Looks good', @msg);
SELECT @msg;

-- Test double-booking prevention (should raise error)
INSERT INTO ROOM_ALLOCATION (room_id, event_id, alloc_date, slot_id)
VALUES (1, 1, CURDATE(), 1);  -- triggers 45000: CONFLICT error

-- View audit log
SELECT * FROM APPROVAL_LOG ORDER BY action_time DESC;
```

---

## 📝 API Quick Reference

| Method | Endpoint                          | Auth   | Role        |
|--------|-----------------------------------|--------|-------------|
| POST   | /api/auth/login                   | —      | —           |
| POST   | /api/auth/register                | —      | —           |
| GET    | /api/auth/me                      | JWT    | Any         |
| GET    | /api/rooms                        | JWT    | Any         |
| GET    | /api/rooms/slots                  | JWT    | Any         |
| GET    | /api/rooms/availability           | JWT    | Any         |
| GET    | /api/rooms/schedule               | JWT    | Any         |
| POST   | /api/rooms                        | JWT    | Admin       |
| POST   | /api/requests                     | JWT    | Any         |
| GET    | /api/requests/mine                | JWT    | Any         |
| GET    | /api/requests                     | JWT    | Admin/Staff |
| GET    | /api/requests/logs                | JWT    | Admin/Staff |
| PATCH  | /api/requests/:id/decide          | JWT    | Admin/Staff |
| GET    | /api/admin/dashboard              | JWT    | Admin/Staff |
| GET    | /api/admin/users                  | JWT    | Admin       |
| GET    | /api/admin/departments            | JWT    | Any         |
| GET    | /api/admin/utilisation            | JWT    | Admin/Staff |

Full Postman-style examples are in `API_DOCS.txt`.
