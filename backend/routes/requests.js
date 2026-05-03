const express = require('express');
const router  = express.Router();

const {
  submitRequest, getMyRequests, getAllRequests,
  decideRequest, getApprovalLog,
} = require('../controllers/requestController');
const { authenticate, authorise } = require('../middleware/auth');

router.use(authenticate);

// Requester endpoints
router.post('/',     submitRequest);
router.get('/mine',  getMyRequests);

// Admin / Staff endpoints
router.get('/',      authorise('Admin', 'Staff'), getAllRequests);
router.get('/logs',  authorise('Admin', 'Staff'), getApprovalLog);
router.patch('/:request_id/decide', authorise('Admin', 'Staff'), decideRequest);

module.exports = router;
