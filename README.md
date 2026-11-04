# AI-Powered Case Prioritization & Hearing-Delay Prediction System (SIH1280)

A production-ready full-stack judicial case management portal for Smart India Hackathon (SIH) 2025. Designed for the **Ministry of Law & Justice – Department of Justice** to reduce case pendency, prioritize urgent litigations, and optimize court hearings schedule calendars.

---

## 🏛️ Problem Statement

District courts face severe backlog delays due to manual tracking, inefficient hearing scheduling, and lacking analytical urgency benchmarks. This portal:
1. **Digitizes case management records** (CRUD, legal attachments).
2. **Predicts litigation priority** using an external AI Agent.
3. **Predicts average hearing delays** using an external AI Agent.
4. **Recommends conflict-free hearing dates** via a Smart Scheduler.
5. **Provides visual analytics dashboards & printable reports** for judges and administrators.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS (v3), React Router, Axios, Chart.js.
- **Backend**: Node.js, Express.js (MVC Pattern).
- **Database**: PostgreSQL (Normalized schema, indices).
- **Authentication**: JWT, Bcrypt hashing.
- **File Uploads**: Multer.
- **AI Integration**: Restful integration with external agent API (with smart offline local fallback).
- **Orchestration**: Docker, Docker Compose.

---

## 📂 Project Folder Structure

```
AI-Court-System/
├── client/              # React Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/  # Reusable UI widgets & Layout elements
│   │   ├── context/     # Auth Context API (JWT Session states)
│   │   ├── pages/       # Login, Dashboard, Cases, Analytics, Reports
│   │   └── services/    # Axios HTTP instance API wrappers
│   └── nginx.conf       # Proxy routing gateway for Docker
├── server/              # Express Backend API
│   ├── src/
│   │   ├── controllers/ # MVC Route Controllers
│   │   ├── middleware/  # JWT guards, Role authenticators, Error handling
│   │   ├── routes/      # Express API routers
│   │   └── services/    # AI Service (with fallback), Scheduler, Notifications
│   └── uploads/         # Local legal document attachments folder
├── ai-module/           # Mock AI Agent Service simulator API
├── database/            # DB scripts
│   ├── schema.sql       # PostgreSQL Tables & Indexes schema definition
│   └── seed.sql         # Seed data (Users, Judges, Holidays, Case files)
├── docs/                # Project Documentation
│   ├── architecture.md  # High level architecture & layer specs
│   ├── er_diagram.md    # ER database relationships & Mermaid visualizer
│   ├── workflow.md      # Business flow diagrams
│   ├── testing_plan.md  # Manual and automated tests checklist
│   └── deployment.md    # Detailed cloud deployment setup rules
├── docker-compose.yml   # Multi-container orchestration config
├── Dockerfile           # Multi-stage and direct docker build scripts
└── README.md            # Landing Page & Setup Guide
```

---

## 🚀 Quick Start Installation Guide

### Option A: Run via Docker Compose (Recommended)
This runs the database, backend server, React frontend, and AI simulator agent concurrently in linked containers.

1. **Pre-requisite**: Install Docker Desktop on your operating system.
2. **Build and Spin up stack**:
   ```bash
   docker-compose up --build
   ```
3. **Access Portal**: Open [http://localhost](http://localhost) in your browser.

---

### Option B: Local Setup (Manual Installation)

#### 1. Setup PostgreSQL Database
- Install PostgreSQL on your local system.
- Create a database named `ai_court_system`.
- Execute the schema and seed scripts:
  ```bash
  psql -U postgres -d ai_court_system -f database/schema.sql
  psql -U postgres -d ai_court_system -f database/seed.sql
  ```

#### 2. Start the Mock AI Simulator (ai-module)
- Open a terminal and run:
  ```bash
  cd ai-module
  npm install
  npm start
  ```
  - The simulator runs on port `5001`.

#### 3. Start the Backend API (server)
- Copy env files:
  ```bash
  cd server
  cp .env.example .env
  ```
- Edit `server/.env` to configure your PostgreSQL credentials.
- Install dependencies and start server:
  ```bash
  npm install
  npm run dev
  ```
  - The server runs on port `5000`.

#### 4. Start the Frontend Client (client)
- Open a terminal and run:
  ```bash
  cd client
  npm install
  npm run dev
  ```
  - The frontend development server runs on [http://localhost:5173](http://localhost:5173).

---

## 🔑 Demo Credentials

To test role-based authentication immediately in the portal:

| Role | Username | Password | Roster Access Clearance |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `password123` | Full access, audit logs, judge transfers, CRUD |
| **Judge** | `judge_sharma` | `password123` | Roster calendar hearings, presiding reports, personal cases |
| **Court Clerk** | `clerk_roy` | `password123` | Case registry registrations, document uploads, trial schedulers |

---

## 📖 Extended Documentation Reference

- **REST API Specs**: [api_documentation.md](file:///c:/Documents/projects/AI-Court-System/docs/api_documentation.md)
- **Database Design**: [er_diagram.md](file:///c:/Documents/projects/AI-Court-System/docs/er_diagram.md)
- **Portal Workflows**: [workflow.md](file:///c:/Documents/projects/AI-Court-System/docs/workflow.md)
- **Deployment Manual**: [deployment.md](file:///c:/Documents/projects/AI-Court-System/docs/deployment.md)
- **Evaluation Testing**: [testing_plan.md](file:///c:/Documents/projects/AI-Court-System/docs/testing_plan.md)
