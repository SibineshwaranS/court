-- Seed data for AI-Powered Case Prioritization & Hearing-Delay Prediction System
-- District Courts Case Management Portal (eFiling 3.0 & 7-Vector Judicial Matrix)

-- 1. Insert Users (Password is 'password123' for all seeded users, hashed with bcrypt)
-- Hashed password: $2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS
INSERT INTO users (username, password_hash, email, role, full_name) VALUES
('admin', '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', 'admin@court.gov.in', 'Administrator', 'System Administrator'),
('judge_sharma', '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', 'sharma@court.gov.in', 'Judge', 'Hon''ble Judge Rajesh Sharma'),
('judge_patel', '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', 'patel@court.gov.in', 'Judge', 'Hon''ble Judge Sneha Patel'),
('judge_verma', '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', 'verma@court.gov.in', 'Judge', 'Hon''ble Judge Amit Verma'),
('clerk_roy', '$2a$10$.qGM4T3swmiHaIO92f71NeBBV1coNxOM9i.E5GFkgadwkpVpkM.fS', 'roy@court.gov.in', 'Court Clerk', 'Senior Clerk Dipak Roy')
ON CONFLICT (username) DO NOTHING;

-- 2. Insert Judges
INSERT INTO judges (user_id, specialization, courtroom, status, contact_number) VALUES
((SELECT id FROM users WHERE username = 'judge_sharma'), 'Criminal', 'Courtroom 101', 'Active', '9876543210'),
((SELECT id FROM users WHERE username = 'judge_patel'), 'Civil', 'Courtroom 102', 'Active', '9876543211'),
((SELECT id FROM users WHERE username = 'judge_verma'), 'Family', 'Courtroom 103', 'Active', '9876543212')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Insert Court Holidays (for year 2026)
INSERT INTO court_holidays (holiday_date, description) VALUES
('2026-01-26', 'Republic Day'),
('2026-03-03', 'Holi'),
('2026-04-02', 'Good Friday'),
('2026-08-15', 'Independence Day'),
('2026-10-02', 'Gandhi Jayanti'),
('2026-10-19', 'Dussehra'),
('2026-11-08', 'Diwali'),
('2026-12-25', 'Christmas Day')
ON CONFLICT (holiday_date) DO NOTHING;

-- 4. Insert Cases (9 eFiling 3.0 Cases matching Judge assignments)
INSERT INTO cases (case_number, title, description, case_type, status, filing_date, priority, priority_score, predicted_delay, judge_id, bench, district, petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act) VALUES
('TN-CRL-2026-0001', 'State vs. Rakesh Kumar', 'Case related to IPC Section 379 - Theft of commercial cargo truck near Chennai Port.', 'Criminal', 'Hearing', '2026-01-10', 'High', 80, 100, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), 'Madras High Court - Principal Bench', 'Chennai', 'State of Tamil Nadu', 'Rakesh Kumar', 'In Judicial Custody', false, 'Indian Penal Code (IPC)'),
('TN-OS-2026-0002', 'Sharma Realty vs. Gupta & Sons', 'Dispute over commercial rental property lease agreement in Central Plaza.', 'Civil', 'Hearing', '2026-02-15', 'Medium', 52, 120, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel')), 'District & Sessions Courts of Tamil Nadu', 'Coimbatore', 'Sharma Realty', 'Gupta & Sons', 'N/A', false, 'Code of Civil Procedure (CPC)'),
('TN-FC-2026-0003', 'Ananya Sen vs. Rahul Sen', 'Petition for child custody and maintenance support.', 'Family', 'Disposed', '2026-03-05', 'High', 91, 15, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_verma')), 'District Family Court - Chennai', 'Chennai', 'Ananya Sen', 'Rahul Sen', 'N/A', false, 'Hindu Marriage Act 1955'),
('TN-CRL-2026-0004', 'State vs. Mohan Singh & Ors.', 'Attempted robbery and criminal conspiracy near National Highway 8.', 'Criminal', 'Hearing', '2026-04-20', 'Medium', 65, 70, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), 'Madras High Court - Principal Bench', 'Madurai', 'State of Tamil Nadu', 'Mohan Singh & Ors.', 'Bail Granted', false, 'Indian Penal Code (IPC)'),
('TN-OS-2026-0005', 'Verma Tech vs. Zenith Solutions', 'Breach of software service level agreement and unpaid invoices.', 'Civil', 'Disposed', '2026-01-05', 'Low', 30, 0, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel')), 'District & Sessions Courts of Tamil Nadu', 'Salem', 'Verma Tech', 'Zenith Solutions', 'N/A', false, 'Indian Contract Act 1872'),
('TN-COMM-2026-0006', 'Mehra Exports vs. Customs Commissioner', 'Customs duty tax appeal case for import shipment.', 'Commercial', 'Pending', '2026-05-12', 'Medium', 45, 180, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel')), 'Madras High Court - Commercial Division', 'Chennai', 'Mehra Exports', 'Customs Commissioner', 'N/A', false, 'Customs Act 1962'),
('TN-CRL-2026-9041', 'State vs. Suresh Malhotra (Senior Citizen)', 'Pharmaceutical forgery and medical negligence suit.', 'Criminal', 'Disposed', '2026-07-31', 'High', 90, 50, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), 'Madras High Court - Principal Bench', 'Chennai', 'State of Tamil Nadu', 'Suresh Malhotra', 'Bail Granted', true, 'Drugs and Cosmetics Act 1940'),
('TN-CS-2026-9042', 'Dinesh Exports vs. Zenith Logistics', 'Commercial shipping freight damage and breach of contract suit.', 'Civil', 'Hearing', '2026-07-31', 'Medium', 50, 90, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel')), 'District & Sessions Courts of Tamil Nadu', 'Coimbatore', 'Dinesh Exports', 'Zenith Logistics', 'N/A', false, 'Indian Contract Act 1872'),
('TN-CRL-2026-0101', 'State vs. Vikram Singh & Ors.', 'Multiple cyber banking fraud and money laundering conspiracy.', 'Criminal', 'Hearing', '2026-08-13', 'High', 90, 50, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), 'Madras High Court - Principal Bench', 'Madurai', 'State of Tamil Nadu', 'Vikram Singh & Ors.', 'In Judicial Custody', false, 'Prevention of Money Laundering Act (PMLA)')
ON CONFLICT (case_number) DO NOTHING;

-- 5. Insert Predictions (Record historical AI predictions)
INSERT INTO predictions (case_id, priority, priority_score, predicted_delay, reasons) VALUES
((SELECT id FROM cases WHERE case_number = 'TN-CRL-2026-0001'), 'High', 80, 100, '["IPC 379", "Accused in Custody", "Prosecution Witness Scheduling"]'),
((SELECT id FROM cases WHERE case_number = 'TN-OS-2026-0002'), 'Medium', 52, 120, '["Commercial Dispute", "Mediation Pending", "Document Discovery"]'),
((SELECT id FROM cases WHERE case_number = 'TN-FC-2026-0003'), 'High', 91, 15, '["Minor Child Custody", "Maintenance Claim", "Targeted Immediate Disposal"]'),
((SELECT id FROM cases WHERE case_number = 'TN-CRL-2026-0101'), 'High', 90, 50, '["PMLA Cyber Fraud", "Accused in Custody (60d)", "Multi-State Jurisdiction"]')
ON CONFLICT DO NOTHING;

-- 6. Insert Hearings
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments) VALUES
((SELECT id FROM cases WHERE case_number = 'TN-CRL-2026-0001'), (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), CURRENT_DATE + TIME '10:30:00', 'Scheduled', 'Courtroom 101', 'Framing of Charges / Summons Return', 'High priority criminal trial'),
((SELECT id FROM cases WHERE case_number = 'TN-CRL-2026-0101'), (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), CURRENT_DATE + TIME '11:30:00', 'Scheduled', 'Courtroom 101', 'Bail & Custody Argument', 'Accused produced via VC'),
((SELECT id FROM cases WHERE case_number = 'TN-CS-2026-9042'), (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel')), CURRENT_DATE + TIME '14:00:00', 'Scheduled', 'Courtroom 102', 'Interim Injunction Argument', 'Civil suit hearing')
ON CONFLICT DO NOTHING;

-- 7. Insert Notifications
INSERT INTO notifications (user_id, message, type, status) VALUES
((SELECT id FROM users WHERE username = 'judge_sharma'), 'High Priority Case State vs. Vikram Singh & Ors. (C-2026-0101) assigned to your bench.', 'Priority Alert', 'Pending'),
((SELECT id FROM users WHERE username = 'judge_patel'), 'Hearing scheduled for Dinesh Exports vs. Zenith Logistics (C-2026-9042).', 'Schedule Update', 'Pending'),
((SELECT id FROM users WHERE username = 'clerk_roy'), 'eFiling document uploaded for case C-2026-9041.', 'In-App', 'Read')
ON CONFLICT DO NOTHING;
