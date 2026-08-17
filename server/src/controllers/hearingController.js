const db = require('../db');
const schedulerService = require('../services/schedulerService');
const notificationService = require('../services/notificationService');

// Get all hearings with query filters
const getHearings = async (req, res, next) => {
  const { judge_id, status, date } = req.query;

  try {
    let queryText = `
      SELECT h.*, c.case_number, c.title as case_title, c.priority as case_priority, u.full_name as judge_name
      FROM hearings h
      JOIN cases c ON h.case_id = c.id
      JOIN judges j ON h.judge_id = j.id
      JOIN users u ON j.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (judge_id) {
      queryText += ` AND h.judge_id = $${paramIndex}`;
      params.push(parseInt(judge_id, 10));
      paramIndex++;
    }

    if (status) {
      queryText += ` AND h.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (date) {
      queryText += ` AND CAST(h.hearing_date AS DATE) = $${paramIndex}`;
      params.push(date); // YYYY-MM-DD
      paramIndex++;
    }

    // Sort by hearing date ascending (chronological list)
    queryText += ` ORDER BY h.hearing_date ASC`;

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Retrieve smart scheduling recommendations for a specific case
const getHearingRecommendations = async (req, res, next) => {
  const { case_id, judge_id, start_date } = req.query;

  try {
    if (!case_id || !judge_id) {
      res.status(400);
      return next(new Error('Please provide both case_id and judge_id parameters'));
    }

    const recommendations = await schedulerService.recommendHearingDates(
      parseInt(case_id, 10),
      parseInt(judge_id, 10),
      start_date
    );

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

// Schedule a new hearing
const createHearing = async (req, res, next) => {
  const { case_id, judge_id, hearing_date, courtroom, purpose, comments } = req.body;

  try {
    if (!case_id || !judge_id || !hearing_date || !courtroom) {
      res.status(400);
      return next(new Error('Please provide case_id, judge_id, hearing_date, and courtroom'));
    }

    // Check if the hearing date is a holiday
    const holidayCheck = await db.query(
      'SELECT description FROM court_holidays WHERE holiday_date = $1',
      [hearing_date.split(' ')[0]] // Extract YYYY-MM-DD
    );
    if (holidayCheck.rows.length > 0) {
      res.status(400);
      return next(new Error(`Cannot schedule hearing on a court holiday: ${holidayCheck.rows[0].description}`));
    }

    // Insert hearing
    const insertRes = await db.query(
      `INSERT INTO hearings (case_id, judge_id, hearing_date, courtroom, purpose, comments, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled') 
       RETURNING *`,
      [case_id, judge_id, hearing_date, courtroom, purpose, comments]
    );

    const newHearing = insertRes.rows[0];

    // Update case status to 'Hearing' if it was 'Pending'
    await db.query(
      "UPDATE cases SET status = 'Hearing' WHERE id = $1 AND status = 'Pending'",
      [case_id]
    );

    // Fetch case and judge info for notification message
    const caseRes = await db.query('SELECT case_number, title FROM cases WHERE id = $1', [case_id]);
    const judgeUserRes = await db.query(
      'SELECT user_id, u.full_name FROM judges j JOIN users u ON j.user_id = u.id WHERE j.id = $1',
      [judge_id]
    );

    const caseNum = caseRes.rows[0].case_number;
    const judgeName = judgeUserRes.rows[0].full_name;
    const formattedDate = new Date(hearing_date).toLocaleString();

    // Notify Judge
    await notificationService.sendNotification(
      judgeUserRes.rows[0].user_id,
      `Hearing scheduled: Case ${caseNum} scheduled for hearing on ${formattedDate} in ${courtroom}.`,
      'Schedule Update'
    );

    // Audit trail logging
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [
        req.user.id,
        'Schedule Hearing',
        `Scheduled hearing ID ${newHearing.id} for case ${caseNum} under Hon'ble Judge ${judgeName} for date ${formattedDate}`
      ]
    );

    res.status(201).json(newHearing);
  } catch (error) {
    next(error);
  }
};

// Reschedule or update an existing hearing
const updateHearing = async (req, res, next) => {
  const hearingId = req.params.id;
  const { hearing_date, courtroom, status, purpose, comments } = req.body;

  try {
    const checkRes = await db.query(
      `SELECT h.*, c.case_number, c.title as case_title, j.user_id as judge_user_id
       FROM hearings h 
       JOIN cases c ON h.case_id = c.id
       JOIN judges j ON h.judge_id = j.id
       WHERE h.id = $1`,
      [hearingId]
    );

    if (checkRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Hearing record not found'));
    }

    const currentHearing = checkRes.rows[0];

    // If date changed, verify holiday
    if (hearing_date && hearing_date !== currentHearing.hearing_date.toISOString()) {
      const holidayCheck = await db.query(
        'SELECT description FROM court_holidays WHERE holiday_date = $1',
        [hearing_date.split(' ')[0]]
      );
      if (holidayCheck.rows.length > 0) {
        res.status(400);
        return next(new Error(`Cannot reschedule: ${hearing_date.split(' ')[0]} is a court holiday (${holidayCheck.rows[0].description})`));
      }
    }

    // Update hearing
    const updateRes = await db.query(
      `UPDATE hearings 
       SET hearing_date = $1, courtroom = $2, status = $3, purpose = $4, comments = $5
       WHERE id = $6
       RETURNING *`,
      [
        hearing_date || currentHearing.hearing_date,
        courtroom || currentHearing.courtroom,
        status || currentHearing.status,
        purpose || currentHearing.purpose,
        comments || currentHearing.comments,
        hearingId
      ]
    );

    const updatedHearing = updateRes.rows[0];
    const isRescheduled = status === 'Rescheduled' || (hearing_date && hearing_date !== currentHearing.hearing_date.toISOString());

    // Auto-sync case status when hearing status changes
    if (status === 'Completed') {
      // Check if all hearings for this case are completed
      const remainingRes = await db.query(
        "SELECT COUNT(*) FROM hearings WHERE case_id = $1 AND status IN ('Scheduled', 'Rescheduled')",
        [currentHearing.case_id]
      );
      const remainingCount = parseInt(remainingRes.rows[0].count, 10);
      if (remainingCount === 0) {
        await db.query("UPDATE cases SET status = 'Disposed' WHERE id = $1", [currentHearing.case_id]);
      }
    } else if (status === 'Scheduled' || status === 'Rescheduled') {
      await db.query("UPDATE cases SET status = 'Hearing' WHERE id = $1", [currentHearing.case_id]);
    } else if (status === 'Cancelled') {
      const remainingRes = await db.query(
        "SELECT COUNT(*) FROM hearings WHERE case_id = $1 AND status IN ('Scheduled', 'Rescheduled')",
        [currentHearing.case_id]
      );
      const remainingCount = parseInt(remainingRes.rows[0].count, 10);
      if (remainingCount === 0) {
        await db.query("UPDATE cases SET status = 'Pending' WHERE id = $1", [currentHearing.case_id]);
      }
    }

    // Notify judge
    const dateText = new Date(updatedHearing.hearing_date).toLocaleString();
    const actionType = isRescheduled ? 'Rescheduled' : 'Updated';
    
    await notificationService.sendNotification(
      currentHearing.judge_user_id,
      `Hearing ${actionType}: Case ${currentHearing.case_number} hearing has been updated to ${dateText} in ${updatedHearing.courtroom}. Status: ${updatedHearing.status}`,
      'Schedule Update'
    );

    // Audit logs
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [
        req.user.id,
        isRescheduled ? 'Reschedule Hearing' : 'Update Hearing',
        `Hearing ID ${hearingId} for case ${currentHearing.case_number} was marked as ${updatedHearing.status} on date ${dateText}`
      ]
    );

    res.json(updatedHearing);
  } catch (error) {
    next(error);
  }
};

// Delete / Cancel hearing
const deleteHearing = async (req, res, next) => {
  const hearingId = req.params.id;

  try {
    const checkRes = await db.query(
      'SELECT h.*, c.case_number FROM hearings h JOIN cases c ON h.case_id = c.id WHERE h.id = $1',
      [hearingId]
    );
    if (checkRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Hearing record not found'));
    }

    const hearingData = checkRes.rows[0];

    await db.query('DELETE FROM hearings WHERE id = $1', [hearingId]);

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'Cancel Hearing', `Cancelled and deleted hearing ID ${hearingId} for case ${hearingData.case_number}`]
    );

    res.json({ message: 'Hearing cancelled and deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHearings,
  getHearingRecommendations,
  createHearing,
  updateHearing,
  deleteHearing
};
