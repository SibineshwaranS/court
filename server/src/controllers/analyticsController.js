const db = require('../db');

// 1. Get Priority Distribution (High, Medium, Low count)
const getPriorityDistribution = async (req, res, next) => {
  try {
    const queryText = `
      SELECT priority, COUNT(*) as count 
      FROM cases 
      WHERE status != 'Disposed'
      GROUP BY priority
    `;
    const result = await db.query(queryText);
    
    const formatted = {
      High: 0,
      Medium: 0,
      Low: 0
    };

    result.rows.forEach(row => {
      formatted[row.priority] = parseInt(row.count, 10);
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

// 2. Get Judge Workload (Judges and their counts of active cases)
const getJudgeWorkload = async (req, res, next) => {
  try {
    const queryText = `
      SELECT 
        u.full_name as name, 
        SUM(CASE WHEN c.status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN c.status = 'Hearing' THEN 1 ELSE 0 END) as active_hearing,
        COUNT(c.id) as total
      FROM judges j
      JOIN users u ON j.user_id = u.id
      LEFT JOIN cases c ON c.judge_id = j.id AND c.status != 'Disposed'
      GROUP BY j.id, u.full_name
      ORDER BY total DESC
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// 3. Get Monthly Ingested Cases (over the past 6 months)
const getMonthlyCases = async (req, res, next) => {
  try {
    const queryText = `
      SELECT 
        TO_CHAR(filing_date, 'YYYY-MM') as month, 
        COUNT(*) as count
      FROM cases
      WHERE filing_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(filing_date, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// 4. Get Pending Cases Age Distribution (Days since filing date)
const getPendingCasesAgeDistribution = async (req, res, next) => {
  try {
    const queryText = `
      SELECT 
        CASE 
          WHEN CURRENT_DATE - filing_date <= 30 THEN '0-30 Days'
          WHEN CURRENT_DATE - filing_date <= 90 THEN '31-90 Days'
          WHEN CURRENT_DATE - filing_date <= 180 THEN '91-180 Days'
          WHEN CURRENT_DATE - filing_date <= 365 THEN '181-365 Days'
          ELSE 'Over 1 Year'
        END as age_bracket,
        COUNT(*) as count
      FROM cases
      WHERE status != 'Disposed'
      GROUP BY 
        CASE 
          WHEN CURRENT_DATE - filing_date <= 30 THEN '0-30 Days'
          WHEN CURRENT_DATE - filing_date <= 90 THEN '31-90 Days'
          WHEN CURRENT_DATE - filing_date <= 180 THEN '91-180 Days'
          WHEN CURRENT_DATE - filing_date <= 365 THEN '181-365 Days'
          ELSE 'Over 1 Year'
        END
    `;
    
    const result = await db.query(queryText);
    
    // Sort brackets in chronological order
    const bracketsOrder = {
      '0-30 Days': 1,
      '31-90 Days': 2,
      '91-180 Days': 3,
      '181-365 Days': 4,
      'Over 1 Year': 5
    };

    const formatted = result.rows.sort((a, b) => {
      return (bracketsOrder[a.age_bracket] || 99) - (bracketsOrder[b.age_bracket] || 99);
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPriorityDistribution,
  getJudgeWorkload,
  getMonthlyCases,
  getPendingCasesAgeDistribution
};
