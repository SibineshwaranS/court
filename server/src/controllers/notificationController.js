const db = require('../db');

// Get notifications for logged-in user
const getNotifications = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
  const notificationId = req.params.id;

  try {
    const checkRes = await db.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, req.user.id]
    );

    if (checkRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Notification not found or unauthorized'));
    }

    const updateRes = await db.query(
      `UPDATE notifications 
       SET status = 'Read' 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, req.user.id]
    );

    res.json(updateRes.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
