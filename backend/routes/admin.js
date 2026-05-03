const express = require('express');
const router  = express.Router();

const {
  getDashboardStats, getAllUsers, getDepartments, getUtilisationReport,
} = require('../controllers/adminController');
const { authenticate, authorise } = require('../middleware/auth');

router.get('/departments', getDepartments);

router.use(authenticate);

router.get('/dashboard',   getDashboardStats);
router.get('/users',       authorise('Admin'),           getAllUsers);
router.get('/utilisation', authorise('Admin', 'Staff'), getUtilisationReport);

module.exports = router;
