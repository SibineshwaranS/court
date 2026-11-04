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
        ssl: dbUrl.includes('supabase') || dbUrl.includes('aws') ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 3000
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
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(schemaSql);
        }
        const countRes = await client.query('SELECT COUNT(*) FROM cases');
        if (parseInt(countRes.rows[0]?.count || 0, 10) === 0) {
          const seedPath = path.join(__dirname, '../../../database/seed.sql');
          if (fs.existsSync(seedPath)) {
            const seedSql = fs.readFileSync(seedPath, 'utf8');
            await client.query(seedSql);
          }
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
