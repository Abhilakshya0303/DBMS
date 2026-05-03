USE room_allocation_db;

DROP VIEW IF EXISTS vw_room_utilization;
DROP VIEW IF EXISTS vw_pending_requests;
DROP VIEW IF EXISTS vw_daily_schedule;
DROP TRIGGER IF EXISTS trg_prevent_double_booking;
DROP TRIGGER IF EXISTS trg_log_request_submit;
DROP TRIGGER IF EXISTS trg_log_request_update;
DROP PROCEDURE IF EXISTS sp_pending_request_cursor_report;
DROP PROCEDURE IF EXISTS sp_room_utilization_cursor_report;
DROP PROCEDURE IF EXISTS sp_submit_request;
DROP PROCEDURE IF EXISTS sp_decide_request;
DROP FUNCTION  IF EXISTS fn_room_utilization_count;
DROP FUNCTION  IF EXISTS fn_is_room_available;

DELIMITER $$

CREATE FUNCTION fn_is_room_available(
    p_room_id  INT,
    p_date     DATE,
    p_slot_id  INT
)
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_count
    FROM   ROOM_ALLOCATION
    WHERE  room_id    = p_room_id
      AND  alloc_date = p_date
      AND  slot_id    = p_slot_id
      AND  status     = 'Active';

    RETURN (v_count = 0);
END$$

CREATE FUNCTION fn_room_utilization_count(
    p_room_id   INT,
    p_from_date DATE,
    p_to_date   DATE
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT DEFAULT 0;

    IF p_from_date IS NULL OR p_to_date IS NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM   ROOM_ALLOCATION
        WHERE  room_id = p_room_id
          AND  status  = 'Active';
    ELSE
        SELECT COUNT(*) INTO v_count
        FROM   ROOM_ALLOCATION
        WHERE  room_id = p_room_id
          AND  status  = 'Active'
          AND  alloc_date BETWEEN p_from_date AND p_to_date;
    END IF;

    RETURN v_count;
END$$

CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT ON ROOM_ALLOCATION
FOR EACH ROW
BEGIN
    DECLARE v_conflict INT DEFAULT 0;

    SELECT COUNT(*) INTO v_conflict
    FROM   ROOM_ALLOCATION
    WHERE  room_id    = NEW.room_id
      AND  alloc_date = NEW.alloc_date
      AND  slot_id    = NEW.slot_id
      AND  status     = 'Active';

    IF v_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'CONFLICT: Room is already allocated for this date and time slot.';
    END IF;
END$$

CREATE TRIGGER trg_log_request_submit
AFTER INSERT ON ROOM_REQUEST
FOR EACH ROW
BEGIN
    INSERT INTO APPROVAL_LOG (request_id, action, action_by, comments)
    VALUES (NEW.request_id, 'Submitted', NEW.requester_id, 'Room request created.');
END$$

CREATE TRIGGER trg_log_request_update
AFTER UPDATE ON ROOM_REQUEST
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status AND NEW.decided_by IS NOT NULL THEN
        INSERT INTO APPROVAL_LOG (request_id, action, action_by, comments)
        VALUES (
            NEW.request_id,
            NEW.status,
            NEW.decided_by,
            IFNULL(NEW.remarks, '')
        );
    END IF;
END$$

CREATE PROCEDURE sp_submit_request(
    IN  p_requester_id  INT,
    IN  p_event_title   VARCHAR(150),
    IN  p_event_type    VARCHAR(50),
    IN  p_dept_id       INT,
    IN  p_room_id       INT,
    IN  p_request_date  DATE,
    IN  p_slot_id       INT,
    OUT p_request_id    INT,
    OUT p_message       VARCHAR(255)
)
BEGIN
    DECLARE v_event_id  INT;
    DECLARE v_available TINYINT(1);
    DECLARE v_exists    INT DEFAULT 0;
    DECLARE v_duplicate INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_request_id = -1;
        SET p_message    = 'Unexpected error. Request rolled back.';
    END;

    SET p_request_id = NULL;
    SET p_message = NULL;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_exists
    FROM USER_ACCOUNT
    WHERE user_id = p_requester_id;

    IF v_exists = 0 THEN
        ROLLBACK;
        SET p_request_id = -1;
        SET p_message    = 'Invalid requester.';
    ELSE
        SELECT COUNT(*) INTO v_exists
        FROM ROOM
        WHERE room_id = p_room_id;
    END IF;

    IF p_request_id IS NULL AND v_exists = 0 THEN
        ROLLBACK;
        SET p_request_id = -1;
        SET p_message    = 'Invalid room.';
    ELSEIF p_request_id IS NULL THEN
        SELECT COUNT(*) INTO v_exists
        FROM TIME_SLOT
        WHERE slot_id = p_slot_id;
    END IF;

    IF p_request_id IS NULL AND v_exists = 0 THEN
        ROLLBACK;
        SET p_request_id = -1;
        SET p_message    = 'Invalid time slot.';
    ELSEIF p_request_id IS NULL AND p_dept_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_exists
        FROM DEPARTMENT
        WHERE dept_id = p_dept_id;
    END IF;

    IF p_request_id IS NULL AND p_dept_id IS NOT NULL AND v_exists = 0 THEN
        ROLLBACK;
        SET p_request_id = -1;
        SET p_message    = 'Invalid department.';
    ELSEIF p_request_id IS NULL THEN
        SELECT COUNT(*) INTO v_duplicate
        FROM   ROOM_REQUEST rr
        JOIN   CLASS_EVENT ce ON ce.event_id = rr.event_id
        WHERE  rr.requester_id = p_requester_id
          AND  rr.room_id      = p_room_id
          AND  rr.request_date = p_request_date
          AND  rr.slot_id      = p_slot_id
          AND  rr.status       = 'Pending'
          AND  ce.event_title  = p_event_title;
    END IF;

    IF p_request_id IS NULL AND v_duplicate > 0 THEN
        ROLLBACK;
        SET p_request_id = -1;
        SET p_message    = 'Duplicate pending request already exists.';
    ELSEIF p_request_id IS NULL THEN
        SET v_available = fn_is_room_available(p_room_id, p_request_date, p_slot_id);
    END IF;

    IF p_request_id IS NULL AND v_available = 0 THEN
        ROLLBACK;
        SET p_request_id = -1;
        SET p_message    = 'Room is already booked for the selected date and slot.';
    ELSEIF p_request_id IS NULL THEN
        INSERT INTO CLASS_EVENT (event_title, event_type, organizer_id, dept_id)
        VALUES (p_event_title, p_event_type, p_requester_id, p_dept_id);
        SET v_event_id = LAST_INSERT_ID();

        INSERT INTO ROOM_REQUEST
               (requester_id, event_id, room_id, request_date, slot_id, status)
        VALUES (p_requester_id, v_event_id, p_room_id, p_request_date, p_slot_id, 'Pending');
        SET p_request_id = LAST_INSERT_ID();

        COMMIT;
        SET p_message = 'Request submitted successfully.';
    END IF;
END$$

CREATE PROCEDURE sp_decide_request(
    IN  p_request_id  INT,
    IN  p_decided_by  INT,
    IN  p_decision    VARCHAR(20),
    IN  p_remarks     TEXT,
    OUT p_message     VARCHAR(255)
)
BEGIN
    DECLARE v_room_id   INT;
    DECLARE v_event_id  INT;
    DECLARE v_date      DATE;
    DECLARE v_slot_id   INT;
    DECLARE v_status    VARCHAR(20);
    DECLARE v_not_found TINYINT DEFAULT 0;
    DECLARE v_decider_count INT DEFAULT 0;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
    BEGIN
        SET v_not_found = 1;
    END;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'Error while processing decision. Rolled back.';
    END;

    START TRANSACTION;

    SELECT room_id, event_id, request_date, slot_id, status
    INTO   v_room_id, v_event_id, v_date, v_slot_id, v_status
    FROM   ROOM_REQUEST
    WHERE  request_id = p_request_id
    FOR UPDATE;

    IF v_not_found = 1 THEN
        ROLLBACK;
        SET p_message = 'Invalid request.';
    ELSEIF p_decision NOT IN ('Approved', 'Rejected') THEN
        ROLLBACK;
        SET p_message = 'Invalid decision.';
    ELSE
        SELECT COUNT(*) INTO v_decider_count
        FROM USER_ACCOUNT
        WHERE user_id = p_decided_by
          AND role IN ('Admin', 'Staff');
    END IF;

    IF v_not_found = 0 AND p_decision IN ('Approved', 'Rejected') AND v_decider_count = 0 THEN
        ROLLBACK;
        SET p_message = 'Invalid approver.';
    ELSEIF v_not_found = 0 AND p_decision IN ('Approved', 'Rejected') AND v_status <> 'Pending' THEN
        ROLLBACK;
        SET p_message = 'Request has already been decided.';
    ELSEIF v_not_found = 0 AND p_decision IN ('Approved', 'Rejected') THEN
        UPDATE ROOM_REQUEST
        SET    status     = p_decision,
               decided_by = p_decided_by,
               remarks    = p_remarks
        WHERE  request_id = p_request_id;

        IF p_decision = 'Approved' THEN
            INSERT INTO ROOM_ALLOCATION (room_id, event_id, alloc_date, slot_id, status)
            VALUES (v_room_id, v_event_id, v_date, v_slot_id, 'Active');
        END IF;

        COMMIT;
        SET p_message = CONCAT('Request ', p_decision, ' successfully.');
    END IF;
END$$

CREATE PROCEDURE sp_pending_request_cursor_report()
BEGIN
    DECLARE v_done TINYINT DEFAULT 0;
    DECLARE v_request_id INT;
    DECLARE v_event_title VARCHAR(150);
    DECLARE v_room_code VARCHAR(20);
    DECLARE v_request_date DATE;
    DECLARE v_slot_label VARCHAR(30);
    DECLARE v_requester_name VARCHAR(100);
    DECLARE v_created_at TIMESTAMP;

    DECLARE cur_pending CURSOR FOR
        SELECT rr.request_id,
               ce.event_title,
               r.room_code,
               rr.request_date,
               ts.label,
               ua.full_name,
               rr.created_at
        FROM   ROOM_REQUEST rr
        JOIN   CLASS_EVENT ce ON ce.event_id = rr.event_id
        JOIN   ROOM r ON r.room_id = rr.room_id
        JOIN   TIME_SLOT ts ON ts.slot_id = rr.slot_id
        JOIN   USER_ACCOUNT ua ON ua.user_id = rr.requester_id
        WHERE  rr.status = 'Pending'
        ORDER BY rr.created_at, rr.request_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DROP TEMPORARY TABLE IF EXISTS tmp_pending_request_report;
    CREATE TEMPORARY TABLE tmp_pending_request_report (
        request_id     INT,
        event_title    VARCHAR(150),
        room_code      VARCHAR(20),
        request_date   DATE,
        slot_label     VARCHAR(30),
        requester_name VARCHAR(100),
        created_at     TIMESTAMP
    );

    OPEN cur_pending;

    read_loop: LOOP
        FETCH cur_pending
        INTO v_request_id,
             v_event_title,
             v_room_code,
             v_request_date,
             v_slot_label,
             v_requester_name,
             v_created_at;

        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        INSERT INTO tmp_pending_request_report
        VALUES (
            v_request_id,
            v_event_title,
            v_room_code,
            v_request_date,
            v_slot_label,
            v_requester_name,
            v_created_at
        );
    END LOOP;

    CLOSE cur_pending;

    SELECT *
    FROM tmp_pending_request_report
    ORDER BY created_at, request_id;
END$$

CREATE PROCEDURE sp_room_utilization_cursor_report(
    IN p_from_date DATE,
    IN p_to_date   DATE
)
BEGIN
    DECLARE v_done TINYINT DEFAULT 0;
    DECLARE v_room_id INT;
    DECLARE v_room_code VARCHAR(20);
    DECLARE v_building VARCHAR(50);
    DECLARE v_capacity INT;
    DECLARE v_room_type VARCHAR(30);
    DECLARE v_total_bookings INT;

    DECLARE cur_rooms CURSOR FOR
        SELECT room_id, room_code, building, capacity, room_type
        FROM ROOM
        ORDER BY room_code;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DROP TEMPORARY TABLE IF EXISTS tmp_room_utilization_report;
    CREATE TEMPORARY TABLE tmp_room_utilization_report (
        room_id        INT,
        room_code      VARCHAR(20),
        building       VARCHAR(50),
        capacity       INT,
        room_type      VARCHAR(30),
        total_bookings INT
    );

    OPEN cur_rooms;

    read_loop: LOOP
        FETCH cur_rooms
        INTO v_room_id,
             v_room_code,
             v_building,
             v_capacity,
             v_room_type;

        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_total_bookings = fn_room_utilization_count(v_room_id, p_from_date, p_to_date);

        INSERT INTO tmp_room_utilization_report
        VALUES (
            v_room_id,
            v_room_code,
            v_building,
            v_capacity,
            v_room_type,
            v_total_bookings
        );
    END LOOP;

    CLOSE cur_rooms;

    SELECT *
    FROM tmp_room_utilization_report
    ORDER BY total_bookings DESC, room_code;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW vw_daily_schedule AS
SELECT ra.allocation_id,
       ra.alloc_date,
       ts.slot_id,
       ts.label AS slot_label,
       ts.start_time,
       ts.end_time,
       r.room_id,
       r.room_code,
       r.building,
       r.capacity,
       r.room_type,
       ce.event_id,
       ce.event_title,
       ce.event_type,
       ua.user_id AS organizer_id,
       ua.full_name AS organizer_name,
       ra.status
FROM   ROOM_ALLOCATION ra
JOIN   ROOM r ON r.room_id = ra.room_id
JOIN   TIME_SLOT ts ON ts.slot_id = ra.slot_id
JOIN   CLASS_EVENT ce ON ce.event_id = ra.event_id
JOIN   USER_ACCOUNT ua ON ua.user_id = ce.organizer_id;

CREATE OR REPLACE VIEW vw_pending_requests AS
SELECT rr.request_id,
       rr.requester_id,
       req.full_name AS requester_name,
       req.role AS requester_role,
       rr.event_id,
       ce.event_title,
       ce.event_type,
       rr.room_id,
       r.room_code,
       r.building,
       r.capacity,
       r.room_type,
       rr.request_date,
       rr.slot_id,
       ts.label AS slot_label,
       rr.status,
       rr.remarks,
       rr.created_at
FROM   ROOM_REQUEST rr
JOIN   CLASS_EVENT ce ON ce.event_id = rr.event_id
JOIN   ROOM r ON r.room_id = rr.room_id
JOIN   TIME_SLOT ts ON ts.slot_id = rr.slot_id
JOIN   USER_ACCOUNT req ON req.user_id = rr.requester_id
WHERE  rr.status = 'Pending';

CREATE OR REPLACE VIEW vw_room_utilization AS
SELECT r.room_id,
       r.room_code,
       r.building,
       r.capacity,
       r.room_type,
       fn_room_utilization_count(r.room_id, NULL, NULL) AS total_bookings,
       fn_room_utilization_count(r.room_id, DATE_SUB(CURDATE(), INTERVAL 30 DAY), CURDATE()) AS bookings_last_30_days
FROM   ROOM r;
