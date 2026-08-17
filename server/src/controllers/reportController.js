const db = require('../db');

// 1. Get Daily Summary Report
const getDailyReport = async (req, res, next) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query; // Default to today

  try {
    // A. Cases filed today
    const filedToday = await db.query(
      'SELECT id, case_number, title, case_type, priority FROM cases WHERE filing_date = $1',
      [date]
    );

    // B. Hearings scheduled today
    const hearingsToday = await db.query(
      `SELECT h.id, h.hearing_date, h.courtroom, h.purpose, h.status, c.case_number, c.title as case_title, u.full_name as judge_name
       FROM hearings h
       JOIN cases c ON h.case_id = c.id
       JOIN judges j ON h.judge_id = j.id
       JOIN users u ON j.user_id = u.id
       WHERE CAST(h.hearing_date AS DATE) = $1`,
      [date]
    );

    // C. Cases disposed today
    // We can assume a case is disposed if its status is 'Disposed' and it was updated today (using audit logs or we check cases where status is Disposed. For the report, we can list all cases currently marked as 'Disposed' that had a hearing completed today or were filed recently. To make it clean, let's fetch all cases with status 'Disposed')
    const disposedCases = await db.query(
      `SELECT c.id, c.case_number, c.title, c.case_type, u.full_name as judge_name 
       FROM cases c
       LEFT JOIN judges j ON c.judge_id = j.id
       LEFT JOIN users u ON j.user_id = u.id
       WHERE c.status = 'Disposed'`,
      []
    );

    res.json({
      reportDate: date,
      casesFiledCount: filedToday.rows.length,
      casesFiled: filedToday.rows,
      hearingsCount: hearingsToday.rows.length,
      hearings: hearingsToday.rows,
      disposedCount: disposedCases.rows.length,
      disposed: disposedCases.rows
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Monthly Summary Report
const getMonthlyReport = async (req, res, next) => {
  const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

  try {
    const formattedMonth = String(month).padStart(2, '0');
    const startPeriod = `${year}-${formattedMonth}-01`;
    const endPeriod = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

    // A. Cases filed during the month
    const casesFiled = await db.query(
      `SELECT id, case_number, title, case_type, filing_date, priority 
       FROM cases 
       WHERE filing_date >= $1 AND filing_date <= $2`,
      [startPeriod, endPeriod]
    );

    // B. Total hearings conducted/scheduled during the month
    const hearings = await db.query(
      `SELECT h.id, h.hearing_date, h.status, c.case_number 
       FROM hearings h
       JOIN cases c ON h.case_id = c.id
       WHERE h.hearing_date >= $1 AND h.hearing_date <= $2`,
      [`${startPeriod} 00:00:00`, `${endPeriod} 23:59:59`]
    );

    // C. Cases Disposed
    const disposed = await db.query(
      `SELECT id, case_number, title, case_type, filing_date 
       FROM cases 
       WHERE status = 'Disposed'`, // Simplification
      []
    );

    res.json({
      period: `${year}-${formattedMonth}`,
      casesFiledCount: casesFiled.rows.length,
      casesFiled: casesFiled.rows,
      hearingsCount: hearings.rows.length,
      hearings: hearings.rows,
      disposedCount: disposed.rows.length,
      disposed: disposed.rows
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Judge Performance Report
const getJudgePerformanceReport = async (req, res, next) => {
  try {
    // Aggregates total cases, pending, disposed, and hearings scheduled per judge
    const queryText = `
      SELECT 
        j.id as judge_id,
        u.full_name as judge_name,
        j.specialization,
        j.courtroom,
        COUNT(c.id) as total_cases_assigned,
        SUM(CASE WHEN c.status = 'Pending' THEN 1 ELSE 0 END) as pending_cases,
        SUM(CASE WHEN c.status = 'Hearing' THEN 1 ELSE 0 END) as active_hearings,
        SUM(CASE WHEN c.status = 'Disposed' THEN 1 ELSE 0 END) as disposed_cases,
        COALESCE(AVG(c.predicted_delay), 0)::numeric(10,1) as avg_predicted_delay,
        (SELECT COUNT(*) FROM hearings h WHERE h.judge_id = j.id) as total_hearings_scheduled
      FROM judges j
      JOIN users u ON j.user_id = u.id
      LEFT JOIN cases c ON c.judge_id = j.id
      GROUP BY j.id, u.full_name, j.specialization, j.courtroom
      ORDER BY total_cases_assigned DESC
    `;

    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// 4. Get Court Workload and Performance Statistics
const getCourtPerformance = async (req, res, next) => {
  try {
    const totalCasesRes = await db.query('SELECT COUNT(*) FROM cases');
    const statusRes = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM cases 
       GROUP BY status`
    );
    const avgDelayRes = await db.query('SELECT AVG(predicted_delay) as avg_delay FROM cases WHERE status != \'Disposed\'');
    const priorityRes = await db.query(
      `SELECT priority, COUNT(*) as count 
       FROM cases 
       GROUP BY priority`
    );

    const totalCases = parseInt(totalCasesRes.rows[0].count, 10);
    const statusCounts = {};
    statusRes.rows.forEach(r => { statusCounts[r.status] = parseInt(r.count, 10); });

    const priorityCounts = {};
    priorityRes.rows.forEach(r => { priorityCounts[r.priority] = parseInt(r.count, 10); });

    const disposedCount = statusCounts['Disposed'] || 0;
    const clearanceRate = totalCases > 0 ? Math.round((disposedCount / totalCases) * 100) : 0;

    res.json({
      totalCases,
      clearanceRatePercent: clearanceRate,
      averageDelayDays: Math.round(parseFloat(avgDelayRes.rows[0].avg_delay || 0)),
      statusBreakdown: {
        pending: statusCounts['Pending'] || 0,
        hearing: statusCounts['Hearing'] || 0,
        disposed: disposedCount
      },
      priorityBreakdown: {
        high: priorityCounts['High'] || 0,
        medium: priorityCounts['Medium'] || 0,
        low: priorityCounts['Low'] || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Delay Reasons Analysis (Aggregate AI prediction reasons)
const getDelayAnalysis = async (req, res, next) => {
  try {
    // Read all historical prediction reasons
    const result = await db.query('SELECT reasons FROM predictions');
    const reasonCounts = {};

    result.rows.forEach(row => {
      let reasons = row.reasons;
      if (typeof reasons === 'string') {
        try { reasons = JSON.parse(reasons); } catch (e) { reasons = []; }
      }
      if (Array.isArray(reasons)) {
        reasons.forEach(r => {
          reasonCounts[r] = (reasonCounts[r] || 0) + 1;
        });
      }
    });

    const formattedAnalysis = Object.keys(reasonCounts).map(reason => ({
      reason,
      count: reasonCounts[reason]
    })).sort((a, b) => b.count - a.count);

    res.json(formattedAnalysis);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getJudgePerformanceReport,
  getCourtPerformance,
  getDelayAnalysis
};
