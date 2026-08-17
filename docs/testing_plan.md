# Testing Plan

This document outlines the testing strategies to verify the functionality, security, performance, and correctness of the case management and prioritization portal.

---

## 1. Unit Testing Strategy

### A. Backend Services Verification
- **Smart Scheduler Heuristics**:
  - Test case: Supply a judge with 4 hearings on date `D`. Verify that date `D` is marked as "Moderate Workload" for normal priority, but remains open for High Priority overbooking.
  - Test case: Supply a weekend date. Verify that the scheduler skips Saturday and Sunday entirely.
  - Test case: Mock a holiday date in `court_holidays`. Verify the scheduler skips the date and logs "Court Holiday".
- **AI Service Fallback**:
  - Test case: Shutdown the mock AI simulator service. Post a case payload to the backend. Verify the backend successfully triggers the `localAIFallback` method and logs a warning, rather than throwing a HTTP 500 error.

### B. Frontend Route Guards
- Test case: Access `/analytics` while logged in as a `Court Clerk`. Verify that the React router interceptor automatically redirects the clerk to `/unauthorized`.
- Test case: Access `/dashboard` without a token in `localStorage`. Verify the client redirects to `/login`.

---

## 2. Integration Testing Strategy

### A. Authentication flow
1. Submit empty login form. Verify warning "Please enter both username and password." is shown.
2. Submit invalid password. Verify backend returns `401 Unauthorized` and UI displays "Invalid username or password".
3. Submit username `admin` with `password123`. Verify token is received, saved to local storage, and page redirects to `/dashboard`.

### B. Document upload pipeline
1. Navigate to a case detail page. Select a text file (.txt). Try to upload. Verify error "Only PDF, Word documents, or image files are allowed!" displays.
2. Select a PDF file. Upload. Verify:
   - File is written physically inside `server/uploads/`.
   - Record with mimetype `application/pdf` is created in `documents` table.
   - Court action timeline adds a log.
   - Audit trail registers: "Upload Document".

---

## 3. End-to-End Manual Demo Validation Flow

Use the following step-by-step checklist to demonstrate the system for evaluation:

1. **Step 1: Authenticate**
   - Open browser to `http://localhost`. Login page appears.
   - Click "Clerk" quick fill button (fills `clerk_roy` / `password123`) and submit.
   - Verify redirect to dashboard.

2. **Step 2: Register New Case**
   - Navigate to **Case Management**. Click **Register Case**.
   - Fill in:
     - Case Number: `C-2026-9999`
     - Category Type: `Criminal`
     - Title: `State vs. Vikram Malhotra (Senior Citizen)`
     - Date: Select today's date
     - Description: "Accused committed theft of commercial goods. Case involves a senior citizen victim requiring urgent settlement."
     - Presiding Judge: Select `Hon'ble Judge Rajesh Sharma`
   - Click **Register & Run AI**.
   - Verify new case is added. View details of `C-2026-9999`.
   - Verify AI Priority is computed as **High**, delay prediction shows low days (fast-tracked), and reasons display **Senior Citizen** and **Serious Criminal Case**.

3. **Step 3: Schedule Hearing**
   - On the Case Details page, click **Smart Scheduler** (top right).
   - Smart scheduler drawer slides out from the right.
   - Review the 3 conflict-free dates recommended. Note the judge workload numbers.
   - Click the first recommended date card.
   - Select Purpose: `Framing of charges`
   - Enter Comments: `Produce accused via Video Conferencing`
   - Click **Confirm Roster Schedule**.
   - Verify the drawer closes, the case status changes from `Pending` to `Hearing`, and the hearing date appears in the **Court Action Timeline**.

4. **Step 4: Verify Notification**
   - Click logout. Log in as `judge_sharma` / `password123`.
   - Notice the notification bell badge shows a red dot.
   - Click the bell. Verify notification details: "Hearing scheduled: Case C-2026-9999 scheduled for hearing on...".
   - Verify the case `C-2026-9999` is shown on the Judge's dashboard active hearings list.
