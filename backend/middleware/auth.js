const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'room-allocation-dev-secret';

// ─── Verify JWT ────────────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ─── Role Guard factory ────────────────────────────────────────────────────────
// Usage: authorise('Admin', 'Staff')
const authorise = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${allowedRoles.join(', ')}.`,
    });
  }
  next();
};

module.exports = { authenticate, authorise };
