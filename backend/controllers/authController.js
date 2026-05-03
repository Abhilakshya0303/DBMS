const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const dataService = require('../services/dataService');

const JWT_SECRET = process.env.JWT_SECRET || 'room-allocation-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ─── REGISTER ──────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { full_name, email, password, role, dept_id } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const allowedRoles = ['Admin', 'Staff', 'Requester'];
    const safeRole = allowedRoles.includes(role) ? role : 'Requester';
    const user = await dataService.createUser({
      full_name,
      email,
      password_hash: hash,
      role: safeRole,
      dept_id: dept_id || null,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user_id: user.user_id,
    });
  } catch (err) {
    if (err.code === 'DUPLICATE_EMAIL') {
      return res.status(409).json({ success: false, message: err.message });
    }
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await dataService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const payload = {
      user_id:   user.user_id,
      full_name: user.full_name,
      email:     user.email,
      role:      user.role,
      dept_id:   user.dept_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        user_id:   user.user_id,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role,
        dept_id:   user.dept_id,
        dept_name: user.dept_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── GET CURRENT USER ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await dataService.getUserById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
