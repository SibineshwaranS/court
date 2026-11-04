-- Seed data for AI-Powered Case Prioritization & Hearing-Delay Prediction System
-- Complete Synchronized Dataset (26 eFiling 3.0 Cases matching Deployed Production Environment)

-- 1. Insert Users
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

-- 3. Insert Court Holidays (2026)
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

-- 4. Insert 26 Cases
INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-0102',
  'State vs. Karthik Raja',
  'POCSO offense trial involving minor student protection.',
  'Criminal',
  'Hearing',
  '2026-08-15',
  'High',
  95,
  30,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Tiruchirappalli',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'Karthik Raja',
  'In Judicial Custody',
  false,
  'POCSO Act 2012'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-0109',
  'State vs. Duraimurugan',
  'Medical negligence charge against private hospital director.',
  'Criminal',
  'Hearing',
  '2026-09-05',
  'High',
  92,
  45,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Tanjore',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'Duraimurugan',
  'Bail Granted',
  true,
  'Indian Penal Code (IPC) 304A'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-FC-2026-0003',
  'Ananya Sen vs. Rahul Sen',
  'Petition for child custody and maintenance support.',
  'Family',
  'Disposed',
  '2026-03-05',
  'High',
  91,
  15,
  3,
  'District Family Court',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Ananya Sen',
  'Rahul Sen',
  'N/A',
  false,
  'Hindu Marriage Act 1955'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-0101',
  'State vs. Vikram Singh & Ors.',
  'Multiple cyber banking fraud and money laundering conspiracy.',
  'Criminal',
  'Hearing',
  '2026-08-13',
  'High',
  90,
  50,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Madurai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'Vikram Singh & Ors.',
  'In Judicial Custody',
  false,
  'Prevention of Money Laundering Act (PMLA)'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-9041',
  'State vs. Suresh Malhotra',
  'Pharmaceutical forgery and medical negligence suit.',
  'Criminal',
  'Disposed',
  '2026-07-31',
  'High',
  90,
  50,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'Suresh Malhotra',
  'Bail Granted',
  true,
  'Drugs and Cosmetics Act 1940'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-0106',
  'State vs. Anthonyraj & Ors.',
  'Armed robbery attempt on jewelry transport van.',
  'Criminal',
  'Hearing',
  '2026-08-25',
  'High',
  89,
  75,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Vellore',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'Anthonyraj & Ors.',
  'In Judicial Custody',
  false,
  'Indian Penal Code (IPC)'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-57934',
  'Saraswathi Ammal vs. City Property Developers Ltd',
  'Super Senior Citizen (Age 79) suffering from terminal health condition seeking immediate stay of unlawful eviction and restoration of ancestral property.',
  'Civil',
  'Hearing',
  '2026-09-27',
  'High',
  88,
  7,
  3,
  'District & Sessions Courts of Tamil Nadu',
  'Tamil Nadu',
  'Coimbatore',
  'Principal District Court, Coimbatore',
  'Main Case',
  15000000,
  'Saraswathi Ammal',
  'City Property Developers Ltd',
  'N/A',
  true,
  'Code of Civil Procedure (CPC) & Specific Relief Act'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-FC-2026-0104',
  'Lakshmi Narayanan vs. S. Narayanan',
  'Domestic violence petition and permanent alimony settlement.',
  'Family',
  'Hearing',
  '2026-08-20',
  'High',
  88,
  40,
  3,
  'District Family Court',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Lakshmi Narayanan',
  'S. Narayanan',
  'N/A',
  false,
  'Protection of Women from DV Act 2005'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-97330',
  'K. Murugan vs. The State of Tamil Nadu',
  'Petitioner aged 68 years (Senior Citizen) seeking urgent bail. Accused has been in judicial custody for 95 days without trial commencement. Statutory half-sentence rule under BNSS Sec 479 invoked.',
  'Criminal',
  'Pending',
  '2026-10-17',
  'High',
  85,
  7,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Chennai',
  'High Court of Judicature at Madras',
  'Bail Application',
  0,
  'K. Murugan',
  'The Inspector of Police, B-1 Police Station, Chennai',
  'In Judicial Custody',
  true,
  'POCSO Act 2012 & IPC 376'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CONST-2026-0108',
  'G. Selvam vs. District Collector',
  'Writ of Mandamus for land acquisition compensation settlement.',
  'Constitutional',
  'Hearing',
  '2026-09-01',
  'High',
  85,
  60,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'G. Selvam',
  'District Collector Chennai',
  'N/A',
  true,
  'Constitution of India (Article 226)'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-0001',
  'State vs. Rakesh Kumar',
  'Cargo theft near Chennai Port under IPC Section 379.',
  'Criminal',
  'Hearing',
  '2026-01-10',
  'High',
  80,
  100,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'Rakesh Kumar',
  'In Judicial Custody',
  false,
  'Indian Penal Code (IPC)'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-12568',
  'Saraswathi Ammal vs. City Property Developers Ltd',
  'Super Senior Citizen (Age 79) suffering from terminal health condition seeking immediate stay of unlawful eviction and restoration of ancestral property.',
  'Civil',
  'Pending',
  '2026-10-13',
  'High',
  78,
  7,
  1,
  'District & Sessions Courts of Tamil Nadu',
  'Tamil Nadu',
  'Coimbatore',
  'Principal District Court, Coimbatore',
  'Main Case',
  15000000,
  'Saraswathi Ammal',
  'City Property Developers Ltd',
  'N/A',
  true,
  'Code of Civil Procedure (CPC) & Specific Relief Act'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-64540',
  'Saraswathi Ammal vs. City Property Developers Ltd',
  'Super Senior Citizen (Age 79) suffering from terminal health condition seeking immediate stay of unlawful eviction and restoration of ancestral property.',
  'Civil',
  'Pending',
  '2026-10-17',
  'High',
  75,
  7,
  1,
  'District & Sessions Courts of Tamil Nadu',
  'Tamil Nadu',
  'Coimbatore',
  'Principal District Court, Coimbatore',
  'Main Case',
  15000000,
  'Saraswathi Ammal',
  'City Property Developers Ltd',
  'N/A',
  true,
  'Code of Civil Procedure (CPC) & Specific Relief Act'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-64462',
  'Saraswathi Ammal vs. City Property Developers Ltd',
  'Super Senior Citizen (Age 79) suffering from terminal health condition seeking immediate stay of unlawful eviction and restoration of ancestral property.',
  'Civil',
  'Pending',
  '2026-09-26',
  'High',
  70,
  7,
  1,
  'District & Sessions Courts of Tamil Nadu',
  'Tamil Nadu',
  'Coimbatore',
  'Principal District Court, Coimbatore',
  'Main Case',
  15000000,
  'Saraswathi Ammal',
  'City Property Developers Ltd',
  'N/A',
  true,
  'Code of Civil Procedure (CPC) & Specific Relief Act'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-0004',
  'State vs. Mohan Singh & Ors.',
  'Attempted robbery and criminal conspiracy near National Highway 8.',
  'Criminal',
  'Hearing',
  '2026-04-20',
  'Medium',
  65,
  70,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Madurai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'Mohan Singh & Ors.',
  'Bail Granted',
  false,
  'Indian Penal Code (IPC)'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-FC-2026-0110',
  'Deepa Ranganathan vs. V. Ranganathan',
  'Petition for restitution of conjugal rights and child visitation.',
  'Family',
  'Hearing',
  '2026-09-10',
  'Medium',
  60,
  90,
  3,
  'District Family Court',
  'Tamil Nadu',
  'Coimbatore',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Deepa Ranganathan',
  'V. Ranganathan',
  'N/A',
  false,
  'Hindu Marriage Act 1955'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-2026-0103',
  'K. Swaminathan vs. TNEB Board',
  'Injunction against high tension power transmission over farmland.',
  'Civil',
  'Pending',
  '2026-08-18',
  'Medium',
  55,
  110,
  2,
  'District & Sessions Courts',
  'Tamil Nadu',
  'Erode',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'K. Swaminathan',
  'TNEB Electricity Board',
  'N/A',
  true,
  'Electricity Act 2003'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-2026-0002',
  'Sharma Realty vs. Gupta & Sons',
  'Dispute over commercial rental property lease agreement.',
  'Civil',
  'Hearing',
  '2026-02-15',
  'Medium',
  52,
  120,
  2,
  'District & Sessions Courts',
  'Tamil Nadu',
  'Coimbatore',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Sharma Realty',
  'Gupta & Sons',
  'N/A',
  false,
  'Code of Civil Procedure (CPC)'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-COMM-2026-0111',
  'Titan Watches vs. Fake Retailers',
  'Trademark infringement suit against counterfeit watch sellers.',
  'Commercial',
  'Pending',
  '2026-09-12',
  'Medium',
  50,
  100,
  2,
  'Madras High Court - Commercial Division',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Titan Watches Ltd',
  'Fake Replica Retailers',
  'N/A',
  false,
  'Trademarks Act 1999'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CS-2026-9042',
  'Dinesh Exports vs. Zenith Logistics',
  'Commercial shipping freight damage and breach of contract suit.',
  'Civil',
  'Hearing',
  '2026-07-31',
  'Medium',
  50,
  90,
  2,
  'District & Sessions Courts',
  'Tamil Nadu',
  'Coimbatore',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Dinesh Exports',
  'Zenith Logistics',
  'N/A',
  false,
  'Indian Contract Act 1872'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-COMM-2026-0105',
  'Preethi Apparels vs. Tirupur Hub',
  'Commercial garment export breach of contract claim.',
  'Commercial',
  'Pending',
  '2026-08-22',
  'Medium',
  48,
  140,
  2,
  'Madras High Court - Commercial Division',
  'Tamil Nadu',
  'Tiruppur',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Preethi Apparels',
  'Tirupur Textile Hub',
  'N/A',
  false,
  'Commercial Courts Act 2015'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-COMM-2026-0006',
  'Mehra Exports vs. Customs Commissioner',
  'Customs duty tax appeal case for import shipment.',
  'Commercial',
  'Hearing',
  '2026-05-12',
  'Medium',
  45,
  180,
  2,
  'Madras High Court - Commercial Division',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Mehra Exports',
  'Customs Commissioner',
  'N/A',
  false,
  'Customs Act 1962'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-E2E-007382',
  'E2E Automated Postman Test Suit vs. City Municipal Corp',
  'Automated test suite case registration verifying 8-step eFiling pipeline.',
  'Civil',
  'Hearing',
  '2026-09-25',
  'Medium',
  40,
  90,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'E2E Test Petitioner',
  'City Municipal Corp',
  'N/A',
  false,
  'Code of Civil Procedure (CPC)'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-2026-0107',
  'Sundaram Finance vs. M. K. Logistics',
  'Recovery of hypothecated commercial vehicle fleets.',
  'Civil',
  'Disposed',
  '2026-08-28',
  'Low',
  35,
  60,
  2,
  'District & Sessions Courts',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Sundaram Finance',
  'M. K. Logistics',
  'N/A',
  false,
  'Arbitration & Conciliation Act'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-OS-2026-0005',
  'Verma Tech vs. Zenith Solutions',
  'Breach of software service level agreement and unpaid invoices.',
  'Civil',
  'Disposed',
  '2026-01-05',
  'Low',
  30,
  60,
  2,
  'District & Sessions Courts',
  'Tamil Nadu',
  'Salem',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'Verma Tech',
  'Zenith Solutions',
  'N/A',
  false,
  'Indian Contract Act 1872'
) ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (
  case_number, title, description, case_type, status, filing_date,
  priority, priority_score, predicted_delay, judge_id,
  bench, state, district, court_establishment, filing_type, valuation_amount,
  petitioner_name, respondent_name, custody_status, is_senior_citizen, legal_act
) VALUES (
  'TN-CRL-2026-0112',
  'State vs. S. Jayakumar',
  'Seizure of commercial quantity narcotics under NDPS act.',
  'Criminal',
  'Disposed',
  '2026-09-15',
  'Low',
  22,
  90,
  1,
  'Madras High Court - Principal Bench',
  'Tamil Nadu',
  'Chennai',
  'Principal District & Sessions Court',
  'Main Case',
  0,
  'State of Tamil Nadu',
  'S. Jayakumar',
  'In Judicial Custody',
  false,
  'NDPS Act 1985'
) ON CONFLICT (case_number) DO NOTHING;

-- 5. Insert Hearings
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-09-21T10:00:00.000Z', 'Rescheduled', 'Courtroom 101', 'Framing of charges', ''
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 89);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-09-28T04:30:00.000Z', 'Scheduled', 'Courtroom 101', 'Framing of charges', ''
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 89);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 2, '2026-09-30T04:30:00.000Z', 'Cancelled', 'Courtroom 102', 'Framing of charges', ''
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 83);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 3, '2026-09-30T04:30:00.000Z', 'Scheduled', 'Courtroom 103', 'Framing of charges', ''
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 73);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 2, '2026-10-01T04:30:00.000Z', 'Rescheduled', 'Courtroom 102', 'Framing of charges', ''
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 88);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-14T04:30:00.000Z', 'Scheduled', 'Courtroom 101', 'Framing of charges', ''
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 76);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-20T05:00:00.000Z', 'Scheduled', 'Courtroom 101', 'Framing of Charges', 'Regular listing scheduled for Criminal proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 77);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 2, '2026-10-20T06:00:00.000Z', 'Scheduled', 'Courtroom 102', 'Issues Settlement', 'Regular listing scheduled for Civil proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 84);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-21T04:30:00.000Z', 'Scheduled', 'Courtroom 101', 'Framing of charges', ''
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 67);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-21T04:30:00.000Z', 'Scheduled', 'Courtroom 101', 'Bail & Custody Argument', 'Regular listing scheduled for Criminal proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 81);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 2, '2026-10-21T08:30:00.000Z', 'Scheduled', 'Courtroom 102', 'Trial Arguments', 'Regular listing scheduled for Civil proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 86);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-22T05:00:00.000Z', 'Scheduled', 'Courtroom 101', 'Framing of Charges', 'Regular listing scheduled for Criminal proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 70);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 3, '2026-10-22T06:00:00.000Z', 'Scheduled', 'Courtroom 103', 'Child Custody Arguments', 'Regular listing scheduled for Family proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 74);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-23T04:30:00.000Z', 'Scheduled', 'Courtroom 101', 'Bail & Custody Argument', 'Regular listing scheduled for Criminal proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 72);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-23T09:00:00.000Z', 'Scheduled', 'Courtroom 101', 'Cross Examination', 'Regular listing scheduled for Criminal proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 68);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 3, '2026-10-26T05:00:00.000Z', 'Scheduled', 'Courtroom 103', 'Child Custody Arguments', 'Regular listing scheduled for Family proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 82);
INSERT INTO hearings (case_id, judge_id, hearing_date, status, courtroom, purpose, comments)
SELECT id, 1, '2026-10-26T06:00:00.000Z', 'Completed', 'Courtroom 101', 'Prosecution Evidence', 'Regular listing scheduled for Criminal proceeding.'
FROM cases WHERE case_number = (SELECT case_number FROM cases WHERE id = 92);


-- 5. Insert Government & Expert Witnesses Registry
INSERT INTO witnesses (name, designation, department, station_or_hospital, badge_number, phone, email) VALUES
('Inspector M. Ravichandran', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Anna Nagar PS, Chennai', 'TNP-4091', '+91 94440 12345', 'm.ravichandran@tnpolice.gov.in'),
('Dr. K. Meenakshi', 'Chief Medical Officer / Forensic Surgeon', 'Health Department', 'Kilpauk Medical College Hospital', 'DOC-KMCH-882', '+91 98840 54321', 'dr.meenakshi@kmch.tn.gov.in'),
('Thiru S. Gunasekaran', 'Forensic Ballistics Expert', 'Forensic Sciences Dept', 'State Forensic Science Lab, Chennai', 'FSL-BAL-104', '+91 97720 98765', 's.gunasekaran@forensic.tn.gov.in'),
('Sub-Inspector P. Arumugam', 'Investigating Officer (IO)', 'Tamil Nadu Police', 'Coimbatore City PS', 'TNP-8821', '+91 94432 11223', 'p.arumugam@tnpolice.gov.in'),
('Dr. R. Soundararajan', 'Senior Forensic Pathologist', 'Health Department', 'Salem Govt Mohan Kumaramangalam Hospital', 'DOC-SLM-301', '+91 94421 88990', 'dr.soundararajan@salemgh.tn.gov.in'),
('Inspector S. Balamurugan', 'Cyber Crime Wing / Digital Forensics', 'Tamil Nadu Police', 'Madurai Central PS', 'TNP-CYB-552', '+91 94450 66778', 's.balamurugan@tnpolice.gov.in');

-- 6. Insert Witness Availability Schedule
INSERT INTO witness_availability (witness_id, date, status, remarks) VALUES
(1, CURRENT_DATE + INTERVAL '1 day', 'Busy - Other Court', 'Deposing in City Sessions Court, Chennai'),
(1, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available for Session'),
(2, CURRENT_DATE + INTERVAL '2 days', 'Emergency Duty', 'Emergency post-mortem duty'),
(2, CURRENT_DATE + INTERVAL '4 days', 'Available', 'Available for Virtual VC'),
(3, CURRENT_DATE + INTERVAL '1 day', 'Available', 'Ballistics lab analysis completed'),
(4, CURRENT_DATE + INTERVAL '2 days', 'On Leave', 'Medical leave'),
(5, CURRENT_DATE + INTERVAL '3 days', 'Available', 'Available in Salem jurisdiction'),
(6, CURRENT_DATE + INTERVAL '2 days', 'Available', 'Cyber cell report ready');
