const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbUrl = (process.env.DATABASE_URL || '').replace('sslmode=require', 'sslmode=no-verify');

const pool = new Pool({
  connectionString: dbUrl || 'postgresql://postgres:postgres@localhost:5432/ai_court_system',
  ssl: dbUrl.includes('supabase') || dbUrl.includes('aws') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 3000,
  keepAlive: true
});

let useInMemory = false;

pool.on('connect', () => {
  console.log('PostgreSQL database connected successfully');
  useInMemory = false;
});

pool.on('error', (err) => {
  console.warn('PostgreSQL pool error:', err.message);
  useInMemory = true;
});

// Seeded In-Memory Database Fallback Engine
const mockData = {
  users: [
    { id: 1, username: 'admin', password_hash: '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', email: 'admin@court.gov.in', role: 'Administrator', full_name: 'System Administrator' },
    { id: 2, username: 'judge_sharma', password_hash: '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', email: 'sharma@court.gov.in', role: 'Judge', full_name: 'Hon\'ble Judge Rajesh Sharma' },
    { id: 3, username: 'judge_patel', password_hash: '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', email: 'patel@court.gov.in', role: 'Judge', full_name: 'Hon\'ble Judge Sneha Patel' },
    { id: 4, username: 'judge_verma', password_hash: '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', email: 'verma@court.gov.in', role: 'Judge', full_name: 'Hon\'ble Judge Amit Verma' },
    { id: 5, username: 'clerk_roy', password_hash: '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', email: 'roy@court.gov.in', role: 'Court Clerk', full_name: 'Senior Clerk Dipak Roy' }
  ],
  judges: [
    { id: 1, user_id: 2, specialization: 'Criminal', courtroom: 'Courtroom 101', status: 'Active', contact_number: '9876543210' },
    { id: 2, user_id: 3, specialization: 'Civil', courtroom: 'Courtroom 102', status: 'Active', contact_number: '9876543211' },
    { id: 3, user_id: 4, specialization: 'Family', courtroom: 'Courtroom 103', status: 'Active', contact_number: '9876543212' }
  ],
  cases: [
    {
      id: 1,
      case_number: 'TN-2026-0001',
      title: 'State vs. Rakesh Kumar',
      description: 'Case related to cargo theft near Chennai Port.',
      case_type: 'Criminal',
      status: 'Pending',
      filing_date: '2026-01-10',
      priority: 'High',
      priority_score: 85,
      predicted_delay: 45,
      judge_id: 1,
      bench: 'Madras High Court - Principal Bench',
      district: 'Chennai',
      petitioner_name: 'State of Tamil Nadu',
      respondent_name: 'Rakesh Kumar',
      custody_status: 'In Judicial Custody',
      detention_days: 90,
      is_senior_citizen: false
    },
    {
      id: 2,
      case_number: 'TN-2026-0002',
      title: 'Saraswathi Ammal vs. City Property Ltd',
      description: 'Senior Citizen property injunction suit in Peelamedu, Coimbatore.',
      case_type: 'Civil',
      status: 'Pending',
      filing_date: '2026-02-15',
      priority: 'High',
      priority_score: 88,
      predicted_delay: 20,
      judge_id: 2,
      bench: 'District & Sessions Courts of Tamil Nadu',
      district: 'Coimbatore',
      petitioner_name: 'Saraswathi Ammal',
      petitioner_age: 79,
      is_senior_citizen: true,
      is_terminally_ill: true,
      respondent_name: 'City Property Ltd',
      custody_status: 'N/A'
    }
  ],
  hearings: [
    {
      id: 1,
      case_id: 1,
      judge_id: 1,
      hearing_date: new Date().toISOString().split('T')[0] + ' 10:30:00',
      courtroom: 'Courtroom 101',
      purpose: 'Framing of Charges / Bail Hearing',
      status: 'Scheduled',
      comments: 'High priority trial session.',
      case_number: 'TN-2026-0001',
      case_title: 'State vs. Rakesh Kumar',
      case_priority: 'High',
      judge_name: 'Hon\'ble Judge Rajesh Sharma'
    },
    {
      id: 2,
      case_id: 2,
      judge_id: 2,
      hearing_date: new Date().toISOString().split('T')[0] + ' 11:45:00',
      courtroom: 'Courtroom 102',
      purpose: 'Senior Citizen Property Injunction Argument',
      status: 'Scheduled',
      comments: 'Urgent stay application.',
      case_number: 'TN-2026-0002',
      case_title: 'Saraswathi Ammal vs. City Property Ltd',
      case_priority: 'High',
      judge_name: 'Hon\'ble Judge Sneha Patel'
    }
  ],
  predictions: [],
  documents: [],
  audit_logs: [],
  notifications: []
};

let nextIds = { cases: 3, hearings: 1, predictions: 1, documents: 1, audit_logs: 1, notifications: 1 };

function handleInMemoryQuery(text, params = []) {
  const sql = text.trim();
  const lowerSql = sql.toLowerCase();

  // 1. SELECT user by username or id
  if (lowerSql.includes('users') && lowerSql.includes('select')) {
    if (lowerSql.includes('username =')) {
      const username = params[0];
      const user = mockData.users.find(u => u.username === username);
      return { rows: user ? [user] : [] };
    }
    if (lowerSql.includes('id =')) {
      const id = parseInt(params[0], 10);
      const user = mockData.users.find(u => u.id === id);
      return { rows: user ? [user] : [] };
    }
    return { rows: mockData.users };
  }

  // 2. SELECT judge by user_id or list
  if (lowerSql.includes('judges') && lowerSql.includes('select')) {
    if (lowerSql.includes('user_id =')) {
      const userId = parseInt(params[0], 10);
      const judge = mockData.judges.find(j => j.user_id === userId);
      return { rows: judge ? [judge] : [] };
    }
    if (lowerSql.includes('id =')) {
      const jId = parseInt(params[0], 10);
      const judge = mockData.judges.find(j => j.id === jId);
      return { rows: judge ? [judge] : [] };
    }
    const rows = mockData.judges.map(j => {
      const u = mockData.users.find(usr => usr.id === j.user_id);
      return {
        judge_id: j.id,
        full_name: u ? u.full_name : 'Hon\'ble Judge',
        specialization: j.specialization,
        courtroom: j.courtroom,
        status: j.status,
        user_id: j.user_id
      };
    });
    return { rows };
  }

  // 3. SELECT cases (Single by ID, List, Counts, Aggregates)
  if (lowerSql.includes('cases') && lowerSql.includes('select')) {
    if (lowerSql.includes('case_number =')) {
      const cNum = params[0];
      const found = mockData.cases.find(c => c.case_number === cNum);
      return { rows: found ? [{ id: found.id }] : [] };
    }

    if (lowerSql.includes('c.id =') || lowerSql.includes('id = $1')) {
      const cId = parseInt(params[0], 10);
      const cFound = mockData.cases.find(c => c.id === cId);
      if (cFound) {
        const jFound = mockData.judges.find(j => j.id === cFound.judge_id);
        const uFound = jFound ? mockData.users.find(u => u.id === jFound.user_id) : null;
        return {
          rows: [{
            ...cFound,
            judge_name: uFound ? uFound.full_name : null,
            judge_email: uFound ? uFound.email : null,
            judge_courtroom: jFound ? jFound.courtroom : null
          }]
        };
      }
      return { rows: [] };
    }

    if (lowerSql.includes('count(*)')) {
      return { rows: [{ count: mockData.cases.length }] };
    }

    if (lowerSql.includes('avg(predicted_delay)')) {
      const avg = mockData.cases.length > 0 ? (mockData.cases.reduce((a, b) => a + (b.predicted_delay || 0), 0) / mockData.cases.length) : 30;
      return { rows: [{ avg_delay: avg }] };
    }

    if (lowerSql.includes('group by status')) {
      const counts = {};
      mockData.cases.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
      return { rows: Object.keys(counts).map(s => ({ status: s, count: counts[s] })) };
    }

    if (lowerSql.includes('group by priority')) {
      const counts = {};
      mockData.cases.forEach(c => { counts[c.priority] = (counts[c.priority] || 0) + 1; });
      return { rows: Object.keys(counts).map(p => ({ priority: p, count: counts[p] })) };
    }

    // Default list query with filter support
    let filteredCases = [...mockData.cases];

    if (lowerSql.includes('c.priority =') || lowerSql.includes('priority =')) {
      const priorityParam = params.find(p => ['High', 'Medium', 'Low'].includes(p));
      if (priorityParam) {
        filteredCases = filteredCases.filter(c => c.priority === priorityParam);
      }
    }

    if (lowerSql.includes('c.status =') || lowerSql.includes('status =')) {
      const statusParam = params.find(p => ['Pending', 'Hearing', 'Disposed'].includes(p));
      if (statusParam) {
        filteredCases = filteredCases.filter(c => c.status === statusParam);
      }
    }

    if (lowerSql.includes('c.judge_id =') || lowerSql.includes('judge_id =')) {
      const jIdParam = params.find(p => typeof p === 'number' && !isNaN(p));
      if (jIdParam) {
        filteredCases = filteredCases.filter(c => c.judge_id === jIdParam);
      }
    }

    let rows = filteredCases.map(c => {
      const jFound = mockData.judges.find(j => j.id === c.judge_id);
      const uFound = jFound ? mockData.users.find(u => u.id === jFound.user_id) : null;
      return {
        ...c,
        judge_name: uFound ? uFound.full_name : null
      };
    });
    return { rows };
  }

  // 4. SELECT notifications
  if (lowerSql.includes('notifications') && lowerSql.includes('select')) {
    const userId = params[0] ? parseInt(params[0], 10) : null;
    let list = mockData.notifications;
    if (userId) list = list.filter(n => n.user_id === userId);
    return { rows: list };
  }

  // 5. SELECT hearings
  if (lowerSql.includes('hearings') && lowerSql.includes('select')) {
    let list = mockData.hearings.map(h => {
      const cFound = mockData.cases.find(c => c.id === h.case_id);
      const jFound = mockData.judges.find(j => j.id === h.judge_id);
      const uFound = jFound ? mockData.users.find(u => u.id === jFound.user_id) : null;
      return {
        ...h,
        case_number: h.case_number || (cFound ? cFound.case_number : 'TN-2026-0001'),
        case_title: h.case_title || (cFound ? cFound.title : 'Judicial Docket'),
        case_priority: h.case_priority || (cFound ? cFound.priority : 'Normal'),
        judge_name: h.judge_name || (uFound ? uFound.full_name : 'Hon\'ble Judge')
      };
    });

    if (lowerSql.includes('judge_id =')) {
      const jId = params.find(p => typeof p === 'number' && !isNaN(p));
      if (jId) list = list.filter(h => h.judge_id === jId);
    }
    return { rows: list };
  }

  // 6. SELECT predictions
  if (lowerSql.includes('predictions') && lowerSql.includes('select')) {
    return { rows: mockData.predictions };
  }

  // 7. INSERTS & UPDATES
  if (lowerSql.includes('insert into cases')) {
    const id = nextIds.cases++;
    const newCaseRecord = {
      id,
      case_number: params[0],
      title: params[1],
      description: params[2],
      case_type: params[3],
      filing_date: params[4],
      priority: params[5],
      priority_score: params[6],
      predicted_delay: params[7],
      judge_id: params[8],
      bench: params[9] || 'Madras High Court - Principal Bench',
      state: params[10] || 'Tamil Nadu',
      district: params[11] || 'Chennai',
      court_establishment: params[12] || 'Principal District & Sessions Court',
      filing_type: params[13] || 'Main Case',
      valuation_amount: params[14] || 0,
      advocate_name: params[15],
      bar_enrollment_number: params[16],
      advocate_phone: params[17],
      petitioner_name: params[18],
      petitioner_type: params[19],
      petitioner_age: params[20],
      petitioner_gender: params[21],
      is_senior_citizen: params[22],
      is_differently_abled: params[23],
      is_terminally_ill: params[24],
      petitioner_phone: params[25],
      petitioner_email: params[26],
      petitioner_address: params[27],
      respondent_name: params[28],
      respondent_type: params[29],
      respondent_address: params[30],
      legal_act: params[31],
      legal_section: params[32],
      police_station: params[33],
      fir_number: params[34],
      fir_year: params[35],
      custody_status: params[36],
      detention_days: params[37],
      lower_court_name: params[38],
      lower_court_case_number: params[39],
      lower_court_order_date: params[40],
      caveat_filed: params[41],
      caveat_number: params[42],
      egras_grn_number: params[43],
      court_fee_paid: params[44],
      cause_of_action_date: params[45],
      cause_of_action_place: params[46],
      trial_stage: params[47] || 'Filing & Scrutiny',
      status: 'Pending',
      created_at: new Date()
    };

    mockData.cases.unshift(newCaseRecord);
    return { rows: [newCaseRecord] };
  }

  if (lowerSql.includes('insert into audit_logs')) {
    const id = nextIds.audit_logs++;
    mockData.audit_logs.push({ id, user_id: params[0], action: params[1], details: params[2], timestamp: new Date() });
    return { rows: [{ id }] };
  }

  if (lowerSql.includes('insert into predictions')) {
    const id = nextIds.predictions++;
    mockData.predictions.push({ id, case_id: params[0], priority: params[1], priority_score: params[2], predicted_delay: params[3], reasons: params[4] });
    return { rows: [{ id }] };
  }

  if (lowerSql.includes('insert into documents')) {
    const id = nextIds.documents++;
    const doc = { id, case_id: params[0], file_name: params[1], file_path: params[2], file_type: params[3], uploaded_by: params[4], uploaded_at: new Date() };
    mockData.documents.push(doc);
    return { rows: [doc] };
  }

  if (lowerSql.includes('insert into notifications')) {
    const id = nextIds.notifications++;
    mockData.notifications.push({ id, user_id: params[0], message: params[1], type: params[2] });
    return { rows: [{ id }] };
  }

  if (lowerSql.includes('update cases')) {
    return { rows: [mockData.cases[0] || {}] };
  }

  return { rows: [] };
}

const queryWithRetry = async (text, params = [], retries = 1) => {
  if (useInMemory) {
    return handleInMemoryQuery(text, params);
  }

  try {
    return await pool.query(text, params);
  } catch (err) {
    console.warn(`[DB Layer] PostgreSQL query failed (${err.message}). Activating local in-memory DB engine.`);
    useInMemory = true;
    return handleInMemoryQuery(text, params);
  }
};

module.exports = {
  query: queryWithRetry,
  pool
};
