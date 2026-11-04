const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbUrl = (process.env.DATABASE_URL || '').replace('sslmode=require', 'sslmode=no-verify');

let pool = null;
let pgliteInstance = null;
let isInitialized = false;

const initDb = async () => {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Try external PostgreSQL server if DATABASE_URL or localhost:5432 is available
  let connectedPg = false;
  if (process.env.DATABASE_URL || process.env.NODE_ENV === 'production') {
    try {
      const testPool = new Pool({
        connectionString: dbUrl || 'postgresql://postgres:postgres@localhost:5432/ai_court_system',
        ssl: dbUrl.includes('supabase') || dbUrl.includes('aws') || dbUrl.includes('render') ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000
      });
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      connectedPg = true;
      console.log('PostgreSQL database (external server) connected successfully');
    } catch (err) {
      console.warn('External PostgreSQL connection failed (' + err.message + '). Falling back to embedded local PostgreSQL (PGlite).');
    }
  }

  // 2. Fallback to local persistent embedded PostgreSQL (PGlite)
  if (!connectedPg) {
    try {
      const { PGlite } = require('@electric-sql/pglite');
      const pgDataDir = path.join(__dirname, '../../pgdata');
      if (!fs.existsSync(pgDataDir)) {
        fs.mkdirSync(pgDataDir, { recursive: true });
      }
      const pidFile = path.join(pgDataDir, 'postmaster.pid');
      if (fs.existsSync(pidFile)) {
        try {
          fs.unlinkSync(pidFile);
          console.log('Removed stale postmaster.pid lock file');
        } catch (e) {
          console.warn('Could not remove stale postmaster.pid:', e.message);
        }
      }
      pgliteInstance = new PGlite(pgDataDir);
      console.log('Embedded local PostgreSQL (PGlite) initialized at:', pgDataDir);

      const schemaPath = path.join(__dirname, '../../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        schemaSql = schemaSql.replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '-- uuid extension omitted');
        await pgliteInstance.exec(schemaSql);
      }

      const countRes = await pgliteInstance.query('SELECT COUNT(*) as count FROM cases');
      if (parseInt(countRes.rows[0]?.count || 0, 10) === 0) {
        console.log('Database cases table is empty. Seeding initial eFiling 3.0 cases...');
        const seedPath = path.join(__dirname, '../../../database/seed.sql');
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          await pgliteInstance.exec(seedSql);
          console.log('Initial cases and judges seeded successfully!');
        }
      }
      try {
        await pgliteInstance.exec(`
          ALTER TABLE summons ALTER COLUMN dispatch_status TYPE TEXT;
          ALTER TABLE summons ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(50) DEFAULT 'Email';
          ALTER TABLE summons ADD COLUMN IF NOT EXISTS from_email VARCHAR(255);
          ALTER TABLE summons ADD COLUMN IF NOT EXISTS to_email VARCHAR(255);
          ALTER TABLE summons ADD COLUMN IF NOT EXISTS delivery_address TEXT;
          ALTER TABLE summons ADD COLUMN IF NOT EXISTS assigned_bailiff VARCHAR(255);
        `);
      } catch (alterErr) {
        // Safe if columns exist
      }
    } catch (pgLiteErr) {
      console.error('Failed to initialize embedded PostgreSQL:', pgLiteErr);
      isInitialized = false;
      throw pgLiteErr;
    }
  } else if (pool) {
    try {
      const client = await pool.connect();
      try {
        console.log('Ensuring database tables and schema for production external PostgreSQL...');
        await client.query(`
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

        try {
          await client.query(`
            ALTER TABLE summons ALTER COLUMN dispatch_status TYPE TEXT;
            ALTER TABLE summons ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(50) DEFAULT 'Email';
            ALTER TABLE summons ADD COLUMN IF NOT EXISTS from_email VARCHAR(255);
            ALTER TABLE summons ADD COLUMN IF NOT EXISTS to_email VARCHAR(255);
            ALTER TABLE summons ADD COLUMN IF NOT EXISTS delivery_address TEXT;
            ALTER TABLE summons ADD COLUMN IF NOT EXISTS assigned_bailiff VARCHAR(255);
          `);
        } catch (alterErr) {
          // Columns may already exist
        }

        // Auto-seed witnesses if empty
        const wRes = await client.query('SELECT COUNT(*) as count FROM witnesses');
        if (parseInt(wRes.rows[0]?.count || 0, 10) === 0) {
          await client.query(`
            INSERT INTO witnesses (name, designation, department, station_or_hospital, badge_number, phone, email) VALUES
            ('Inspector M. Ravichandran', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Anna Nagar PS, Chennai', 'TNP-4091', '+91 94440 12345', 'm.ravichandran@tnpolice.gov.in'),
            ('Dr. K. Meenakshi', 'Chief Medical Officer / Forensic Surgeon', 'Health Department', 'Kilpauk Medical College Hospital', 'DOC-KMCH-882', '+91 98840 54321', 'dr.meenakshi@kmch.tn.gov.in'),
            ('Thiru S. Gunasekaran', 'Forensic Ballistics Expert', 'Forensic Sciences Dept', 'State Forensic Science Lab, Chennai', 'FSL-BAL-104', '+91 97720 98765', 's.gunasekaran@forensic.tn.gov.in'),
            ('Sub-Inspector P. Arumugam', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Coimbatore City PS', 'TNP-8821', '+91 94432 11223', 'p.arumugam@tnpolice.gov.in'),
            ('Dr. R. Soundararajan', 'Senior Forensic Pathologist', 'Health Department', 'Salem Govt Mohan Kumaramangalam Hospital', 'DOC-SLM-301', '+91 94421 88990', 'dr.soundararajan@salemgh.tn.gov.in'),
            ('Inspector S. Balamurugan', 'Cyber Crime Wing / Digital Forensics', 'Tamil Nadu Police', 'Madurai Central PS', 'TNP-CYB-552', '+91 94450 66778', 's.balamurugan@tnpolice.gov.in');

            INSERT INTO witness_availability (witness_id, date, status, remarks) VALUES
            (1, CURRENT_DATE + INTERVAL '1 day', 'Busy - Other Court', 'Deposing in City Sessions Court, Chennai'),
            (1, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available for Session'),
            (2, CURRENT_DATE + INTERVAL '2 days', 'Emergency Duty', 'Emergency post-mortem duty'),
            (2, CURRENT_DATE + INTERVAL '4 days', 'Available', 'Available for Virtual VC'),
            (3, CURRENT_DATE + INTERVAL '1 day', 'Available', 'Ballistics lab analysis completed'),
            (4, CURRENT_DATE + INTERVAL '2 days', 'On Leave', 'Medical leave'),
            (5, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available in Salem jurisdiction'),
            (6, CURRENT_DATE + INTERVAL '2 days', 'Available', 'Cyber cell report ready');
          `);
          console.log('Witnesses registry seeded successfully on external PostgreSQL');
        }

        // Auto-seed summons if empty
        const sRes = await client.query('SELECT COUNT(*) as count FROM summons');
        if (parseInt(sRes.rows[0]?.count || 0, 10) === 0) {
          await client.query(`
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
          console.log('Dummy summons records seeded successfully on external PostgreSQL');
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('External DB initialization error:', err.message);
    }
  }
};

// Auto-initialize on module load
initDb().catch(err => console.error('Database auto-initialization error:', err));

const query = async (text, params = []) => {
  if (!isInitialized) {
    await initDb();
  }
  if (pool) {
    return await pool.query(text, params);
  } else if (pgliteInstance) {
    return await pgliteInstance.query(text, params);
  } else {
    throw new Error('Database connection not established');
  }
};

module.exports = {
  query,
  initDb,
  get pool() {
    return pool || pgliteInstance;
  }
};
