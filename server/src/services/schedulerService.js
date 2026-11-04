const db = require('../db');

/**
 * Smart Hearing Scheduler with Virtual Witness Coordination
 * Recommends optimal hearing dates for a case based on:
 * - Case Priority (High priority gets faster/closer scheduling and overbooking capability)
 * - Judge Availability (Count of existing hearings for the judge on each date)
 * - Government & Expert Witness Availability (Checks duty & other-court conflicts)
 * - Court Holidays (Skipping official holiday dates)
 * - Weekends (Skipping Saturdays and Sundays)
 * 
 * @param {number} caseId - Database ID of the case
 * @param {number} judgeId - Database ID of the judge
 * @param {string} startDateStr - Optional baseline date to start searching from (YYYY-MM-DD)
 * @param {number} witnessId - Optional Database ID of key government/expert witness
 * @returns {Promise<Array>} Array of recommended date objects
 */
const recommendHearingDates = async (caseId, judgeId, startDateStr = null, witnessId = null) => {
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
    const d = new Date(row.h_date);
    const key = d.toISOString().split('T')[0];
    judgeWorkloadMap[key] = parseInt(row.count, 10);
  });

  // 4. Fetch witness availability if a witness ID is provided
  const witnessScheduleMap = {};
  let witnessInfo = null;
  if (witnessId) {
    const wInfoRes = await db.query('SELECT name, designation, department, station_or_hospital FROM witnesses WHERE id = $1', [witnessId]);
    if (wInfoRes.rows.length > 0) {
      witnessInfo = wInfoRes.rows[0];
    }

    const wAvailRes = await db.query(
      `SELECT CAST(date AS DATE) as v_date, status, remarks 
       FROM witness_availability 
       WHERE witness_id = $1 AND date >= $2 AND date <= $3`,
      [witnessId, dateCursor.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    wAvailRes.rows.forEach(row => {
      const d = new Date(row.v_date);
      const key = d.toISOString().split('T')[0];
      witnessScheduleMap[key] = {
        status: row.status,
        remarks: row.remarks
      };
    });
  }

  // Parameters based on case priority
  const maxNormalHearings = 4;
  const maxOverbookHearings = casePriority === 'High' ? 6 : 4;

  const recommendations = [];
  let daysEvaluated = 0;

  // Scan next 60 days
  while (daysEvaluated < 60 && recommendations.length < 5) {
    const dayOfWeek = dateCursor.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = dateCursor.toISOString().split('T')[0];

    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isHoliday = holidays.has(dateStr);

    if (!isWeekend && !isHoliday) {
      const scheduledCount = judgeWorkloadMap[dateStr] || 0;

      // Check witness status
      let witnessAvailable = true;
      let witnessDetail = null;
      if (witnessId) {
        const schedule = witnessScheduleMap[dateStr] || { status: 'Available', remarks: 'Available for deposition' };
        witnessAvailable = schedule.status === 'Available';
        witnessDetail = {
          name: witnessInfo?.name,
          designation: witnessInfo?.designation,
          status: schedule.status,
          remarks: schedule.remarks,
          isAvailable: witnessAvailable
        };
      }

      // Date is viable if below judge capacity
      if (scheduledCount < maxOverbookHearings) {
        let fitScore = 'Highly Recommended';
        
        if (witnessId && !witnessAvailable) {
          fitScore = `Witness Conflict: ${witnessDetail.status}`;
        } else if (scheduledCount >= maxNormalHearings) {
          fitScore = 'Priority Overbooked Slot';
        } else if (scheduledCount >= 2) {
          fitScore = 'Moderate Workload';
        } else {
          fitScore = witnessId ? 'Optimal (Judge & Witness Free)' : 'Optimal (Low Workload)';
        }

        recommendations.push({
          date: dateStr,
          existingHearingsCount: scheduledCount,
          maxCapacity: maxOverbookHearings,
          workloadPercent: Math.round((scheduledCount / maxNormalHearings) * 100),
          status: fitScore,
          dayName: dateCursor.toLocaleDateString('en-US', { weekday: 'long' }),
          witness: witnessDetail,
          witnessAvailable: witnessDetail ? witnessDetail.isAvailable : true
        });
      }
    }

    dateCursor.setDate(dateCursor.getDate() + 1);
    daysEvaluated++;
  }

  // Sort recommendations:
  // 1. Favor dates where witness is available (if witness is tracked)
  // 2. Lower judge workload
  // 3. Chronological date
  return recommendations.sort((a, b) => {
    if (a.witnessAvailable !== b.witnessAvailable) {
      return a.witnessAvailable ? -1 : 1;
    }
    if (a.existingHearingsCount !== b.existingHearingsCount) {
      return a.existingHearingsCount - b.existingHearingsCount;
    }
    return new Date(a.date) - new Date(b.date);
  });
};

module.exports = {
  recommendHearingDates
};
