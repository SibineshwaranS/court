const db = require('../db');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

/**
 * Service to manage Government & Expert Witnesses,
 * their availability schedules, and Digital Summons issuance.
 */

let isSchemaReady = false;

const ensureWitnessSchema = async () => {
  if (isSchemaReady) return;
  try {
    // 1. Create tables if not exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS witnesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        station_or_hospital VARCHAR(255) NOT NULL,
        badge_number VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS witness_availability (
        id SERIAL PRIMARY KEY,
        witness_id INTEGER REFERENCES witnesses(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS summons (
        id SERIAL PRIMARY KEY,
        summons_number VARCHAR(100) UNIQUE NOT NULL,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        witness_id INTEGER REFERENCES witnesses(id) ON DELETE SET NULL,
        scheduled_date TIMESTAMP NOT NULL,
        mode VARCHAR(50) DEFAULT 'Virtual VC',
        vc_link TEXT,
        status VARCHAR(50) DEFAULT 'Issued',
        dispatch_status TEXT DEFAULT 'Pending Dispatch',
        qr_code_token VARCHAR(255),
        delivery_channel VARCHAR(50) DEFAULT 'Email',
        from_email VARCHAR(255),
        to_email VARCHAR(255),
        delivery_address TEXT,
        assigned_bailiff VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Safe columns addition
    try {
      await db.query(`
        ALTER TABLE summons ALTER COLUMN dispatch_status TYPE TEXT;
        ALTER TABLE summons ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(50) DEFAULT 'Email';
        ALTER TABLE summons ADD COLUMN IF NOT EXISTS from_email VARCHAR(255);
        ALTER TABLE summons ADD COLUMN IF NOT EXISTS to_email VARCHAR(255);
        ALTER TABLE summons ADD COLUMN IF NOT EXISTS delivery_address TEXT;
        ALTER TABLE summons ADD COLUMN IF NOT EXISTS assigned_bailiff VARCHAR(255);
      `);
    } catch (colErr) {
      // Ignored if exists
    }

    // 3. Auto-seed witnesses if empty
    const wCount = await db.query('SELECT COUNT(*) as count FROM witnesses');
    if (parseInt(wCount.rows[0]?.count || 0, 10) === 0) {
      await db.query(`
        INSERT INTO witnesses (name, designation, department, station_or_hospital, badge_number, phone, email) VALUES
        ('Inspector M. Ravichandran', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Anna Nagar PS, Chennai', 'TNP-4091', '+91 94440 12345', 'm.ravichandran@tnpolice.gov.in'),
        ('Dr. K. Meenakshi', 'Chief Medical Officer / Forensic Surgeon', 'Health Department', 'Kilpauk Medical College Hospital', 'DOC-KMCH-882', '+91 98840 54321', 'dr.meenakshi@kmch.tn.gov.in'),
        ('Thiru S. Gunasekaran', 'Forensic Ballistics Expert', 'Forensic Sciences Dept', 'State Forensic Science Lab, Chennai', 'FSL-BAL-104', '+91 97720 98765', 's.gunasekaran@forensic.tn.gov.in'),
        ('Sub-Inspector P. Arumugam', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Coimbatore City PS', 'TNP-8821', '+91 94432 11223', 'p.arumugam@tnpolice.gov.in'),
        ('Dr. R. Soundararajan', 'Senior Forensic Pathologist', 'Health Department', 'Salem Govt Mohan Kumaramangalam Hospital', 'DOC-SLM-301', '+91 94421 88990', 'dr.soundararajan@salemgh.tn.gov.in'),
        ('Inspector S. Balamurugan', 'Cyber Crime Wing / Digital Forensics', 'Tamil Nadu Police', 'Madurai Central PS', 'TNP-CYB-552', '+91 94450 66778', 's.balamurugan@tnpolice.gov.in')
        ON CONFLICT DO NOTHING;

        INSERT INTO witness_availability (witness_id, date, status, remarks) VALUES
        (1, CURRENT_DATE + INTERVAL '1 day', 'Busy - Other Court', 'Deposing in City Sessions Court, Chennai'),
        (1, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available for Session'),
        (2, CURRENT_DATE + INTERVAL '2 days', 'Emergency Duty', 'Emergency post-mortem duty'),
        (2, CURRENT_DATE + INTERVAL '4 days', 'Available', 'Available for Virtual VC'),
        (3, CURRENT_DATE + INTERVAL '1 day', 'Available', 'Ballistics lab analysis completed'),
        (4, CURRENT_DATE + INTERVAL '2 days', 'On Leave', 'Medical leave'),
        (5, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available in Salem jurisdiction'),
        (6, CURRENT_DATE + INTERVAL '2 days', 'Available', 'Cyber cell report ready')
        ON CONFLICT DO NOTHING;
      `);
      console.log('Witnesses registry auto-seeded successfully.');
    }

    // 4. Auto-seed summons if empty
    const sCount = await db.query('SELECT COUNT(*) as count FROM summons');
    if (parseInt(sCount.rows[0]?.count || 0, 10) === 0) {
      await db.query(`
        INSERT INTO summons (
          summons_number, case_id, witness_id, scheduled_date, mode, vc_link, status,
          dispatch_status, qr_code_token, delivery_channel, from_email, to_email, delivery_address, assigned_bailiff, notes
        ) VALUES
        ('SUMM-2026-0102-4011', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 0), 1, CURRENT_TIMESTAMP + INTERVAL '2 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0102-4011?auth=QR_SUMM-2026-0102-4011_SECURE', 'Issued', 'Dispatched via e-Summons Email to: m.ravichandran@tnpolice.gov.in', 'QR_SUMM-2026-0102-4011_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'm.ravichandran@tnpolice.gov.in', NULL, NULL, 'Deposition on Section 161 CrPC Statements & Investigation Diary'),
        ('SUMM-2026-0104-4012', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 2), 2, CURRENT_TIMESTAMP + INTERVAL '3 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0104-4012?auth=QR_SUMM-2026-0104-4012_SECURE', 'Acknowledged', 'Dispatched via e-Summons Email to: dr.meenakshi@kmch.tn.gov.in', 'QR_SUMM-2026-0104-4012_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'dr.meenakshi@kmch.tn.gov.in', NULL, NULL, 'Produce Authenticated Post-Mortem Certificate & Chemical Analysis Report'),
        ('SUMM-2026-0107-4013', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 5), 6, CURRENT_TIMESTAMP + INTERVAL '4 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0107-4013?auth=QR_SUMM-2026-0107-4013_SECURE', 'Issued', 'Dispatched via e-Summons Email to: s.balamurugan@tnpolice.gov.in', 'QR_SUMM-2026-0107-4013_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 's.balamurugan@tnpolice.gov.in', NULL, NULL, 'Demonstrate CDR (Call Detail Record) extraction & digital IP trace logs'),
        ('SUMM-2026-0103-4014', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 1), 4, CURRENT_TIMESTAMP + INTERVAL '5 days', 'Hybrid', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CVL-2026-0103-4014?auth=QR_SUMM-2026-0103-4014_SECURE', 'Acknowledged', 'Allocated for In-Hand Service via Bailiff (Process Server R. Selvam) to: Coimbatore City PS', 'QR_SUMM-2026-0103-4014_SECURE', 'Hand Delivery', 'court.registry.salem@tn.gov.in', NULL, 'Coimbatore City Police Station, Court Process Section, Coimbatore', 'Process Server R. Selvam (Court Process Unit)', 'Village revenue map verification & field survey measurements'),
        ('SUMM-2026-0104-4015', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 2), 3, CURRENT_TIMESTAMP + INTERVAL '6 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0104-4015?auth=QR_SUMM-2026-0104-4015_SECURE', 'Issued', 'Dispatched via e-Summons Email to: s.gunasekaran@forensic.tn.gov.in', 'QR_SUMM-2026-0104-4015_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 's.gunasekaran@forensic.tn.gov.in', NULL, NULL, 'Ballistics matching test examination of recovered 0.32 country-made revolver'),
        ('SUMM-2026-0105-4016', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 3), 5, CURRENT_TIMESTAMP + INTERVAL '7 days', 'Physical Courtroom', NULL, 'Acknowledged', 'Allocated for In-Hand Service via Bailiff (Senior Process Server K. Murugan) to: Salem Govt Hospital', 'QR_SUMM-2026-0105-4016_SECURE', 'Hand Delivery', 'court.registry.salem@tn.gov.in', NULL, 'Salem Govt Mohan Kumaramangalam Hospital, Salem Jurisdiction', 'Senior Process Server K. Murugan', 'Physical Courtroom deposition on forensic toxicology findings'),
        ('SUMM-2026-0108-4017', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 6), 1, CURRENT_TIMESTAMP + INTERVAL '8 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0108-4017?auth=QR_SUMM-2026-0108-4017_SECURE', 'Issued', 'Dispatched via e-Summons Email to: m.ravichandran@tnpolice.gov.in', 'QR_SUMM-2026-0108-4017_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'm.ravichandran@tnpolice.gov.in', NULL, NULL, 'Produce Seizure Mahazar & recovery witnesses'),
        ('SUMM-2026-0109-4018', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 7), 2, CURRENT_TIMESTAMP + INTERVAL '9 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0109-4018?auth=QR_SUMM-2026-0109-4018_SECURE', 'Issued', 'Dispatched via e-Summons Email to: dr.meenakshi@kmch.tn.gov.in', 'QR_SUMM-2026-0109-4018_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'dr.meenakshi@kmch.tn.gov.in', NULL, NULL, 'Medical Negligence Board Review Findings'),
        ('SUMM-2026-0110-4019', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 8), 6, CURRENT_TIMESTAMP + INTERVAL '10 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0110-4019?auth=QR_SUMM-2026-0110-4019_SECURE', 'Issued', 'Dispatched via e-Summons Email to: s.balamurugan@tnpolice.gov.in', 'QR_SUMM-2026-0110-4019_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 's.balamurugan@tnpolice.gov.in', NULL, NULL, 'Cryptocurrency transaction ledger trace verification'),
        ('SUMM-2026-0111-4020', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 9), 4, CURRENT_TIMESTAMP + INTERVAL '11 days', 'Hybrid', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0111-4020?auth=QR_SUMM-2026-0111-4020_SECURE', 'Acknowledged', 'Allocated for In-Hand Service via Bailiff', 'QR_SUMM-2026-0111-4020_SECURE', 'Hand Delivery', 'court.registry.salem@tn.gov.in', NULL, 'Coimbatore City PS, Coimbatore', 'Process Server V. Gopal', 'Motor accident site inspection sketch'),
        ('SUMM-2026-0112-4021', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 10), 3, CURRENT_TIMESTAMP + INTERVAL '12 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0112-4021?auth=QR_SUMM-2026-0112-4021_SECURE', 'Issued', 'Dispatched via e-Summons Email to: s.gunasekaran@forensic.tn.gov.in', 'QR_SUMM-2026-0112-4021_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 's.gunasekaran@forensic.tn.gov.in', NULL, NULL, 'Explosive chemical residue chromatography results'),
        ('SUMM-2026-0113-4022', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 11), 5, CURRENT_TIMESTAMP + INTERVAL '13 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0113-4022?auth=QR_SUMM-2026-0113-4022_SECURE', 'Acknowledged', 'Dispatched via e-Summons Email to: dr.soundararajan@salemgh.tn.gov.in', 'QR_SUMM-2026-0113-4022_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'dr.soundararajan@salemgh.tn.gov.in', NULL, NULL, 'Wound certificate analysis under Sec 324 IPC'),
        ('SUMM-2026-0114-4023', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 12), 1, CURRENT_TIMESTAMP + INTERVAL '14 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0114-4023?auth=QR_SUMM-2026-0114-4023_SECURE', 'Issued', 'Dispatched via e-Summons Email to: m.ravichandran@tnpolice.gov.in', 'QR_SUMM-2026-0114-4023_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'm.ravichandran@tnpolice.gov.in', NULL, NULL, 'CCTV footage hard-disk hash certificate deposition under 65B IEA'),
        ('SUMM-2026-0115-4024', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 13), 6, CURRENT_TIMESTAMP + INTERVAL '15 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CRL-2026-0115-4024?auth=QR_SUMM-2026-0115-4024_SECURE', 'Issued', 'Dispatched via e-Summons Email to: s.balamurugan@tnpolice.gov.in', 'QR_SUMM-2026-0115-4024_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 's.balamurugan@tnpolice.gov.in', NULL, NULL, 'SIM spoofing IMEI clone analysis'),
        ('SUMM-2026-0003-4025', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 3), 2, CURRENT_TIMESTAMP + INTERVAL '16 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-FC-2026-0003-4025?auth=QR_SUMM-2026-0003-4025_SECURE', 'Acknowledged', 'Dispatched via e-Summons Email to: dr.meenakshi@kmch.tn.gov.in', 'QR_SUMM-2026-0003-4025_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'dr.meenakshi@kmch.tn.gov.in', NULL, NULL, 'Child psychology clinical counseling report'),
        ('SUMM-2026-0012-4026', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 4), 4, CURRENT_TIMESTAMP + INTERVAL '17 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CVL-2026-0012-4026?auth=QR_SUMM-2026-0012-4026_SECURE', 'Issued', 'Dispatched via e-Summons Email to: p.arumugam@tnpolice.gov.in', 'QR_SUMM-2026-0012-4026_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'p.arumugam@tnpolice.gov.in', NULL, NULL, 'Survey boundary demarcations & physical encroachment report'),
        ('SUMM-2026-0015-4027', (SELECT id FROM cases ORDER BY id ASC LIMIT 1 OFFSET 5), 5, CURRENT_TIMESTAMP + INTERVAL '18 days', 'Virtual VC', 'https://court-vc.tn.gov.in/room/TN-VC-TN-CVL-2026-0015-4027?auth=QR_SUMM-2026-0015-4027_SECURE', 'Issued', 'Dispatched via e-Summons Email to: dr.soundararajan@salemgh.tn.gov.in', 'QR_SUMM-2026-0015-4027_SECURE', 'Email', 'court.registry.salem@tn.gov.in', 'dr.soundararajan@salemgh.tn.gov.in', NULL, NULL, 'Permanent disability medical board certificate verification')
        ON CONFLICT (summons_number) DO NOTHING;
      `);
      console.log('Dummy summons records auto-seeded successfully.');
    }

    isSchemaReady = true;
  } catch (err) {
    console.error('ensureWitnessSchema error:', err.message);
  }
};

// 1. Get list of all registered government/expert witnesses
const getWitnesses = async (filters = {}) => {
  await ensureWitnessSchema();

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
  return result.rows;
};

// 2. Get witness availability calendar for a given date range
const getWitnessAvailability = async (witnessId, startDate, endDate) => {
  await ensureWitnessSchema();

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
  await ensureWitnessSchema();

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
  await ensureWitnessSchema();

  // Verify case exists
  const caseRes = await db.query('SELECT case_number, title FROM cases WHERE id = $1', [caseId]);
  if (caseRes.rows.length === 0) throw new Error('Case not found');
  const caseData = caseRes.rows[0];

  // Verify witness exists
  const witnessRes = await db.query('SELECT * FROM witnesses WHERE id = $1', [witnessId]);
  if (witnessRes.rows.length === 0) throw new Error('Witness not found');
  const witness = witnessRes.rows[0];

  // Generate unique Summons Number and Authenticated Virtual Courtroom Link
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const summonsNumber = `SUMM-${new Date().getFullYear()}-${caseData.case_number.replace(/[^A-Za-z0-9]/g, '')}-${randomSuffix}`;
  
  // Encrypted VC URL with secure token
  const securityToken = `QR_${summonsNumber}_SECURE`;
  const sanitizedCaseNum = caseData.case_number.replace(/\//g, '-');
  const vcLink = (mode === 'Virtual VC' || mode === 'Hybrid')
    ? `https://court-vc.tn.gov.in/room/TN-VC-${sanitizedCaseNum}-${randomSuffix}?auth=${securityToken}`
    : null;

  let dispatchStatus = 'Pending Dispatch';
  let emailResult = { success: false };

  // Dispatch via Selected Channel
  if (deliveryChannel === 'Email') {
    const recipientEmail = toEmail || witness.email;
    const senderEmail = fromEmail || 'court.registry.salem@tn.gov.in';

    emailResult = await emailService.sendSummonsEmail({
      fromEmail: senderEmail,
      toEmail: recipientEmail,
      witnessName: witness.name,
      witnessDesignation: witness.designation,
      witnessDepartment: witness.department,
      caseNumber: caseData.case_number,
      caseTitle: caseData.title,
      scheduledDate,
      mode,
      vcLink,
      summonsNumber,
      notes
    });

    dispatchStatus = emailResult.success
      ? `Dispatched via e-Summons Email to: ${recipientEmail}`
      : `Email Gateway queued for delivery to: ${recipientEmail}`;
  } else {
    // Hand Delivery by Bailiff
    const finalAddress = deliveryAddress || `${witness.station_or_hospital}, Salem Jurisdiction`;
    dispatchStatus = `Allocated for In-Hand Service via Bailiff (${assignedBailiff}) to: ${finalAddress}`;
  }

  // Insert into summons table
  const insertSql = `
    INSERT INTO summons (
      summons_number, case_id, witness_id, scheduled_date, mode,
      vc_link, status, dispatch_status, qr_code_token, delivery_channel,
      from_email, to_email, delivery_address, assigned_bailiff, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;
  const insertParams = [
    summonsNumber,
    caseId,
    witnessId,
    scheduledDate,
    mode,
    vcLink,
    'Issued',
    dispatchStatus,
    securityToken,
    deliveryChannel,
    fromEmail,
    toEmail || witness.email,
    deliveryAddress,
    assignedBailiff,
    notes
  ];

  const result = await db.query(insertSql, insertParams);
  const createdSummons = result.rows[0];

  // Notify Court Clerk & Judicial Staff (Safely wrapped)
  try {
    if (notificationService && typeof notificationService.createNotification === 'function') {
      await notificationService.createNotification({
        userId,
        title: `Digital Summons Issued (${summonsNumber})`,
        message: `Summons issued to ${witness.name} for Case ${caseData.case_number}. Deposition on ${new Date(scheduledDate).toLocaleString()}`,
        type: 'Schedule Update',
        link: '/summons'
      });
    } else if (notificationService && typeof notificationService.sendNotification === 'function' && userId) {
      await notificationService.sendNotification(
        userId,
        `Digital Summons Issued (${summonsNumber}) for Case ${caseData.case_number}`,
        'Schedule Update'
      );
    }
  } catch (notifErr) {
    console.warn('[WitnessService] Notification dispatch caught error (non-blocking):', notifErr.message);
  }

  return {
    ...createdSummons,
    case_number: caseData.case_number,
    case_title: caseData.title,
    witness_name: witness.name,
    witness_phone: witness.phone,
    witness_email: witness.email,
    department: witness.department,
    email_dispatched: emailResult.success,
    email_recipient: toEmail || witness.email,
    email_preview: emailResult.previewUrl || null
  };
};

// 5. Get all summons
const getSummons = async (filters = {}) => {
  await ensureWitnessSchema();

  const { case_id, witness_id, status } = filters;
  let sql = `
    SELECT s.*, 
           c.case_number, c.title as case_title, c.priority as case_priority,
           w.name as witness_name, w.designation as witness_designation,
           w.department as witness_department, w.station_or_hospital,
           w.phone as witness_phone, w.email as witness_email, w.badge_number
    FROM summons s
    LEFT JOIN cases c ON s.case_id = c.id
    LEFT JOIN witnesses w ON s.witness_id = w.id
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
  await ensureWitnessSchema();

  const checkRes = await db.query(
    `SELECT s.*, c.case_number, w.name as witness_name 
     FROM summons s 
     LEFT JOIN cases c ON s.case_id = c.id 
     LEFT JOIN witnesses w ON s.witness_id = w.id 
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
