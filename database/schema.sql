-- Schema for AI-Powered Case Prioritization & Hearing-Delay Prediction System
-- District Courts Case Management Portal

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Administrator', 'Judge', 'Court Clerk')),
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Judges Table (extends Users table)
CREATE TABLE IF NOT EXISTS judges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    courtroom VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Retired')),
    contact_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cases Table (Expanded with Tamil Nadu eFiling 3.0 & 7-Vector Judicial Matrix)
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    case_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Hearing', 'Disposed')),
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    priority VARCHAR(15) DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    priority_score INTEGER DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
    predicted_delay INTEGER DEFAULT 0, -- delay in days
    judge_id INTEGER REFERENCES judges(id) ON DELETE SET NULL,

    -- Tamil Nadu eFiling 3.0 Fields & 7-Vector Metadata
    bench VARCHAR(100) DEFAULT 'Madras High Court - Principal Bench',
    state VARCHAR(50) DEFAULT 'Tamil Nadu',
    district VARCHAR(50) DEFAULT 'Chennai',
    court_establishment VARCHAR(100) DEFAULT 'Principal District & Sessions Court',
    filing_type VARCHAR(50) DEFAULT 'Main Case',
    valuation_amount NUMERIC(15,2) DEFAULT 0,

    -- Advocate Details
    advocate_name VARCHAR(150),
    bar_enrollment_number VARCHAR(50), -- e.g. MS/1420/2018
    advocate_phone VARCHAR(15),

    -- Petitioner Details (Litigant 1) & Vulnerability Metrics (Vector 1)
    petitioner_name VARCHAR(150),
    petitioner_type VARCHAR(30) DEFAULT 'Individual',
    petitioner_age INTEGER DEFAULT 35,
    petitioner_gender VARCHAR(10) DEFAULT 'Male',
    is_senior_citizen BOOLEAN DEFAULT FALSE,
    is_differently_abled BOOLEAN DEFAULT FALSE,
    is_terminally_ill BOOLEAN DEFAULT FALSE,
    petitioner_phone VARCHAR(15),
    petitioner_email VARCHAR(100),
    petitioner_address TEXT,

    -- Respondent Details (Litigant 2)
    respondent_name VARCHAR(150),
    respondent_type VARCHAR(30) DEFAULT 'Individual',
    respondent_address TEXT,

    -- Legal Acts, Police Station & Custody (Vectors 2 & 3)
    legal_act VARCHAR(150) DEFAULT 'Indian Penal Code (IPC)',
    legal_section VARCHAR(100) DEFAULT '302, 34',
    police_station VARCHAR(100),
    fir_number VARCHAR(50),
    fir_year INTEGER,
    custody_status VARCHAR(40) DEFAULT 'N/A', -- 'In Judicial Custody', 'On Bail', 'Absconding', 'N/A'
    detention_days INTEGER DEFAULT 0,

    -- Lower Court Details (Appeals / Revisions)
    lower_court_name VARCHAR(150),
    lower_court_case_number VARCHAR(50),
    lower_court_order_date DATE,

    -- Caveat & Court Fee eGRAS Details
    caveat_filed BOOLEAN DEFAULT FALSE,
    caveat_number VARCHAR(50),
    egras_grn_number VARCHAR(50), -- TN eGRAS Payment GRN
    court_fee_paid NUMERIC(10,2) DEFAULT 0,

    -- Cause of Action & Trial Stage (Vectors 4 & 6)
    cause_of_action_date DATE,
    cause_of_action_place VARCHAR(100),
    trial_stage VARCHAR(50) DEFAULT 'Filing & Scrutiny', -- 'Filing & Scrutiny', 'Framing of Charges', 'Prosecution Evidence', 'Defense Evidence', 'Final Arguments'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Hearings Table
CREATE TABLE IF NOT EXISTS hearings (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    judge_id INTEGER NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    hearing_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Rescheduled', 'Cancelled')),
    courtroom VARCHAR(20) NOT NULL,
    purpose TEXT,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Predictions Table (for historical record of AI runs)
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    priority VARCHAR(15) NOT NULL,
    priority_score INTEGER NOT NULL,
    predicted_delay INTEGER NOT NULL,
    reasons JSONB NOT NULL, -- JSON array of strings e.g. ["Senior Citizen", "Serious Criminal Case"]
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Email', 'SMS', 'In-App', 'Priority Alert', 'Schedule Update')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Read')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Court Holidays Table
CREATE TABLE IF NOT EXISTS court_holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_cases_judge ON cases(judge_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_hearings_judge_date ON hearings(judge_id, hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_case ON hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_predictions_case ON predictions(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_court_holidays_date ON court_holidays(holiday_date);
