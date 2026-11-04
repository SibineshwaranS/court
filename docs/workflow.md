# System Workflows

This document outlines the step-by-step business workflows for different user roles and automated components in the portal.

---

## 1. Case Registration & Prioritization Workflow

This workflow represents what happens when a new lawsuit is filed in the system by a Court Clerk:

```
[Clerk] Enters Case Details & Description
                 |
                 v
[Backend] Calls AI Agent API /predictPriority
                 |
        +--------+--------+
        |                 |
        v (Success)       v (Fail/Offline)
  Parse Priority &   Execute Local Fallback
  Delay Response     Rule-based Heuristics
        |                 |
        +--------+--------+
                 |
                 v
[Backend] Stores case in PostgreSQL & log history in predictions table
                 |
                 v
[Audit] Logs action: "Create Case C-XXXX with initial AI Priority: High"
                 |
                 +-----------------------+
                 |                       |
                 v (If Priority = High)  v (If Judge Assigned)
           Notify Admins           Notify Judge of
          (Priority Alert)        Roster Assignment
```

---

## 2. Smart Roster Hearing Scheduling Workflow

Workflow representing how hearing slots are recommended and scheduled:

```
[User] Clicks "Smart Scheduler" on Case Details Page
                       |
                       v
[Backend] Fetches Case Priority & Presiding Judge's ID
                       |
                       v
[Backend] Fetches:
          - Court Holidays (to exclude dates)
          - Weekends (to exclude Saturdays/Sundays)
          - Judge's existing scheduled hearings
                       |
                       v
[Backend] Evaluates next 60 calendar days:
          - Counts scheduled hearings per day for the judge
          - Compares against limit (Normal: 4, High Priority Max: 6)
          - Assigns Workload Status tag
                       |
                       v
[Frontend] Displays top 3 recommended slots (sorted by date & low load)
                       |
                       v
[User] Selects a slot, enters purpose/comments, clicks "Confirm"
                       |
                       v
[Backend] Inserts record into hearings table, sets Case Status = 'Hearing'
                       |
                       v
[Audit & Notifications] Logs Roster Schedule, notifies Judge & Clerk
```

---

## 3. Role-Based Permissions & Workflows

### A. Court Clerk Workflows
1. **Case Ingestion**: Logs into portal, fills out registration fields, registers details. Uploads physical filings (PDFs/Images) which attach to the case record.
2. **Hearing Coordination**: Triggers the Smart Scheduler on behalf of the court, selects a date slot, and locks the hearing roster.

### B. Judge Workflows
1. **Dashboard Overview**: Reviews personal statistics card (cases assigned, hearings scheduled for today, delay ratios).
2. **Roster Hearings Presiding**: Reviews today's calendar list. During or after trial, updates hearing notes or changes status to `Completed`, `Rescheduled`, or `Cancelled`.
3. **Caseload Roster Review**: Views case details, downloads attached files, reviews the AI priority timeline of reasons, and requests manual AI re-predictions.

### C. System Administrator Workflows
1. **Roster Assignment**: Transfers/assigns cases to different judges (triggers automatically database logs and notifications to judges).
2. **Audit Logging & Security**: Monitors the global security log ledger (`audit_logs`) tracking login events, deletions, and overrides.
3. **Performance Auditing**: Pulls judge performance reports, caseload clearance stats, and delay analysis breakdowns to optimize court operations.
