-- Seed data for AI-Powered Case Prioritization & Hearing-Delay Prediction System
-- District Courts Case Management Portal

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

-- 4. Insert Cases
INSERT INTO cases (case_number, title, description, case_type, status, filing_date, priority, priority_score, predicted_delay, judge_id) VALUES
('C-2026-0001', 'State vs. Rakesh Kumar', 'Case related to IPC Section 379 - Theft of commercial cargo truck.', 'Criminal', 'Pending', '2026-01-10', 'High', 85, 45, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma'))),
('C-2026-0002', 'Sharma Realty vs. Gupta & Sons', 'Dispute over commercial rental property lease agreement in Central Plaza.', 'Civil', 'Pending', '2026-02-15', 'Medium', 52, 120, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel'))),
('C-2026-0003', 'Ananya Sen vs. Rahul Sen', 'Petition for child custody and maintenance support.', 'Family', 'Hearing', '2026-03-05', 'High', 91, 15, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_verma'))),
('C-2026-0004', 'State vs. Mohan Singh & Ors.', 'Attempted robbery and criminal conspiracy near National Highway 8.', 'Criminal', 'Hearing', '2026-04-20', 'High', 78, 60, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma'))),
('C-2026-0005', 'Verma Tech vs. Zenith Solutions', 'Breach of software service level agreement and unpaid invoices.', 'Civil', 'Disposed', '2026-01-05', 'Low', 30, 0, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel'))),
('C-2026-0006', 'Mehra Exports vs. Customs Commissioner', 'Customs duty tax appeal case for import shipment.', 'Commercial', 'Pending', '2026-05-12', 'Medium', 45, 180, (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel')))
ON CONFLICT (case_number) DO NOTHING;

-- 5. Insert Predictions (Record historical AI predictions)
INSERT INTO predictions (case_id, priority, priority_score, predicted_delay, reasons) VALUES
((SELECT id FROM cases WHERE case_number = 'C-2026-0001'), 'High', 85, 45, '["Serious Criminal Case", "IPC 379", "Multiple Accused"]'),
((SELECT id FROM cases WHERE case_number = 'C-2026-0002'), 'Medium', 52, 120, '["Commercial Dispute", "Mediation Pending", "Extensive Document Review Needed"]'),
((SELECT id FROM cases WHERE case_number = 'C-2026-0003'), 'High', 91, 15, '["Senior Citizen / Minor Child Involved", "Urgent Maintenance Claim"]'),
((SELECT id FROM cases WHERE case_number = 'C-2026-0004'), 'High', 78, 60, '["Serious Criminal Offense", "IPC 395", "Witness Schedule Backlog"]')
ON CONFLICT DO NOTHING;

-- 6. Insert Hearings
-- Note: '2026-07-24' matches the mock system date to simulate "Today's Hearings"
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments) VALUES
((SELECT id FROM cases WHERE case_number = 'C-2026-0003'), (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_verma')), '2026-07-24 10:30:00', 'Scheduled', 'Courtroom 103', 'Cross-examination of petitioner', 'Urgent child support hearing'),
((SELECT id FROM cases WHERE case_number = 'C-2026-0004'), (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), '2026-07-24 11:30:00', 'Scheduled', 'Courtroom 101', 'Framing of charges', 'Accused to be produced via VC'),
((SELECT id FROM cases WHERE case_number = 'C-2026-0001'), (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_sharma')), '2026-07-28 10:00:00', 'Scheduled', 'Courtroom 101', 'First Hearing / Summons Return', 'Police report verification'),
((SELECT id FROM cases WHERE case_number = 'C-2026-0002'), (SELECT id FROM judges WHERE user_id = (SELECT id FROM users WHERE username = 'judge_patel')), '2026-07-30 14:00:00', 'Scheduled', 'Courtroom 102', 'Argument on interim injunction', 'File reply before date')
ON CONFLICT DO NOTHING;

-- 7. Insert Notifications
INSERT INTO notifications (user_id, message, type, status) VALUES
((SELECT id FROM users WHERE username = 'judge_sharma'), 'High Priority Case State vs. Rakesh Kumar (C-2026-0001) has been assigned to you.', 'Priority Alert', 'Pending'),
((SELECT id FROM users WHERE username = 'judge_verma'), 'Hearing scheduled for Ananya Sen vs. Rahul Sen on 2026-07-24 10:30 AM.', 'Schedule Update', 'Pending'),
((SELECT id FROM users WHERE username = 'clerk_roy'), 'New document uploaded for case C-2026-0003.', 'In-App', 'Read')
ON CONFLICT DO NOTHING;
