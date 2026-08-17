const jwt = require('jsonwebtoken');
const db = require('../db');

// Middleware to verify JWT token and authenticate user
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from Bearer <token>
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sih_2025_court_system_jwt_secret_key_998877');

      // Get user from database (excluding password hash)
      const userRes = await db.query(
        'SELECT id, username, email, role, full_name FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({ message: 'User not found in system' });
      }

      req.user = userRes.rows[0];

      // If user is a Judge, retrieve their judge_id
      if (req.user.role === 'Judge') {
        const judgeRes = await db.query(
          'SELECT id FROM judges WHERE user_id = $1',
          [req.user.id]
        );
        if (judgeRes.rows.length > 0) {
          req.user.judgeId = judgeRes.rows[0].id;
        }
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware to authorize user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Role '${req.user ? req.user.role : 'Guest'}' is not authorized for this resource`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
