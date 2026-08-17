const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'sih_2025_court_system_jwt_secret_key_998877', 
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Login user
const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      res.status(400);
      return next(new Error('Please provide username and password'));
    }

    // Find user
    const userRes = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userRes.rows[0];

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      // Fetch judge info if user is a judge
      let judgeId = null;
      if (user.role === 'Judge') {
        const judgeRes = await db.query('SELECT id FROM judges WHERE user_id = $1', [user.id]);
        if (judgeRes.rows.length > 0) {
          judgeId = judgeRes.rows[0].id;
        }
      }

      // Log in audit logs
      await db.query(
        'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [user.id, 'User Login', `Logged in successfully from IP: ${req.ip}`]
      );

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        judgeId,
        token: generateToken(user.id)
      });
    } else {
      res.status(401);
      next(new Error('Invalid username or password'));
    }
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

// Get list of all judges in system (for case assignments)
const getJudgesList = async (req, res, next) => {
  try {
    const queryText = `
      SELECT j.id as judge_id, u.full_name, j.specialization, j.courtroom, j.status
      FROM judges j
      JOIN users u ON j.user_id = u.id
      ORDER BY u.full_name ASC
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Reset Password (simple mock for demo)
const resetPassword = async (req, res, next) => {
  const { username, email, newPassword } = req.body;

  try {
    if (!username || !email || !newPassword) {
      res.status(400);
      return next(new Error('Please fill all password reset details'));
    }

    const userRes = await db.query(
      'SELECT id FROM users WHERE username = $1 AND email = $2',
      [username, email]
    );

    if (userRes.rows.length === 0) {
      res.status(404);
      return next(new Error('No matching user account found'));
    }

    const userId = userRes.rows[0].id;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'Password Reset', 'Password changed via reset form']
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getProfile,
  getJudgesList,
  resetPassword
};
