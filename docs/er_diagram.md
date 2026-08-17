# Entity Relationship (ER) Diagram

This document details the PostgreSQL database schema model. The tables are normalized to 3NF, linking accounts, court cases, hearings, documents, notifications, and audit trails.

---

## 1. ER Diagram (Mermaid Visualizer)

```mermaid
erDiagram
    users {
        int id PK
        string username UK
        string password_hash
        string email UK
        string role "Admin | Judge | Clerk"
        string full_name
        timestamp created_at
    }

    judges {
        int id PK
        int user_id FK "users.id"
        string specialization
        string courtroom
        string status "Active | On Leave"
        string contact_number
        timestamp created_at
    }

    cases {
        int id PK
        string case_number UK
        string title
        string description
        string case_type
        string status "Pending | Hearing | Disposed"
        date filing_date
        string priority "High | Medium | Low"
        int priority_score
        int predicted_delay
        int judge_id FK "judges.id"
        timestamp created_at
    }

    hearings {
        int id PK
        int case_id FK "cases.id"
        int judge_id FK "judges.id"
        timestamp hearing_date
        string status "Scheduled | Rescheduled | Completed"
        string courtroom
        string purpose
        string comments
        timestamp created_at
    }

    predictions {
        int id PK
        int case_id FK "cases.id"
        string priority
        int priority_score
        int predicted_delay
        jsonb reasons
        timestamp prediction_date
    }

    documents {
        int id PK
        int case_id FK "cases.id"
        string file_name
        string file_path
        string file_type
        int uploaded_by FK "users.id"
        timestamp uploaded_at
    }

    notifications {
        int id PK
        int user_id FK "users.id"
        string message
        string type "Email | SMS | In-App"
        string status "Pending | Sent | Read"
        timestamp created_at
    }

    audit_logs {
        int id PK
        int user_id FK "users.id"
        string action
        string details
        timestamp timestamp
    }

    court_holidays {
        int id PK
        date holiday_date UK
        string description
    }

    users ||--o| judges : "extends"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "creates"
    users ||--o{ documents : "uploads"
    judges ||--o{ cases : "presides"
    judges ||--o{ hearings : "presides"
    cases ||--o{ hearings : "schedules"
    cases ||--o{ predictions : "has"
    cases ||--o{ documents : "holds"
```

---

## 2. Table Schemas & Relational Keys

1. **`users` Table**: Base accounts. Holds login credentials, passwords hashed with bcrypt, and role privileges.
2. **`judges` Table**: Extends `users` through a `1:1` foreign key mapping (`user_id`). Defines the judge's courtroom, active availability status, and contact phone numbers.
3. **`cases` Table**: Stores case metadata, current legal status, and coordinates assignment to a presiding judge (`judge_id`). Contains cached fields for priority class and delay predictions returned from the AI.
4. **`hearings` Table**: Roster slot entries. Coordinates cases with judge availability. Linked `1:N` from cases and `1:N` from judges.
5. **`predictions` Table**: Main historical record logs of every AI prediction run for a case (retains a JSON list of analysis reason tags).
6. **`documents` Table**: Metadata of legal filings, pleadings, and affidavits uploaded via Multer, linking files to their respective case ID.
7. **`notifications` Table**: Inbox log containing SMS, Email, and In-App alerts pushed to court clerks, judges, and admins.
8. **`audit_logs` Table**: System security ledger tracking authentication logins, database entries, edits, and deletions.
9. **`court_holidays` Table**: Closed calendar dates, referenced by the scheduling scheduler algorithm.
