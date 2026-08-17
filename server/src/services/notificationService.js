const db = require('../db');

/**
 * Send notification to a user
 * Mocks SMS and Email transmission to the console, and inserts
 * a notification record into the PostgreSQL database for UI tracking.
 * 
 * @param {number} userId - Database ID of the user to receive notification
 * @param {string} message - Notification text content
 * @param {string} type - Notification channel: 'Email', 'SMS', 'In-App', 'Priority Alert', 'Schedule Update'
 * @returns {Promise<Object>} The inserted notification record
 */
const sendNotification = async (userId, message, type = 'In-App') => {
  try {
    // 1. Insert notification record in database
    const insertRes = await db.query(
      `INSERT INTO notifications (user_id, message, type, status) 
       VALUES ($1, $2, $3, 'Sent') 
       RETURNING *`,
      [userId, message, type]
    );

    const insertedNotification = insertRes.rows[0];

    // 2. Fetch recipient contact info to display mock dispatch in log
    const userRes = await db.query(
      'SELECT email, full_name, username FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      
      console.log(`\n============== [MOCK NOTIFICATION DISPATCH] ==============`);
      console.log(`Type:       ${type}`);
      console.log(`To:         ${user.full_name} (${user.username})`);
      console.log(`Message:    ${message}`);
      
      if (type === 'Email' || type === 'Priority Alert' || type === 'Schedule Update') {
        console.log(`Channel:    Email`);
        console.log(`SMTP Msg:   Sending email to <${user.email}>... SUCCESS`);
      }
      
      // Check if user is a judge to fetch phone number
      const judgeRes = await db.query(
        'SELECT contact_number FROM judges WHERE user_id = $1',
        [userId]
      );
      
      if (judgeRes.rows.length > 0 && (type === 'SMS' || type === 'Priority Alert' || type === 'Schedule Update')) {
        const phone = judgeRes.rows[0].contact_number || 'N/A';
        console.log(`Channel:    SMS Gateway`);
        console.log(`SMS Msg:    Sending SMS to +91-${phone}... SUCCESS`);
      }
      console.log(`==========================================================\n`);
    }

    return insertedNotification;
  } catch (error) {
    console.error('[Notification Service] Error sending notification:', error);
    // Suppress error so core business logic doesn't crash on failed notification
    return null;
  }
};

/**
 * Utility to notify all administrators
 */
const notifyAdmins = async (message, type = 'In-App') => {
  try {
    const adminRes = await db.query("SELECT id FROM users WHERE role = 'Administrator'");
    for (const admin of adminRes.rows) {
      await sendNotification(admin.id, message, type);
    }
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
};

module.exports = {
  sendNotification,
  notifyAdmins
};
