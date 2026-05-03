const express = require('express');
const router  = express.Router();

const {
  getAllRooms, getRoomById, checkAvailability,
  getDaySchedule, addRoom, getTimeSlots,
} = require('../controllers/roomController');
const { authenticate, authorise } = require('../middleware/auth');

// All room routes require authentication
router.use(authenticate);

router.get('/',              getAllRooms);
router.get('/slots',         getTimeSlots);
router.get('/availability',  checkAvailability);
router.get('/schedule',      getDaySchedule);
router.get('/:id',           getRoomById);

// Admin only
router.post('/', authorise('Admin'), addRoom);

module.exports = router;
