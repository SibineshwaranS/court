const db = require('../db');

/**
 * Smart Hearing Scheduler
 * Recommends optimal hearing dates for a case based on:
 * - Case Priority (High priority gets faster/closer scheduling and overbooking capability)
 * - Judge Availability (Count of existing hearings for the judge on each date)
 * - Court Holidays (Skipping official holiday dates)
 * - Weekends (Skipping Saturdays and Sundays)
 * 
 * @param {number} caseId - Database ID of the case
 * @param {number} judgeId - Database ID of the judge
 * @param {string} startDateStr - Optional baseline date to start searching from (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of recommended date objects
 */
const recommendHearingDates = async (caseId, judgeId, startDateStr = null) => {
  // 1. Retrieve case details
  const caseRes = await db.query(
    'SELECT priority, priority_score, case_type FROM cases WHERE id = $1',
    [caseId]
  );
  if (caseRes.rows.length === 0) {
    throw new Error('Case not found');
  }
  const casePriority = caseRes.rows[0].priority; // 'High', 'Medium', 'Low'

  // Determine starting date
  let dateCursor = startDateStr ? new Date(startDateStr) : new Date();
  // Start from tomorrow
  dateCursor.setDate(dateCursor.getDate() + 1);

  // 2. Fetch court holidays
  const holidayRes = await db.query('SELECT holiday_date FROM court_holidays');
  const holidays = new Set(
    holidayRes.rows.map(row => {
      // format as YYYY-MM-DD
      const d = new Date(row.holiday_date);
      return d.toISOString().split('T')[0];
    })
  );

  // 3. Fetch judge's existing hearings for the next 60 days
  const endDate = new Date(dateCursor);
  endDate.setDate(endDate.getDate() + 60);

  const hearingsRes = await db.query(
    `SELECT CAST(hearing_date AS DATE) as h_date, COUNT(*) as count 
     FROM hearings 
     WHERE judge_id = $1 AND hearing_date >= $2 AND hearing_date <= $3
     GROUP BY CAST(hearing_date AS DATE)`,
    [judgeId, dateCursor.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
  );

  const judgeWorkloadMap = {};
  hearingsRes.rows.forEach(row => {
    // format key as YYYY-MM-DD
    const d = new Date(row.h_date);
    const key = d.toISOString().split('T')[0];
    judgeWorkloadMap[key] = parseInt(row.count, 10);
  });

  // Parameters based on case priority
  // High priority allows scheduling on days with up to 6 hearings (overbooking)
  // Low/Medium priority capped at 4 hearings
  const maxNormalHearings = 4;
  const maxOverbookHearings = casePriority === 'High' ? 6 : 4;

  const recommendations = [];
  let daysEvaluated = 0;

  // Scan next 60 days
  while (daysEvaluated < 60 && recommendations.length < 3) {
    const dayOfWeek = dateCursor.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = dateCursor.toISOString().split('T')[0];

    // Check if weekend (Saturday or Sunday)
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    // Check if holiday
    const isHoliday = holidays.has(dateStr);

    if (!isWeekend && !isHoliday) {
      const scheduledCount = judgeWorkloadMap[dateStr] || 0;

      // Date is viable if it is below the capacity limit
      if (scheduledCount < maxOverbookHearings) {
        let fitScore = 'Highly Recommended';
        
        if (scheduledCount >= maxNormalHearings) {
          fitScore = 'Priority Overbooked Slot';
        } else if (scheduledCount >= 2) {
          fitScore = 'Moderate Workload';
        } else {
          fitScore = 'Optimal (Low Workload)';
        }

        recommendations.push({
          date: dateStr,
          existingHearingsCount: scheduledCount,
          maxCapacity: maxOverbookHearings,
          workloadPercent: Math.round((scheduledCount / maxNormalHearings) * 100),
          status: fitScore,
          dayName: dateCursor.toLocaleDateString('en-US', { weekday: 'long' })
        });
      }
    }

    // Move to next day
    dateCursor.setDate(dateCursor.getDate() + 1);
    daysEvaluated++;
  }

  // Sort recommendations: earliest date and lower workload preferred
  return recommendations.sort((a, b) => {
    if (a.existingHearingsCount !== b.existingHearingsCount) {
      return a.existingHearingsCount - b.existingHearingsCount;
    }
    return new Date(a.date) - new Date(b.date);
  });
};

module.exports = {
  recommendHearingDates
};
