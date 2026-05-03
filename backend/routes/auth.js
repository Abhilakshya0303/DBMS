const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { authenticate }           = require('../middleware/auth');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

module.exports = router;
