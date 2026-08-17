# REST API Documentation

This document details the REST API endpoints exposed by the backend Express server. All API requests (except public auth) require the `Authorization` header with a valid JWT token.

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication APIs

### Login User
- **Endpoint**: `POST /api/auth/login`
- **Auth Required**: No
- **Request Body**:
```json
{
  "username": "admin",
  "password": "password123"
}
```
- **Response (200 OK)**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@court.gov.in",
  "role": "Administrator",
  "full_name": "System Administrator",
  "judgeId": null,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Auth Required**: No
- **Request Body**:
```json
{
  "username": "admin",
  "email": "admin@court.gov.in",
  "newPassword": "newSecretPassword123"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Password has been reset successfully"
}
```

### Get Current User Profile
- **Endpoint**: `GET /api/auth/profile`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@court.gov.in",
  "role": "Administrator",
  "full_name": "System Administrator"
}
```

### List Judges
- **Endpoint**: `GET /api/auth/judges`
- **Auth Required**: Yes (Admins/Clerks)
- **Response (200 OK)**:
```json
[
  {
    "judge_id": 1,
    "full_name": "Hon'ble Judge Rajesh Sharma",
    "specialization": "Criminal",
    "courtroom": "Courtroom 101",
    "status": "Active"
  }
]
```

---

## 2. Case Management APIs

### List Cases (with Search and Filters)
- **Endpoint**: `GET /api/cases`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` (string, optional) - filter by case number or title
  - `status` (string, optional) - 'Pending' | 'Hearing' | 'Disposed'
  - `priority` (string, optional) - 'High' | 'Medium' | 'Low'
  - `case_type` (string, optional) - 'Criminal' | 'Civil' | etc.
  - `judge_id` (number, optional) - filter by assigned judge
  - `page` (number, default: 1)
  - `limit` (number, default: 10)
- **Response (200 OK)**:
```json
{
  "cases": [
    {
      "id": 1,
      "case_number": "C-2026-0001",
      "title": "State vs. Rakesh Kumar",
      "description": "Case related to IPC Section 379 - Theft of commercial cargo truck.",
      "case_type": "Criminal",
      "status": "Pending",
      "filing_date": "2026-01-10T00:00:00.000Z",
      "priority": "High",
      "priority_score": 85,
      "predicted_delay": 45,
      "judge_id": 1,
      "judge_name": "Hon'ble Judge Rajesh Sharma"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Single Case
- **Endpoint**: `GET /api/cases/:id`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "id": 1,
  "case_number": "C-2026-0001",
  "title": "State vs. Rakesh Kumar",
  "description": "Case related to IPC Section 379 - Theft of commercial cargo truck.",
  "case_type": "Criminal",
  "status": "Pending",
  "filing_date": "2026-01-10T00:00:00.000Z",
  "priority": "High",
  "priority_score": 85,
  "predicted_delay": 45,
  "judge_id": 1,
  "judge_name": "Hon'ble Judge Rajesh Sharma",
  "judge_email": "sharma@court.gov.in",
  "judge_courtroom": "Courtroom 101",
  "hearings": [],
  "predictions": [
    {
      "id": 1,
      "case_id": 1,
      "priority": "High",
      "priority_score": 85,
      "predicted_delay": 45,
      "reasons": ["Serious Criminal Case", "IPC 379"],
      "prediction_date": "2026-07-24T09:18:00.000Z"
    }
  ],
  "documents": []
}
```

### Register Case
- **Endpoint**: `POST /api/cases`
- **Auth Required**: Yes (Admins/Clerks)
- **Request Body**:
```json
{
  "case_number": "C-2026-0009",
  "title": "State vs. Vicky Malhotra",
  "description": "Filing regarding check bouncing under Section 138 of N.I. Act.",
  "case_type": "Criminal",
  "filing_date": "2026-07-24",
  "judge_id": 1
}
```
- **Response (201 Created)**:
```json
{
  "id": 7,
  "case_number": "C-2026-0009",
  "title": "State vs. Vicky Malhotra",
  "description": "Filing regarding check bouncing under Section 138 of N.I. Act.",
  "case_type": "Criminal",
  "status": "Pending",
  "filing_date": "2026-07-24",
  "priority": "High",
  "priority_score": 78,
  "predicted_delay": 50,
  "judge_id": 1
}
```

### Recalculate AI Prediction
- **Endpoint**: `POST /api/cases/:id/predict`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "id": 1,
  "priority": "High",
  "priority_score": 90,
  "predicted_delay": 40
}
```

### Upload Case Document
- **Endpoint**: `POST /api/cases/:id/upload`
- **Auth Required**: Yes (Admins/Clerks)
- **Request Header**: `Content-Type: multipart/form-data`
- **Request Body**: Form-data with key `file` containing document
- **Response (201 Created)**:
```json
{
  "id": 4,
  "case_id": 1,
  "file_name": "affidavit_signed.pdf",
  "file_path": "uploads/file-1721832049103-991823.pdf",
  "file_type": "application/pdf",
  "uploaded_by": 5,
  "uploaded_at": "2026-07-24T09:20:49.105Z"
}
```

---

## 3. Hearing Management APIs

### Recommend Hearing Dates (Smart Scheduler)
- **Endpoint**: `GET /api/hearings/recommendations`
- **Auth Required**: Yes
- **Query Parameters**:
  - `case_id` (number, mandatory)
  - `judge_id` (number, mandatory)
  - `start_date` (string, optional, default: tomorrow)
- **Response (200 OK)**:
```json
[
  {
    "date": "2026-07-28",
    "existingHearingsCount": 1,
    "maxCapacity": 4,
    "workloadPercent": 25,
    "status": "Optimal (Low Workload)",
    "dayName": "Tuesday"
  },
  {
    "date": "2026-07-29",
    "existingHearingsCount": 0,
    "maxCapacity": 4,
    "workloadPercent": 0,
    "status": "Highly Recommended",
    "dayName": "Wednesday"
  }
]
```

### Schedule Hearing
- **Endpoint**: `POST /api/hearings`
- **Auth Required**: Yes (Admins/Clerks)
- **Request Body**:
```json
{
  "case_id": 1,
  "judge_id": 1,
  "hearing_date": "2026-07-29 10:00:00",
  "courtroom": "Courtroom 101",
  "purpose": "Framing of charges",
  "comments": "Accused to be present"
}
```
- **Response (201 Created)**:
```json
{
  "id": 5,
  "case_id": 1,
  "judge_id": 1,
  "hearing_date": "2026-07-29T10:00:00.000Z",
  "status": "Scheduled",
  "courtroom": "Courtroom 101",
  "purpose": "Framing of charges",
  "comments": "Accused to be present"
}
```

---

## 4. Reports & Analytics APIs

### Daily Court Summary
- **Endpoint**: `GET /api/reports/daily`
- **Query Parameters**: `date` (YYYY-MM-DD, default: today)
- **Response (200 OK)**:
```json
{
  "reportDate": "2026-07-24",
  "casesFiledCount": 1,
  "casesFiled": [],
  "hearingsCount": 2,
  "hearings": [],
  "disposedCount": 1,
  "disposed": []
}
```

### Judge Performance Analytics
- **Endpoint**: `GET /api/reports/judge-performance`
- **Response (200 OK)**:
```json
[
  {
    "judge_id": 1,
    "judge_name": "Hon'ble Judge Rajesh Sharma",
    "specialization": "Criminal",
    "courtroom": "Courtroom 101",
    "total_cases_assigned": "5",
    "pending_cases": "2",
    "active_hearings": "2",
    "disposed_cases": "1",
    "avg_predicted_delay": "48.5",
    "total_hearings_scheduled": 4
  }
]
```

### Caseload Ingestion (Analytics Chart Dataset)
- **Endpoint**: `GET /api/analytics/monthly-cases`
- **Response (200 OK)**:
```json
[
  { "month": "2026-02", "count": "3" },
  { "month": "2026-03", "count": "5" }
]
```
