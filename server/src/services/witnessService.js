const db = require('../db');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

/**
 * Service to manage Government & Expert Witnesses,
 * their availability schedules, and Digital Summons issuance.
 */

// 1. Get list of all registered government/expert witnesses
const getWitnesses = async (filters = {}) => {
  const { department, station, search } = filters;
  let sql = 'SELECT * FROM witnesses WHERE 1=1';
  const params = [];
  let idx = 1;

  if (department) {
    sql += ` AND department ILIKE $${idx}`;
    params.push(`%${department}%`);
    idx++;
  }

  if (station) {
    sql += ` AND station_or_hospital ILIKE $${idx}`;
    params.push(`%${station}%`);
    idx++;
  }

  if (search) {
    sql += ` AND (name ILIKE $${idx} OR designation ILIKE $${idx} OR badge_number ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  sql += ' ORDER BY name ASC';
  const result = await db.query(sql, params);

  if (result.rows.length === 0 && !department && !station && !search) {
    // Self-heal and seed initial witnesses registry
    await db.query(`
      INSERT INTO witnesses (name, designation, department, station_or_hospital, badge_number, phone, email) VALUES
      ('Inspector M. Ravichandran', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Anna Nagar PS, Chennai', 'TNP-4091', '+91 94440 12345', 'm.ravichandran@tnpolice.gov.in'),
      ('Dr. K. Meenakshi', 'Chief Medical Officer / Forensic Surgeon', 'Health Department', 'Kilpauk Medical College Hospital', 'DOC-KMCH-882', '+91 98840 54321', 'dr.meenakshi@kmch.tn.gov.in'),
      ('Thiru S. Gunasekaran', 'Forensic Ballistics Expert', 'Forensic Sciences Dept', 'State Forensic Science Lab, Chennai', 'FSL-BAL-104', '+91 97720 98765', 's.gunasekaran@forensic.tn.gov.in'),
      ('Sub-Inspector P. Arumugam', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Coimbatore City PS', 'TNP-8821', '+91 94432 11223', 'p.arumugam@tnpolice.gov.in'),
      ('Dr. R. Soundararajan', 'Senior Forensic Pathologist', 'Health Department', 'Salem Govt Mohan Kumaramangalam Hospital', 'DOC-SLM-301', '+91 94421 88990', 'dr.soundararajan@salemgh.tn.gov.in'),
      ('Inspector S. Balamurugan', 'Cyber Crime Wing / Digital Forensics', 'Tamil Nadu Police', 'Madurai Central PS', 'TNP-CYB-552', '+91 94450 66778', 's.balamurugan@tnpolice.gov.in')
    `);

    await db.query(`
      INSERT INTO witness_availability (witness_id, date, status, remarks) VALUES
      (1, CURRENT_DATE + INTERVAL '1 day', 'Busy - Other Court', 'Deposing in City Sessions Court, Chennai'),
      (1, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available for Session'),
      (2, CURRENT_DATE + INTERVAL '2 days', 'Emergency Duty', 'Emergency post-mortem duty'),
      (2, CURRENT_DATE + INTERVAL '4 days', 'Available', 'Available for Virtual VC'),
      (3, CURRENT_DATE + INTERVAL '1 day', 'Available', 'Ballistics lab analysis completed'),
      (4, CURRENT_DATE + INTERVAL '2 days', 'On Leave', 'Medical leave'),
      (5, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available in Salem jurisdiction'),
      (6, CURRENT_DATE + INTERVAL '2 days', 'Available', 'Cyber cell report ready')
    `);
    const refreshed = await db.query(sql, params);
    return refreshed.rows;
  }

  return result.rows;
};

// 2. Get witness availability calendar for a given date range
const getWitnessAvailability = async (witnessId, startDate, endDate) => {
  let sql = 'SELECT * FROM witness_availability WHERE witness_id = $1';
  const params = [witnessId];
  let idx = 2;

  if (startDate) {
    sql += ` AND date >= $${idx}`;
    params.push(startDate);
    idx++;
  }

  if (endDate) {
    sql += ` AND date <= $${idx}`;
    params.push(endDate);
    idx++;
  }

  sql += ' ORDER BY date ASC';
  const result = await db.query(sql, params);
  return result.rows;
};

// 3. Check witness conflict on a specific date
const checkWitnessConflict = async (witnessId, dateStr) => {
  const dateFormatted = dateStr.split('T')[0].split(' ')[0];
  const res = await db.query(
    'SELECT status, remarks FROM witness_availability WHERE witness_id = $1 AND date = $2',
    [witnessId, dateFormatted]
  );
  if (res.rows.length === 0) {
    return { available: true, status: 'Available', remarks: 'No known conflict recorded' };
  }
  const row = res.rows[0];
  return {
    available: row.status === 'Available',
    status: row.status,
    remarks: row.remarks
  };
};

// 4. Issue Digital Summons with Virtual Court (VC) link
const issueSummons = async ({
  caseId,
  hearingId = null,
  witnessId,
  scheduledDate,
  mode = 'Virtual VC',
  deliveryChannel = 'Email',
  fromEmail = 'court.registry.salem@tn.gov.in',
  toEmail = '',
  deliveryAddress = '',
  assignedBailiff = 'Process Server R. Selvam',
  notes = '',
  userId = null
}) => {
  // Verify case exists
  const caseRes = await db.query('SELECT case_number, title FROM cases WHERE id = $1', [caseId]);
  if (caseRes.rows.length === 0) throw new Error('Case not found');
  const caseData = caseRes.rows[0];

  // Verify witness exists
  const witnessRes = await db.query('SELECT * FROM witnesses WHERE id = $1', [witnessId]);
  if (witnessRes.rows.length === 0) throw new Error('Witness not found');
  const witness = witnessRes.rows[0];

  // Generate unique summons number
  const uniqueToken = Math.floor(1000 + Math.random() * 9000);
  const summonsNumber = `SUMM-${new Date().getFullYear()}-${caseData.case_number.slice(-4)}-${uniqueToken}`;
  const qrCodeToken = `QR_${summonsNumber}_SECURE`;

  // Generate official Virtual Court Video Conference (VC) link
  const vcRoomId = `TN-VC-${caseData.case_number}-${uniqueToken}`;
  const vcLink = `https://court-vc.tn.gov.in/room/${vcRoomId}?auth=${qrCodeToken}`;

  // Determine dispatch status based on delivery channel
  let dispatchStatus = '';
  let emailResult = { success: false };

  if (deliveryChannel === 'Email') {
    const finalToEmail = toEmail || witness.email || 'deponent@court.gov.in';
    const finalFromEmail = fromEmail || 'court.registry.salem@tn.gov.in';
    dispatchStatus = `Dispatched via e-Summons Email to: ${finalToEmail}`;

    emailResult = await emailService.sendSummonsEmail({
      fromEmail: finalFromEmail,
      recipientEmail: finalToEmail,
      summonsNumber,
      caseNumber: caseData.case_number,
      caseTitle: caseData.title,
      witnessName: witness.name,
      witnessDesignation: witness.designation,
      stationOrHospital: witness.station_or_hospital,
      scheduledDate,
      mode,
      vcLink,
      notes
    });
  } else {
    // Physical In-Hand delivery
    const finalAddress = deliveryAddress || witness.station_or_hospital || 'Salem District Court Jurisdiction';
    dispatchStatus = `Allocated for In-Hand Service via Bailiff (${assignedBailiff || 'Process Server'}) to: ${finalAddress}`;
  }

  // Insert into summons table
  const insertRes = await db.query(
    `INSERT INTO summons (
      summons_number, case_id, hearing_id, witness_id, scheduled_date,
      mode, vc_link, status, dispatch_status, qr_code_token, notes,
      delivery_channel, from_email, to_email, delivery_address, assigned_bailiff
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [
      summonsNumber,
      caseId,
      hearingId,
      witnessId,
      scheduledDate,
      mode,
      vcLink,
      'Issued',
      dispatchStatus,
      qrCodeToken,
      notes,
      deliveryChannel,
      fromEmail || null,
      toEmail || null,
      deliveryAddress || null,
      assignedBailiff || null
    ]
  );

  const newSummons = insertRes.rows[0];

  // Send in-app notification
  const targetInfo = deliveryChannel === 'Email' ? `Email to ${toEmail || witness.email}` : `In-Hand Delivery by Bailiff`;
  const message = `DIGITAL SUMMONS ISSUED (${summonsNumber}): Hon'ble Court requests appearance of ${witness.designation} ${witness.name} for Case ${caseData.case_number} on ${new Date(scheduledDate).toLocaleString()}. Mode: ${mode}. Service: ${targetInfo}.`;
  
  if (userId) {
    await notificationService.sendNotification(userId, message, 'Schedule Update');
  }

  // Audit trail
  await db.query(
    'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
    [
      userId,
      'Issue Smart Summons',
      `Issued ${mode} summons ${summonsNumber} for witness ${witness.name} in case ${caseData.case_number}. Method: ${deliveryChannel} (${targetInfo})`
    ]
  );

  return {
    ...newSummons,
    case_number: caseData.case_number,
    case_title: caseData.title,
    witness_name: witness.name,
    witness_designation: witness.designation,
    witness_station: witness.station_or_hospital,
    witness_phone: witness.phone,
    witness_email: toEmail || witness.email,
    email_dispatched: emailResult.success,
    email_recipient: toEmail || witness.email,
    email_preview: emailResult.previewUrl || null
  };
};

// 5. Get all summons
const getSummons = async (filters = {}) => {
  const { case_id, witness_id, status } = filters;
  let sql = `
    SELECT s.*, 
           c.case_number, c.title as case_title, c.priority as case_priority,
           w.name as witness_name, w.designation as witness_designation,
           w.department as witness_department, w.station_or_hospital,
           w.phone as witness_phone, w.email as witness_email, w.badge_number
    FROM summons s
    JOIN cases c ON s.case_id = c.id
    JOIN witnesses w ON s.witness_id = w.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (case_id) {
    sql += ` AND s.case_id = $${idx}`;
    params.push(parseInt(case_id, 10));
    idx++;
  }

  if (witness_id) {
    sql += ` AND s.witness_id = $${idx}`;
    params.push(parseInt(witness_id, 10));
    idx++;
  }

  if (status) {
    sql += ` AND s.status = $${idx}`;
    params.push(status);
    idx++;
  }

  sql += ' ORDER BY s.scheduled_date ASC';
  const result = await db.query(sql, params);
  return result.rows;
};

// 6. Update summons status (e.g. Acknowledged, Excused, Deposed)
const updateSummonsStatus = async (summonsId, status, notes = '', userId = null) => {
  const checkRes = await db.query(
    `SELECT s.*, c.case_number, w.name as witness_name 
     FROM summons s 
     JOIN cases c ON s.case_id = c.id 
     JOIN witnesses w ON s.witness_id = w.id 
     WHERE s.id = $1`,
    [summonsId]
  );
  if (checkRes.rows.length === 0) throw new Error('Summons not found');

  const updateRes = await db.query(
    `UPDATE summons 
     SET status = $1, notes = COALESCE($2, notes) 
     WHERE id = $3 
     RETURNING *`,
    [status, notes || null, summonsId]
  );

  // Audit log
  await db.query(
    'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
    [
      userId,
      'Update Summons Status',
      `Summons ID ${summonsId} (${checkRes.rows[0].summons_number}) updated to ${status}`
    ]
  );

  return updateRes.rows[0];
};

module.exports = {
  getWitnesses,
  getWitnessAvailability,
  checkWitnessConflict,
  issueSummons,
  getSummons,
  updateSummonsStatus
};

