/**
 * Postman-style End-to-End API Test Suite for AI Court System
 * Tests all backend REST endpoints on live server (Render / Local)
 * Usage: node test-api.js [optional_base_url]
 */

const BASE_URL = process.argv[2] || process.env.TEST_URL || 'https://court-6lbv.onrender.com/api';

console.log(`\n======================================================`);
console.log(`🚀 Starting Full End-to-End API Test Suite`);
console.log(`🎯 Target Endpoint: ${BASE_URL}`);
console.log(`======================================================\n`);

let adminToken = '';
let judgeToken = '';
let createdCaseId = null;

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

async function runTest(name, path, method = 'GET', body = null, headers = {}) {
  results.total++;
  const startTime = Date.now();
  const url = `${BASE_URL}${path}`;

  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, requestOptions);
    const duration = Date.now() - startTime;
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    const success = res.ok;
    if (success) {
      results.passed++;
      console.log(`  ✅ [PASS] ${method} ${path} (${res.status} OK - ${duration}ms)`);
    } else {
      results.failed++;
      console.log(`  ❌ [FAIL] ${method} ${path} (${res.status} ${res.statusText} - ${duration}ms)`);
      console.log(`     Error details:`, typeof data === 'object' ? JSON.stringify(data) : data);
    }

    results.details.push({ name, method, path, status: res.status, duration, success, data });
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    const duration = Date.now() - startTime;
    results.failed++;
    console.log(`  ❌ [ERROR] ${method} ${path} (Network Error: ${err.message} - ${duration}ms)`);
    results.details.push({ name, method, path, status: 0, duration, success: false, error: err.message });
    return { status: 0, ok: false, error: err.message };
  }
}

async function startTestSuite() {
  console.log(`📌 PHASE 1: Health & Authentication Check\n`);
  
  // 1. Health check
  await runTest('1. System Health Check', '/health');

  // 2. Admin Login
  const adminLogin = await runTest('2. Admin Login', '/auth/login', 'POST', {
    username: 'admin',
    password: 'password123'
  });
  if (adminLogin.ok && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
  }

  // 3. Judge Login
  const judgeLogin = await runTest('3. Judge Login', '/auth/login', 'POST', {
    username: 'judge_sharma',
    password: 'password123'
  });
  if (judgeLogin.ok && judgeLogin.data.token) {
    judgeToken = judgeLogin.data.token;
  }

  // 4. Verify Auth Profile
  if (adminToken) {
    await runTest('4. Fetch Admin Profile', '/auth/profile', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
  }

  // 5. Fetch Judges List
  await runTest('5. Fetch Judges List', '/auth/judges', 'GET', null, {
    Authorization: adminToken ? `Bearer ${adminToken}` : ''
  });

  console.log(`\n📌 PHASE 2: Case Docket & eFiling 3.0 APIs\n`);

  // 6. Fetch All Cases List
  const casesRes = await runTest('6. Fetch Cases List', '/cases', 'GET', null, {
    Authorization: adminToken ? `Bearer ${adminToken}` : ''
  });

  // 7. Fetch Single Case Detail
  await runTest('7. Fetch Case Detail (ID 1)', '/cases/1', 'GET', null, {
    Authorization: adminToken ? `Bearer ${adminToken}` : ''
  });

  // 8. Register New eFiling 3.0 Case
  const newCasePayload = {
    case_number: `TN-E2E-${Date.now().toString().slice(-6)}`,
    title: 'E2E Automated Postman Test Suit vs. City Municipal Corp',
    description: 'Automated test suite case registration verifying 8-step eFiling pipeline.',
    case_type: 'Civil',
    bench: 'Madras High Court - Principal Bench',
    district: 'Chennai',
    petitioner_name: 'E2E Test Petitioner',
    respondent_name: 'City Municipal Corp',
    legal_act: 'Code of Civil Procedure (CPC)',
    custody_status: 'N/A',
    priority: 'High'
  };

  const createCaseRes = await runTest('8. Register New Case (POST /cases)', '/cases', 'POST', newCasePayload, {
    Authorization: adminToken ? `Bearer ${adminToken}` : ''
  });

  if (createCaseRes.ok && createCaseRes.data.id) {
    createdCaseId = createCaseRes.data.id;
    // 9. Re-run AI predictions on newly created case
    await runTest(`9. Run AI Prediction on Case #${createdCaseId}`, `/cases/${createdCaseId}/predict`, 'POST', null, {
      Authorization: adminToken ? `Bearer ${adminToken}` : ''
    });
  }

  console.log(`\n📌 PHASE 3: Hearings, Analytics & Reports\n`);

  // 10. Fetch Hearings Roster Schedule
  await runTest('10. Fetch Hearings List', '/hearings', 'GET', null, {
    Authorization: adminToken ? `Bearer ${adminToken}` : ''
  });

  // 11. Fetch Court Performance Reports
  await runTest('11. Court Performance Report', '/reports/court-performance', 'GET', null, {
    Authorization: adminToken ? `Bearer ${adminToken}` : ''
  });

  // 12. Fetch Analytics Priority Distribution
  await runTest('12. Analytics Priority Distribution', '/analytics/priority-distribution', 'GET', null, {
    Authorization: adminToken ? `Bearer ${adminToken}` : ''
  });

  // 13. Fetch Notifications
  if (judgeToken) {
    await runTest('13. Fetch Judge Notifications', '/notifications', 'GET', null, {
      Authorization: `Bearer ${judgeToken}`
    });
  }

  console.log(`\n======================================================`);
  console.log(`📊 TEST SUITE SUMMARY`);
  console.log(`======================================================`);
  console.log(`  Total Endpoints Tested : ${results.total}`);
  console.log(`  Successful (200 OK)    : ${results.passed}`);
  console.log(`  Failed / Errors        : ${results.failed}`);
  console.log(`  Pass Rate              : ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

  if (results.failed === 0) {
    console.log(`🎉 ALL API ENDPOINTS ARE WORKING PERFECTLY!\n`);
  } else {
    console.log(`⚠️  SOME ENDPOINTS RETURNED ERRORS. SEE DETAILS ABOVE.\n`);
  }
}

startTestSuite();
