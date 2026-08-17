const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = (process.env.DATABASE_URL || '').replace('sslmode=require', 'sslmode=no-verify');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true
});

pool.on('connect', () => {
  console.log('PostgreSQL database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err.message);
});

const queryWithRetry = async (text, params, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn(`[DB Query Attempt ${attempt}/${retries} failed]:`, err.message);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

module.exports = {
  query: queryWithRetry,
  pool
};
