const db = require('../db');
const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');

// Get all cases with sorting, search, filter and pagination
const getCases = async (req, res, next) => {
  const { 
    search = '', 
    status = '', 
    priority = '', 
    case_type = '', 
    judge_id = '', 
    page = 1, 
    limit = 10 
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let queryText = `
      SELECT c.*, u.full_name as judge_name 
      FROM cases c
      LEFT JOIN judges j ON c.judge_id = j.id
      LEFT JOIN users u ON j.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Search query (case number or title)
    if (search) {
      queryText += ` AND (c.case_number ILIKE $${paramIndex} OR c.title ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Status filter
    if (status) {
      queryText += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Priority filter
    if (priority) {
      queryText += ` AND c.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    // Case type filter
    if (case_type) {
      queryText += ` AND c.case_type = $${paramIndex}`;
      params.push(case_type);
      paramIndex++;
    }

    // Judge filter (useful for judge specific dashboard views)
    if (judge_id) {
      queryText += ` AND c.judge_id = $${paramIndex}`;
      params.push(parseInt(judge_id, 10));
      paramIndex++;
    }

    // Sorting: High priority first, then filing date descending
    queryText += ` ORDER BY CASE 
      WHEN c.priority = 'High' THEN 1 
      WHEN c.priority = 'Medium' THEN 2 
      ELSE 3 END ASC, c.filing_date DESC`;

    // Add pagination
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const result = await db.query(queryText, params);

    // Get total count for pagination metadata
    let countQuery = `
      SELECT COUNT(*) 
      FROM cases c
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (c.case_number ILIKE $${countParamIndex} OR c.title ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (status) {
      countQuery += ` AND c.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (priority) {
      countQuery += ` AND c.priority = $${countParamIndex}`;
      countParams.push(priority);
      countParamIndex++;
    }
    if (case_type) {
      countQuery += ` AND c.case_type = $${countParamIndex}`;
      countParams.push(case_type);
      countParamIndex++;
    }
    if (judge_id) {
      countQuery += ` AND c.judge_id = $${countParamIndex}`;
      countParams.push(parseInt(judge_id, 10));
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    res.json({
      cases: result.rows,
      meta: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single case by ID with full relations
const getCaseById = async (req, res, next) => {
  const caseId = req.params.id;

  try {
    // 1. Fetch case details
    const caseRes = await db.query(
      `SELECT c.*, u.full_name as judge_name, u.email as judge_email, j.courtroom as judge_courtroom
       FROM cases c
       LEFT JOIN judges j ON c.judge_id = j.id
       LEFT JOIN users u ON j.user_id = u.id
       WHERE c.id = $1`,
      [caseId]
    );

    if (caseRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Case not found'));
    }

    const caseData = caseRes.rows[0];

    // 2. Fetch hearings history for this case
    const hearingsRes = await db.query(
      `SELECT h.*, u.full_name as judge_name 
       FROM hearings h
       JOIN judges j ON h.judge_id = j.id
       JOIN users u ON j.user_id = u.id
       WHERE h.case_id = $1
       ORDER BY h.hearing_date DESC`,
      [caseId]
    );

    // 3. Fetch predictions history for this case
    const predictionsRes = await db.query(
      `SELECT * FROM predictions 
       WHERE case_id = $1 
       ORDER BY prediction_date DESC`,
      [caseId]
    );

    // 4. Fetch uploaded documents
    const documentsRes = await db.query(
      `SELECT d.*, u.full_name as uploaded_by_name 
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.case_id = $1
       ORDER BY d.uploaded_at DESC`,
      [caseId]
    );

    res.json({
      ...caseData,
      hearings: hearingsRes.rows,
      predictions: predictionsRes.rows,
      documents: documentsRes.rows
    });
  } catch (error) {
    next(error);
  }
};

// Create a new case
const createCase = async (req, res, next) => {
  const { case_number, title, description, case_type, filing_date, judge_id } = req.body;

  try {
    if (!case_number || !title || !case_type) {
      res.status(400);
      return next(new Error('Please fill all mandatory fields (case_number, title, case_type)'));
    }

    // Check unique case number
    const uniqueRes = await db.query('SELECT id FROM cases WHERE case_number = $1', [case_number]);
    if (uniqueRes.rows.length > 0) {
      res.status(400);
      return next(new Error(`Case number ${case_number} already exists`));
    }

    // 1. Initial prediction call (before inserting case, or right after)
    // Run mock prediction
    const aiResult = await aiService.getPredictions({
      title,
      description,
      case_type,
      filing_date: filing_date || new Date().toISOString().split('T')[0]
    });

    // 2. Insert case into DB
    const insertRes = await db.query(
      `INSERT INTO cases (case_number, title, description, case_type, filing_date, priority, priority_score, predicted_delay, judge_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        case_number,
        title,
        description,
        case_type,
        filing_date || new Date().toISOString().split('T')[0],
        aiResult.priority,
        aiResult.priority_score,
        aiResult.predicted_delay,
        judge_id || null
      ]
    );

    const newCase = insertRes.rows[0];

    // 3. Write record to predictions table for history
    await db.query(
      `INSERT INTO predictions (case_id, priority, priority_score, predicted_delay, reasons) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        newCase.id,
        aiResult.priority,
        aiResult.priority_score,
        aiResult.predicted_delay,
        JSON.stringify(aiResult.reason)
      ]
    );

    // 4. Log in Audit logs
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'Create Case', `Created case ID ${newCase.id} (${case_number}) with initial AI Priority: ${aiResult.priority}`]
    );

    // 5. Send alerts if High Priority
    if (aiResult.priority === 'High') {
      await notificationService.notifyAdmins(
        `CRITICAL PRIORITY: New High Priority case ${case_number} - "${title}" has been registered.`,
        'Priority Alert'
      );
    }

    // 6. Notify assigned judge
    if (judge_id) {
      const judgeUserRes = await db.query(
        'SELECT user_id FROM judges WHERE id = $1',
        [judge_id]
      );
      if (judgeUserRes.rows.length > 0) {
        await notificationService.sendNotification(
          judgeUserRes.rows[0].user_id,
          `New case assignment: Case ${case_number} - "${title}" has been assigned to your court room.`,
          'In-App'
        );
      }
    }

    res.status(201).json(newCase);
  } catch (error) {
    next(error);
  }
};

// Update Case details
const updateCase = async (req, res, next) => {
  const caseId = req.params.id;
  const { title, description, case_type, status, filing_date, judge_id } = req.body;

  try {
    const checkRes = await db.query('SELECT * FROM cases WHERE id = $1', [caseId]);
    if (checkRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Case not found'));
    }

    const currentCase = checkRes.rows[0];

    // Update case fields
    const updateRes = await db.query(
      `UPDATE cases 
       SET title = $1, description = $2, case_type = $3, status = $4, filing_date = $5, judge_id = $6
       WHERE id = $7
       RETURNING *`,
      [
        title || currentCase.title,
        description || currentCase.description,
        case_type || currentCase.case_type,
        status || currentCase.status,
        filing_date || currentCase.filing_date,
        judge_id !== undefined ? judge_id : currentCase.judge_id,
        caseId
      ]
    );

    const updatedCase = updateRes.rows[0];

    // Log update
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'Update Case', `Updated details for case ID ${caseId} (${updatedCase.case_number})`]
    );

    // If judge is updated, notify the judge
    if (judge_id && judge_id !== currentCase.judge_id) {
      const judgeUserRes = await db.query('SELECT user_id FROM judges WHERE id = $1', [judge_id]);
      if (judgeUserRes.rows.length > 0) {
        await notificationService.sendNotification(
          judgeUserRes.rows[0].user_id,
          `Case assignment: Case ${updatedCase.case_number} - "${updatedCase.title}" has been transferred to your court.`,
          'In-App'
        );
      }
    }

    res.json(updatedCase);
  } catch (error) {
    next(error);
  }
};

// Delete a Case
const deleteCase = async (req, res, next) => {
  const caseId = req.params.id;

  try {
    const checkRes = await db.query('SELECT case_number FROM cases WHERE id = $1', [caseId]);
    if (checkRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Case not found'));
    }

    const caseNumber = checkRes.rows[0].case_number;

    await db.query('DELETE FROM cases WHERE id = $1', [caseId]);

    // Log deletion
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'Delete Case', `Deleted case ID ${caseId} (${caseNumber})`]
    );

    res.json({ message: `Case ${caseNumber} deleted successfully` });
  } catch (error) {
    next(error);
  }
};

// Trigger AI Predictions recalculation
const triggerAIPrediction = async (req, res, next) => {
  const caseId = req.params.id;

  try {
    const caseRes = await db.query('SELECT * FROM cases WHERE id = $1', [caseId]);
    if (caseRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Case not found'));
    }

    const caseData = caseRes.rows[0];

    // Call AI Agent Service
    const aiResult = await aiService.getPredictions({
      title: caseData.title,
      description: caseData.description,
      case_type: caseData.case_type,
      filing_date: caseData.filing_date
    });

    // Update database values
    const updateRes = await db.query(
      `UPDATE cases 
       SET priority = $1, priority_score = $2, predicted_delay = $3 
       WHERE id = $4 
       RETURNING *`,
      [aiResult.priority, aiResult.priority_score, aiResult.predicted_delay, caseId]
    );

    // Save history in predictions table
    await db.query(
      `INSERT INTO predictions (case_id, priority, priority_score, predicted_delay, reasons) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        caseId,
        aiResult.priority,
        aiResult.priority_score,
        aiResult.predicted_delay,
        JSON.stringify(aiResult.reason)
      ]
    );

    // Log in audit trail
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [
        req.user.id,
        'Recalculated Predictions',
        `Re-ran AI Agent prediction for case ID ${caseId}. New priority: ${aiResult.priority} (${aiResult.priority_score}%)`
      ]
    );

    // Send notification if priority escalated to High
    if (aiResult.priority === 'High' && caseData.priority !== 'High') {
      await notificationService.notifyAdmins(
        `PRIORITY ESCALATED: Case ${caseData.case_number} has escalated to High priority.`,
        'Priority Alert'
      );
      if (caseData.judge_id) {
        const judgeUserRes = await db.query('SELECT user_id FROM judges WHERE id = $1', [caseData.judge_id]);
        if (judgeUserRes.rows.length > 0) {
          await notificationService.sendNotification(
            judgeUserRes.rows[0].user_id,
            `ALERT: Case ${caseData.case_number} on your roster has escalated to High priority.`,
            'Priority Alert'
          );
        }
      }
    }

    res.json(updateRes.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Upload Case Document
const uploadDocument = async (req, res, next) => {
  const caseId = req.params.id;

  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a file'));
    }

    const checkRes = await db.query('SELECT case_number FROM cases WHERE id = $1', [caseId]);
    if (checkRes.rows.length === 0) {
      res.status(404);
      return next(new Error('Case not found'));
    }

    const caseNumber = checkRes.rows[0].case_number;

    const file_name = req.file.originalname;
    const file_path = req.file.path;
    const file_type = req.file.mimetype;

    const insertRes = await db.query(
      `INSERT INTO documents (case_id, file_name, file_path, file_type, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [caseId, file_name, file_path, file_type, req.user.id]
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'Upload Document', `Uploaded document "${file_name}" for case ID ${caseId} (${caseNumber})`]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  triggerAIPrediction,
  uploadDocument
};
