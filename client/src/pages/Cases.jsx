import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal,
  X,
  Scale
} from 'lucide-react';

const Cases = () => {
  const { user } = useAuth();
  
  // Cases list state
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [judges, setJudges] = useState([]);
  
  // Search and Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  // Wizard & Form State for TN eFiling 3.0
  const [currentStep, setCurrentStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState({
    plaint_pdf: null,
    vakalatnama_pdf: null,
    impugned_order_pdf: null
  });

  const initialCaseState = {
    case_number: `TN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    title: '',
    description: '',
    case_type: 'Criminal',
    filing_date: new Date().toISOString().split('T')[0],
    judge_id: '',
    bench: 'Madras High Court - Principal Bench',
    state: 'Tamil Nadu',
    district: 'Chennai',
    court_establishment: 'Principal District & Sessions Court',
    filing_type: 'Main Case',
    valuation_amount: '0',
    advocate_name: '',
    bar_enrollment_number: 'MS/',
    advocate_phone: '',
    petitioner_name: '',
    petitioner_type: 'Individual',
    petitioner_age: '45',
    petitioner_gender: 'Male',
    is_senior_citizen: false,
    is_differently_abled: false,
    is_terminally_ill: false,
    petitioner_phone: '',
    petitioner_email: '',
    petitioner_address: '',
    respondent_name: '',
    respondent_type: 'Individual',
    respondent_address: '',
    legal_act: 'Indian Penal Code (IPC)',
    legal_section: '302, 34',
    police_station: 'Anna Nagar PS, Chennai',
    fir_number: '',
    fir_year: new Date().getFullYear().toString(),
    custody_status: 'N/A',
    detention_days: '0',
    lower_court_name: '',
    lower_court_case_number: '',
    lower_court_order_date: '',
    caveat_filed: false,
    caveat_number: '',
    egras_grn_number: '',
    court_fee_paid: '500',
    cause_of_action_date: '',
    cause_of_action_place: 'Chennai',
    trial_stage: 'Filing & Scrutiny'
  };

  const [newCase, setNewCase] = useState(initialCaseState);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill Sample Data for Testing
  const handleAutoFillSample = (sampleType = 'bail') => {
    if (sampleType === 'bail') {
      setNewCase({
        ...initialCaseState,
        case_number: `TN-CRL-${Math.floor(10000 + Math.random() * 90000)}`,
        title: 'K. Murugan vs. The State of Tamil Nadu',
        case_type: 'Criminal',
        filing_type: 'Bail Application',
        bench: 'Madras High Court - Principal Bench',
        district: 'Chennai',
        court_establishment: 'High Court of Judicature at Madras',
        advocate_name: 'P. Ramanathan, Advocate',
        bar_enrollment_number: 'MS/1420/2018',
        advocate_phone: '9840192837',
        petitioner_name: 'K. Murugan',
        petitioner_age: '68',
        is_senior_citizen: true,
        is_differently_abled: false,
        is_terminally_ill: false,
        petitioner_phone: '9841029384',
        petitioner_address: 'No. 42, South Mada Street, Mylapore, Chennai - 600004',
        respondent_name: 'The Inspector of Police, B-1 Police Station, Chennai',
        respondent_type: 'State of Tamil Nadu / Govt Dept',
        respondent_address: 'B-1 Police Station, Chennai',
        legal_act: 'POCSO Act 2012 & IPC 376',
        legal_section: 'Sec 6 POCSO & Sec 376 IPC',
        police_station: 'All Women Police Station, Mylapore',
        fir_number: '142',
        fir_year: '2026',
        custody_status: 'In Judicial Custody',
        detention_days: '95',
        egras_grn_number: `TNGRN${Date.now().toString().slice(-8)}`,
        court_fee_paid: '750',
        cause_of_action_date: '2026-05-10',
        cause_of_action_place: 'Mylapore, Chennai',
        trial_stage: 'Framing of Charges',
        description: 'Petitioner aged 68 years (Senior Citizen) seeking urgent bail. Accused has been in judicial custody for 95 days without trial commencement. Statutory half-sentence rule under BNSS Sec 479 invoked.'
      });
    } else {
      setNewCase({
        ...initialCaseState,
        case_number: `TN-OS-${Math.floor(10000 + Math.random() * 90000)}`,
        title: 'Saraswathi Ammal vs. City Property Developers Ltd',
        case_type: 'Civil',
        filing_type: 'Main Case',
        bench: 'District & Sessions Courts of Tamil Nadu',
        district: 'Coimbatore',
        court_establishment: 'Principal District Court, Coimbatore',
        advocate_name: 'S. Vijayaraghavan, Senior Advocate',
        bar_enrollment_number: 'MS/892/2012',
        advocate_phone: '9443102938',
        petitioner_name: 'Saraswathi Ammal',
        petitioner_age: '79',
        is_senior_citizen: true,
        is_differently_abled: true,
        is_terminally_ill: true,
        petitioner_phone: '9443192837',
        petitioner_address: '74, Avinashi Road, Peelamedu, Coimbatore - 641004',
        respondent_name: 'City Property Developers Ltd',
        respondent_type: 'Organization / Company',
        respondent_address: '102, DB Road, RS Puram, Coimbatore',
        legal_act: 'Code of Civil Procedure (CPC) & Specific Relief Act',
        legal_section: 'Order 39 Rules 1 & 2 CPC',
        valuation_amount: '15000000',
        egras_grn_number: `TNGRN${Date.now().toString().slice(-8)}`,
        court_fee_paid: '15000',
        cause_of_action_date: '2026-06-01',
        cause_of_action_place: 'Peelamedu, Coimbatore',
        trial_stage: 'Final Arguments',
        description: 'Super Senior Citizen (Age 79) suffering from terminal health condition seeking immediate stay of unlawful eviction and restoration of ancestral property.'
      });
    }
  };

  // Fetch judges list for select option
  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const res = await api.get('/auth/judges');
        setJudges(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching judges', err);
        setJudges([]);
      }
    };
    if (showModal) fetchJudges();
  }, [showModal]);

  // Fetch cases whenever filter inputs or pagination changes
  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        status: statusFilter,
        priority: priorityFilter,
        case_type: typeFilter,
        page,
        limit: 8
      };
      
      if (user.role === 'Judge' && user.judgeId) {
        params.judge_id = user.judgeId;
      }

      const res = await api.get('/cases', { params });
      setCases(Array.isArray(res.data?.cases) ? res.data.cases : []);
      setTotalPages(res.data?.meta?.pages || 1);
      setTotalCases(res.data?.meta?.total || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setCases([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter, priorityFilter, typeFilter, page, user]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setTypeFilter('');
    setPage(1);
  };

  // Handle Multi-part Case Registration
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    // Do not submit form if user is navigating intermediate steps (1-7)
    if (currentStep < 8) {
      setCurrentStep(prev => Math.min(8, prev + 1));
      return;
    }
    setModalError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.keys(newCase).forEach(key => {
        if (newCase[key] !== '' && newCase[key] !== null) {
          formData.append(key, newCase[key]);
        }
      });

      if (files.plaint_pdf) formData.append('plaint_pdf', files.plaint_pdf);
      if (files.vakalatnama_pdf) formData.append('vakalatnama_pdf', files.vakalatnama_pdf);
      if (files.impugned_order_pdf) formData.append('impugned_order_pdf', files.impugned_order_pdf);

      await api.post('/cases', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowModal(false);
      setCurrentStep(1);
      setNewCase(initialCaseState);
      setFiles({ plaint_pdf: null, vakalatnama_pdf: null, impugned_order_pdf: null });
      fetchCases();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error registering eFiling case. Check input fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCase = async (id, num) => {
    if (!window.confirm(`Are you sure you want to permanently delete case ${num}?`)) return;
    try {
      await api.delete(`/cases/${id}`);
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting case');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header view */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-gray-800 dark:text-white flex items-center gap-2">
            <span>🏛️ Court Case Docket</span>
            <span className="text-xs bg-court-500/10 text-court-600 dark:text-court-400 font-bold px-2.5 py-1 rounded-full">
              7-Vector Judicial Matrix Active
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.role === 'Judge' ? 'Roster of assigned cases' : 'Register, filter and manage lawsuit dockets'} &bull; {totalCases} Cases found
          </p>
        </div>
        
        {/* Register Case button */}
        {(user.role === 'Administrator' || user.role === 'Court Clerk') && (
          <button
            onClick={() => { setShowModal(true); setCurrentStep(1); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-court-500 hover:bg-court-400 text-white font-semibold text-sm rounded-xl shadow-md shadow-court-500/10 active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            <span>Register Case</span>
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 dark:bg-court-900 dark:border-court-850 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by case # or title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-court-950 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-court-800 text-sm">
            <span className="text-gray-400"><SlidersHorizontal size={14} /></span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none dark:text-white font-medium text-xs pr-2"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Hearing">Hearing</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-court-950 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-court-800 text-sm">
            <span className="text-gray-400"><Filter size={14} /></span>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none dark:text-white font-medium text-xs pr-2"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-court-950 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-court-800 text-sm">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none dark:text-white font-medium text-xs pr-2"
            >
              <option value="">All Types</option>
              <option value="Criminal">Criminal</option>
              <option value="Civil">Civil</option>
              <option value="Family">Family</option>
              <option value="Commercial">Commercial</option>
              <option value="Constitutional">Constitutional</option>
            </select>
          </div>

          {(search || statusFilter || priorityFilter || typeFilter) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-court-800 dark:hover:bg-court-700 text-xs font-bold rounded-xl transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Grid or Table list of cases */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden dark:bg-court-900 dark:border-court-800 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⚖️</span>
            <h3 className="font-outfit font-bold text-lg text-gray-700 dark:text-court-300">
              No cases logged
            </h3>
            <p className="text-sm text-gray-400 dark:text-court-400 max-w-sm mt-1">
              Try adjusting your query filter, search string, or register a new case records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider dark:bg-court-950 dark:border-court-800 dark:text-court-300">
                  <th className="px-6 py-4">Case #</th>
                  <th className="px-6 py-4">Title / Parties</th>
                  <th className="px-6 py-4">Type / Bench</th>
                  <th className="px-6 py-4">AI Priority & Risk</th>
                  <th className="px-6 py-4">Filing Date</th>
                  <th className="px-6 py-4">Presiding Judge</th>
                  <th className="px-6 py-4">Status</th>
                  {user.role === 'Administrator' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-court-800 text-sm">
                {(Array.isArray(cases) ? cases : []).map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-gray-50/50 dark:hover:bg-court-950/25 transition-colors"
                  >
                    <td className="px-6 py-4 font-outfit font-extrabold text-court-700 dark:text-court-300">
                      <Link to={`/cases/${c.id}`} className="hover:underline">
                        {c.case_number}
                      </Link>
                      {c.is_senior_citizen && (
                        <span className="block mt-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          👵 Senior Citizen
                        </span>
                      )}
                      {c.custody_status === 'In Judicial Custody' && (
                        <span className="block text-[10px] font-bold text-red-600 dark:text-red-400">
                          ⛓️ In Custody ({c.detention_days || 0}d)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white max-w-xs truncate">
                      <Link to={`/cases/${c.id}`} className="hover:underline">
                        {c.title}
                      </Link>
                      <span className="block text-xs font-normal text-gray-400 truncate">
                        {c.advocate_name ? `Adv: ${c.advocate_name}` : c.legal_act || ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium dark:text-gray-300">
                      <span className="font-bold text-gray-700 dark:text-white">{c.case_type}</span>
                      <span className="block text-[11px] text-gray-400">{c.bench ? c.bench.split('-')[0] : 'Madras HC'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          c.priority === 'High' ? 'bg-red-500' : c.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-medium dark:text-white">
                          {c.priority} ({c.priority_score}%)
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">Est delay: ~{c.predicted_delay || 0}d</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-court-400">
                      {new Date(c.filing_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700 dark:text-court-300 font-medium">
                      {c.judge_name || <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'Pending' 
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' 
                          : c.status === 'Hearing'
                          ? 'bg-blue-50 text-court-700 dark:bg-court-950/40 dark:text-court-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    {user.role === 'Administrator' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteCase(c.id, c.case_number)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                          title="Delete Case"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-150 dark:border-court-850">
            <span className="text-xs text-gray-500 dark:text-court-400">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-gray-250 dark:border-court-800 rounded-lg text-gray-500 dark:text-court-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-court-800 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-gray-250 dark:border-court-800 rounded-lg text-gray-500 dark:text-court-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-court-800 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tamil Nadu eFiling 3.0 Multi-Step Registration Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl bg-white border border-gray-200 dark:bg-court-900 dark:border-court-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up max-h-[92vh] flex flex-col">
            
            {/* Header & Quick Action Fillers */}
            <div className="px-6 py-4 border-b border-gray-150 dark:border-court-850 bg-gray-50 dark:bg-court-950 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-court-500 text-white shadow-lg shadow-court-500/20">
                  <Scale size={22} />
                </div>
                <div>
                  <h3 className="font-outfit font-extrabold text-lg dark:text-white flex items-center gap-2">
                    Case Registration Portal
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-court-400">
                    District Courts & High Court Standard Registration &bull; Step {currentStep} of 8
                  </p>
                </div>
              </div>

              {/* Sample Filler Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAutoFillSample('bail')}
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-lg text-xs font-bold transition-all"
                  title="Fill Criminal Bail Case Sample"
                >
                  ⚡ Fill Bail Case
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoFillSample('senior')}
                  className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 rounded-lg text-xs font-bold transition-all"
                  title="Fill Senior Citizen Injunction Sample"
                >
                  👵 Fill Senior Citizen Case
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-court-800 text-gray-400 rounded-full transition-all ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Stepper Nav Bar */}
            <div className="px-6 py-3 bg-gray-100/70 dark:bg-court-950/60 border-b border-gray-200 dark:border-court-850 overflow-x-auto flex items-center gap-2 text-xs">
              {[
                { id: 1, title: '1. Jurisdiction' },
                { id: 2, title: '2. Advocate' },
                { id: 3, title: '3. Petitioner' },
                { id: 4, title: '4. Respondent' },
                { id: 5, title: '5. Acts & Police' },
                { id: 6, title: '6. Caveat & Fee' },
                { id: 7, title: '7. Facts & AI' },
                { id: 8, title: '8. Upload & Submit' }
              ].map((step) => (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                    currentStep === step.id
                      ? 'bg-court-500 text-white shadow-sm'
                      : currentStep > step.id
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-court-800'
                  }`}
                >
                  {step.title}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {modalError}
                </div>
              )}

              {/* STEP 1: Jurisdiction & Case Type */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2">
                    Step 1: Court Establishment & Jurisdiction
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        High Court Bench / District System *
                      </label>
                      <select
                        value={newCase.bench}
                        onChange={(e) => setNewCase({ ...newCase, bench: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Madras High Court - Principal Bench">Madras High Court - Principal Bench (Chennai)</option>
                        <option value="Madras High Court - Madurai Bench">Madras High Court - Madurai Bench</option>
                        <option value="District & Sessions Courts of Tamil Nadu">District & Sessions Courts of Tamil Nadu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        District Location *
                      </label>
                      <select
                        value={newCase.district}
                        onChange={(e) => setNewCase({ ...newCase, district: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        {['Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Kanchipuram', 'Erode', 'Vellore', 'Thanjavur', 'Cuddalore'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Court Establishment Complex *
                      </label>
                      <select
                        value={newCase.court_establishment}
                        onChange={(e) => setNewCase({ ...newCase, court_establishment: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="High Court of Judicature at Madras">High Court of Judicature at Madras</option>
                        <option value="Principal District & Sessions Court">Principal District & Sessions Court</option>
                        <option value="City Civil Court Chennai">City Civil Court Chennai</option>
                        <option value="Family Court">Family Court Complex</option>
                        <option value="Commercial Court">Commercial Court</option>
                        <option value="Chief Metropolitan Magistrate Court">Chief Metropolitan Magistrate Court</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Case Filing Type *
                      </label>
                      <select
                        value={newCase.filing_type}
                        onChange={(e) => setNewCase({ ...newCase, filing_type: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Main Case">Main Case / New Suit</option>
                        <option value="Bail Application">Bail / Anticipatory Bail Application</option>
                        <option value="Interlocutory Application">Interlocutory Application (IA)</option>
                        <option value="Appeal">Appeal (CMA / AS / WA)</option>
                        <option value="Revision">Revision Petition</option>
                        <option value="Caveat">Caveat Petition</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Case Category *
                      </label>
                      <select
                        value={newCase.case_type}
                        onChange={(e) => setNewCase({ ...newCase, case_type: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Criminal">Criminal</option>
                        <option value="Civil">Civil</option>
                        <option value="Family">Family</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Constitutional">Constitutional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Claim Valuation Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={newCase.valuation_amount}
                        onChange={(e) => setNewCase({ ...newCase, valuation_amount: e.target.value })}
                        placeholder="e.g. 500000"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Advocate / Bar Details */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2">
                    Step 2: Filing Advocate & Bar Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Advocate Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCase.advocate_name}
                        onChange={(e) => setNewCase({ ...newCase, advocate_name: e.target.value })}
                        placeholder="e.g. P. Ramanathan, Advocate"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        TN Bar Council Enrollment Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCase.bar_enrollment_number}
                        onChange={(e) => setNewCase({ ...newCase, bar_enrollment_number: e.target.value })}
                        placeholder="e.g. MS/1420/2018"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm font-mono"
                      />
                      <span className="text-[11px] text-gray-400">Verified against Tamil Nadu Bar Council Database</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Advocate Mobile Number (For e-Notices) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCase.advocate_phone}
                        onChange={(e) => setNewCase({ ...newCase, advocate_phone: e.target.value })}
                        placeholder="e.g. 9840192837"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Petitioner / Complainant */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2 flex items-center justify-between">
                    <span>Step 3: Petitioner / Complainant Details (Litigant 1)</span>
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
                      Vector 1: Vulnerability Factor
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Petitioner Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCase.petitioner_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCase(prev => ({ 
                            ...prev, 
                            petitioner_name: val,
                            title: val && prev.respondent_name ? `${val} vs. ${prev.respondent_name}` : val || prev.title
                          }));
                        }}
                        placeholder="e.g. K. Murugan OR Saraswathi Ammal"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Litigant Type
                      </label>
                      <select
                        value={newCase.petitioner_type}
                        onChange={(e) => setNewCase({ ...newCase, petitioner_type: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Individual">Individual</option>
                        <option value="Organization">Organization / Company</option>
                        <option value="State of Tamil Nadu">State of Tamil Nadu / Govt Dept</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Age (Years) *
                      </label>
                      <input
                        type="number"
                        value={newCase.petitioner_age}
                        onChange={(e) => {
                          const ageVal = parseInt(e.target.value || 0, 10);
                          setNewCase({ 
                            ...newCase, 
                            petitioner_age: e.target.value,
                            is_senior_citizen: ageVal >= 60 
                          });
                        }}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Gender
                      </label>
                      <select
                        value={newCase.petitioner_gender}
                        onChange={(e) => setNewCase({ ...newCase, petitioner_gender: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                    </div>
                  </div>

                  {/* Vulnerability Checkboxes for Vector 1 */}
                  <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-2">
                    <span className="block text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      ⚖️ AI Priority Vulnerability Factors (Vector 1)
                    </span>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCase.is_senior_citizen}
                          onChange={(e) => setNewCase({ ...newCase, is_senior_citizen: e.target.checked })}
                          className="w-4 h-4 text-court-500 rounded focus:ring-court-400"
                        />
                        <span>👵 Senior Citizen (Age ≥ 60) [+20 AI Points]</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCase.is_differently_abled}
                          onChange={(e) => setNewCase({ ...newCase, is_differently_abled: e.target.checked })}
                          className="w-4 h-4 text-court-500 rounded focus:ring-court-400"
                        />
                        <span>♿ Differently Abled Person (PwD) [+20 AI Points]</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCase.is_terminally_ill}
                          onChange={(e) => setNewCase({ ...newCase, is_terminally_ill: e.target.checked })}
                          className="w-4 h-4 text-court-500 rounded focus:ring-court-400"
                        />
                        <span>🏥 Terminally Ill / Severe Health [+35 AI Points]</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                      Full Address in Tamil Nadu
                    </label>
                    <textarea
                      rows={2}
                      value={newCase.petitioner_address}
                      onChange={(e) => setNewCase({ ...newCase, petitioner_address: e.target.value })}
                      placeholder="Door No, Street Name, Village/Town, Pincode"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Respondent / Defendant */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2">
                    Step 4: Respondent / Defendant Details (Litigant 2)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Respondent Name / Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCase.respondent_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCase(prev => ({
                            ...prev,
                            respondent_name: val,
                            title: prev.petitioner_name ? `${prev.petitioner_name} vs. ${val}` : val
                          }));
                        }}
                        placeholder="e.g. The Inspector of Police, B-1 PS OR City Property Developers Ltd"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Respondent Type
                      </label>
                      <select
                        value={newCase.respondent_type}
                        onChange={(e) => setNewCase({ ...newCase, respondent_type: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Individual">Individual</option>
                        <option value="Organization">Organization / Company</option>
                        <option value="State of Tamil Nadu / Govt Dept">State of Tamil Nadu / Govt Dept</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                      Respondent Address
                    </label>
                    <textarea
                      rows={2}
                      value={newCase.respondent_address}
                      onChange={(e) => setNewCase({ ...newCase, respondent_address: e.target.value })}
                      placeholder="Address details of defendant/respondent"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Legal Acts, Police & Lower Court */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2 flex items-center justify-between">
                    <span>Step 5: Legal Acts, Police Station & Lower Court</span>
                    <span className="text-xs bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-bold px-2 py-0.5 rounded">
                      Vectors 2 & 3: Liberty & Offense Gravity
                    </span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Primary Legal Act *
                      </label>
                      <select
                        value={newCase.legal_act}
                        onChange={(e) => setNewCase({ ...newCase, legal_act: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Indian Penal Code (IPC)">IPC / Bharatiya Nyaya Sanhita (BNS)</option>
                        <option value="POCSO Act 2012 & IPC 376">POCSO Act 2012 (Child Protection)</option>
                        <option value="Domestic Violence Act 2005">Domestic Violence Act 2005</option>
                        <option value="Code of Civil Procedure (CPC)">Code of Civil Procedure (CPC)</option>
                        <option value="Negotiable Instruments Act Sec 138">Negotiable Instruments Act Sec 138</option>
                        <option value="Commercial Courts Act 2015">Commercial Courts Act 2015</option>
                        <option value="SC/ST Prevention of Atrocities Act">SC/ST Prevention of Atrocities Act</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Sections Enforced
                      </label>
                      <input
                        type="text"
                        value={newCase.legal_section}
                        onChange={(e) => setNewCase({ ...newCase, legal_section: e.target.value })}
                        placeholder="e.g. 302, 307, 34 OR 138"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Police Station & Custody Status (Vector 2) */}
                  <div className="p-4 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl space-y-3">
                    <span className="block text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
                      ⛓️ Police Station & Undertrial Custody Parameters (BNSS Sec 479)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-court-300 mb-1">
                          Police Station Name
                        </label>
                        <input
                          type="text"
                          value={newCase.police_station}
                          onChange={(e) => setNewCase({ ...newCase, police_station: e.target.value })}
                          placeholder="e.g. All Women PS Mylapore"
                          className="w-full px-3 py-2 bg-white dark:bg-court-950 border border-gray-200 dark:border-court-800 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-court-300 mb-1">
                          FIR Number & Year
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newCase.fir_number}
                            onChange={(e) => setNewCase({ ...newCase, fir_number: e.target.value })}
                            placeholder="FIR #"
                            className="w-1/2 px-3 py-2 bg-white dark:bg-court-950 border border-gray-200 dark:border-court-800 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={newCase.fir_year}
                            onChange={(e) => setNewCase({ ...newCase, fir_year: e.target.value })}
                            placeholder="Year"
                            className="w-1/2 px-3 py-2 bg-white dark:bg-court-950 border border-gray-200 dark:border-court-800 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-court-300 mb-1">
                          Custody Status *
                        </label>
                        <select
                          value={newCase.custody_status}
                          onChange={(e) => setNewCase({ ...newCase, custody_status: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-court-950 border border-gray-200 dark:border-court-800 rounded-lg text-xs font-bold text-red-600 dark:text-red-400"
                        >
                          <option value="N/A">N/A (Not in Custody / Civil)</option>
                          <option value="In Judicial Custody">In Judicial Custody (Prison) [+30 Points]</option>
                          <option value="On Bail">On Bail</option>
                          <option value="Absconding">Absconding</option>
                        </select>
                      </div>
                    </div>

                    {newCase.custody_status === 'In Judicial Custody' && (
                      <div>
                        <label className="block text-xs font-bold text-red-700 dark:text-red-400 mb-1">
                          Days Spent in Judicial Custody (Under BNSS Sec 479 / CrPC 436A):
                        </label>
                        <input
                          type="number"
                          value={newCase.detention_days}
                          onChange={(e) => setNewCase({ ...newCase, detention_days: e.target.value })}
                          placeholder="Number of days in jail"
                          className="w-full px-3 py-2 bg-white dark:bg-court-950 border border-red-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 6: Caveat & Court Fee eGRAS */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2">
                    Step 6: Caveat Search & TN eGRAS Court Fee Payment
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-court-950 rounded-2xl border border-gray-200 dark:border-court-800">
                      <label className="flex items-center gap-2 font-semibold text-xs text-gray-700 dark:text-white mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCase.caveat_filed}
                          onChange={(e) => setNewCase({ ...newCase, caveat_filed: e.target.checked })}
                          className="w-4 h-4 text-court-500 rounded"
                        />
                        <span>Caveat Notice Filed against this Case?</span>
                      </label>
                      {newCase.caveat_filed && (
                        <input
                          type="text"
                          value={newCase.caveat_number}
                          onChange={(e) => setNewCase({ ...newCase, caveat_number: e.target.value })}
                          placeholder="Caveat Registration # e.g. CAV/104/2026"
                          className="w-full px-3 py-2 bg-white dark:bg-court-900 border border-gray-200 dark:border-court-800 rounded-lg text-xs font-mono"
                        />
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-court-950 rounded-2xl border border-gray-200 dark:border-court-800 space-y-2">
                      <span className="block text-xs font-bold text-gray-700 dark:text-white">
                        💳 TN eGRAS Court Fee Receipt (pay.ecourts.gov.in)
                      </span>
                      <div>
                        <input
                          type="text"
                          value={newCase.egras_grn_number}
                          onChange={(e) => setNewCase({ ...newCase, egras_grn_number: e.target.value })}
                          placeholder="TN eGRAS GRN # e.g. TNGRN202609258814"
                          className="w-full px-3 py-2 bg-white dark:bg-court-900 border border-gray-200 dark:border-court-800 rounded-lg text-xs font-mono mb-2"
                        />
                        <input
                          type="number"
                          value={newCase.court_fee_paid}
                          onChange={(e) => setNewCase({ ...newCase, court_fee_paid: e.target.value })}
                          placeholder="Court Fee Paid Amount (₹)"
                          className="w-full px-3 py-2 bg-white dark:bg-court-900 border border-gray-200 dark:border-court-800 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Cause of Action & Case Facts (AI Input) */}
              {currentStep === 7 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2 flex items-center justify-between">
                    <span>Step 7: Cause of Action, Trial Stage & AI Analytical Input</span>
                    <span className="text-xs bg-court-500 text-white font-bold px-2 py-0.5 rounded">
                      Vectors 4, 5, 6: AI Engine Core
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Current Trial Stage *
                      </label>
                      <select
                        value={newCase.trial_stage}
                        onChange={(e) => setNewCase({ ...newCase, trial_stage: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="Filing & Scrutiny">Filing & Scrutiny (New Case)</option>
                        <option value="Framing of Charges">Framing of Charges / Summons</option>
                        <option value="Prosecution Evidence">Prosecution Evidence (PW Witnesses)</option>
                        <option value="Defense Evidence">Defense Evidence / 313 Statement</option>
                        <option value="Final Arguments">Final Arguments (Targeted Disposal) [+25 Points]</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                        Assigned Presiding Judge
                      </label>
                      <select
                        value={newCase.judge_id}
                        onChange={(e) => setNewCase({ ...newCase, judge_id: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                      >
                        <option value="">Auto-Allocate Based on Roster</option>
                        {(Array.isArray(judges) ? judges : []).map(j => (
                          <option key={j.judge_id} value={j.judge_id}>
                            {j.full_name} ({j.specialization} - {j.courtroom})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1">
                      Case Summary & Critical Facts (Analyzed by Groq AI & 7-Vector Matrix) *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={newCase.description}
                      onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                      placeholder="Detail the case facts, emergency grounds, custody days, or threat of irreparable harm. E.g. Senior citizen seeking urgent stay against illegal demolition..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 8: Document Uploads & Review */}
              {currentStep === 8 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="font-outfit font-bold text-base dark:text-white text-court-600 border-b pb-2">
                    Step 8: Document Uploads & Verification
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-court-950 border border-dashed border-gray-300 dark:border-court-800 rounded-2xl">
                      <label className="block text-xs font-bold text-gray-700 dark:text-white mb-2">
                        📄 Plaint / Main Petition PDF *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFiles({ ...files, plaint_pdf: e.target.files[0] })}
                        className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-court-500 file:text-white hover:file:bg-court-400 cursor-pointer"
                      />
                      <span className="block text-[11px] text-gray-400 mt-1">Uploaded PDF will be scanned for NLP risk factors.</span>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-court-950 border border-dashed border-gray-300 dark:border-court-800 rounded-2xl">
                      <label className="block text-xs font-bold text-gray-700 dark:text-white mb-2">
                        📜 Signed Vakalatnama PDF *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFiles({ ...files, vakalatnama_pdf: e.target.files[0] })}
                        className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-court-500 file:text-white hover:file:bg-court-400 cursor-pointer"
                      />
                      <span className="block text-[11px] text-gray-400 mt-1">Advocate Power of Attorney copy.</span>
                    </div>
                  </div>

                  {/* Summary Box Before Submit */}
                  <div className="p-4 bg-court-50/60 dark:bg-court-950/60 border border-court-200 dark:border-court-800 rounded-2xl space-y-1.5">
                    <h5 className="font-outfit font-bold text-xs text-court-700 dark:text-court-300 uppercase tracking-wider">
                      📋 Registration Review Summary:
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-400">Case #:</span> <strong className="dark:text-white">{newCase.case_number}</strong></div>
                      <div><span className="text-gray-400">Bench:</span> <strong className="dark:text-white">{newCase.bench ? newCase.bench.split('-')[0] : ''}</strong></div>
                      <div><span className="text-gray-400">Title:</span> <strong className="dark:text-white">{newCase.title || 'N/A'}</strong></div>
                      <div><span className="text-gray-400">Advocate:</span> <strong className="dark:text-white">{newCase.advocate_name || 'N/A'} ({newCase.bar_enrollment_number})</strong></div>
                      <div><span className="text-gray-400">Senior Citizen:</span> <strong className="dark:text-white">{newCase.is_senior_citizen ? 'YES (Age ' + newCase.petitioner_age + ')' : 'NO'}</strong></div>
                      <div><span className="text-gray-400">Custody:</span> <strong className="text-red-500 font-bold">{newCase.custody_status} ({newCase.detention_days}d)</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-150 dark:border-court-850">
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 bg-gray-100 dark:bg-court-800 text-gray-600 dark:text-court-300 rounded-xl text-xs font-semibold disabled:opacity-40"
                >
                  Back
                </button>

                <div className="flex gap-2">
                  {currentStep < 8 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => Math.min(8, prev + 1))}
                      className="px-5 py-2.5 bg-court-500 hover:bg-court-400 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Next Step ({currentStep}/8) →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? 'Running 7-Vector AI Engine...' : '🏛️ Register Case & Run AI'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
