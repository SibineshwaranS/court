# System Architecture Document

This document describes the high-level architecture, layer responsibilities, data flow, and components of the **AI-Powered Case Prioritization & Hearing-Delay Prediction System** (SIH1280).

---

## 1. High-Level Architecture Diagram

The application uses a modular, multi-tier client-server architecture:

```
  +-----------------------------------------------------------+
  |                   React.js Frontend (SPA)                 |
  |  (Layouts, Context API, Tailwind Styling, Chart.js Views) |
  +-----------------------------+-----------------------------+
                                |
                                | REST APIs over HTTPS
                                v
  +-----------------------------+-----------------------------+
  |                  Node.js / Express Backend                |
  |  - Controllers (MVC route handlers)                       |
  |  - Services (Scheduler, AI Integration, Notifications)     |
  |  - Middlewares (JWT Authentication, Error Handling)      |
  +----------------------+----------------------+--------------+
                         |                      |
                         | pg Pool Client       | HTTP REST
                         v                      v
  +----------------------+------+    +----------+--------------+
  |      PostgreSQL Database    |    |   External AI Agent API |
  |  (Tables, Triggers, Indexes)|    | (Priority, Delay, Reason)|
  +-----------------------------+    +----------+--------------+
                                                |
                                                | (If offline, backend
                                                | failovers to local
                                                | rule-engine)
                                                v
                                     +----------+--------------+
                                     |   Local Fallback Service|
                                     +-------------------------+
```

---

## 2. Component Design & Responsibility Matrix

### A. Frontend Layer (`client/`)
- **React Router SPA**: Manages routing across pages (`/dashboard`, `/cases`, `/hearings`, etc.) with role-based route guards (`ProtectedRoute`).
- **Context API (`AuthContext.jsx`)**: Global state manager storing token, user role permissions, profile parameters, and login/logout methods.
- **Axios HTTP Client (`api.js`)**: Implements request interceptors (automatically appending Bearer JWT headers) and response interceptors (logging out on 401s).
- **Tailwind CSS System (`tailwind.config.js`)**: Styling library configured with deep court blues and class-based dark mode rules.
- **ChartJS Component Views (`Analytics.jsx`)**: Renders priority charts, case filings trends, and judges workload allocation.

### B. Backend MVC Layer (`server/`)
- **App entry wireup (`app.js`)**: Configures parser middlewares, CORS controls, static file serving routes for document uploads, and error handlers.
- **Routes (`src/routes/`)**: Mounts endpoint routers matching features (`auth`, `case`, `hearing`, `report`, `analytics`).
- **Controllers (`src/controllers/`)**: MVC route handlers query PG pool and format responses.
- **Middlewares (`src/middleware/`)**:
  - `authMiddleware.js`: Intercepts calls, verifies JWT secrets, loads user permissions profiles.
  - `errorMiddleware.js`: Catches unhandled code errors, formats error messages, prevents server crashes.

### C. Services Core Layer (`server/src/services/`)
- **AI Service (`aiService.js`)**:
  - Interacts with the external AI API.
  - Integrates a **Local Fallback Rule Engine**: If the external AI service returns non-200 or is offline, runs identical rule-based heuristic calculations locally. This guarantees 100% platform availability.
- **Smart Scheduler Service (`schedulerService.js`)**:
  - Contains scheduling calculations.
  - Analyzes weekends, holidays table, and judge's existing hearings.
  - Determines open capacity and returns recommended date slots.
- **Notification Service (`notificationService.js`)**:
  - Logs SMS and SMTP emails to terminal.
  - Creates in-app notifications.

### D. Data Persistence Layer (`database/`)
- **PostgreSQL Database**: Persistent storage.
- **Index Optimization**: Speeds up filtering operations (indexes on `cases.status`, `cases.judge_id`, `hearings.judge_id`, `hearings.hearing_date`).
