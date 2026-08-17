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

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newCase, setNewCase] = useState({
    case_number: '',
    title: '',
    description: '',
    case_type: 'Criminal',
    filing_date: new Date().toISOString().split('T')[0],
    judge_id: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch judges list for select option
  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const res = await api.get('/auth/judges');
        setJudges(res.data);
      } catch (err) {
        console.error('Error fetching judges', err);
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
      
      // Auto-restrict roster to judge's assignments if current user is a Judge
      if (user.role === 'Judge' && user.judgeId) {
        params.judge_id = user.judgeId;
      }

      const res = await api.get('/cases', { params });
      setCases(res.data.cases);
      setTotalPages(res.data.meta.pages);
      setTotalCases(res.data.meta.total);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cases:', err);
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

  // Handle Case creation
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const payload = { ...newCase };
      if (!payload.judge_id) delete payload.judge_id; // prevent blank string error in PG integer casting

      await api.post('/cases', payload);
      
      // Success: Close modal, reset fields, refresh case grid
      setShowModal(false);
      setNewCase({
        case_number: '',
        title: '',
        description: '',
        case_type: 'Criminal',
        filing_date: new Date().toISOString().split('T')[0],
        judge_id: ''
      });
      fetchCases();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error creating case. Check entries.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Case deletion
  const handleDeleteCase = async (id, num) => {
    if (!window.confirm(`Are you sure you want to permanently delete case ${num}?`)) return;
    try {
      await api.delete(`/cases/${id}`);
      fetchCases(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting case');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header view */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-gray-800 dark:text-white">
            Court Case Docket
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.role === 'Judge' ? 'Roster of assigned cases' : 'Register, filter and manage lawsuit registers'} &bull; {totalCases} Cases found
          </p>
        </div>
        
        {/* Register Case button (Clerk / Admin only) */}
        {(user.role === 'Administrator' || user.role === 'Court Clerk') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-court-500 hover:bg-court-400 text-white font-semibold text-sm rounded-xl shadow-md shadow-court-500/10 active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            <span>Register Case</span>
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 dark:bg-court-900 dark:border-court-850 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
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

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
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

          {/* Priority filter */}
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

          {/* Case Type filter */}
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

          {/* Reset Filters */}
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
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Priority / Score</th>
                  <th className="px-6 py-4">Filing Date</th>
                  <th className="px-6 py-4">Presiding Judge</th>
                  <th className="px-6 py-4">Status</th>
                  {user.role === 'Administrator' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-court-800 text-sm">
                {cases.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-gray-50/50 dark:hover:bg-court-950/25 transition-colors"
                  >
                    <td className="px-6 py-4 font-outfit font-extrabold text-court-700 dark:text-court-300">
                      <Link to={`/cases/${c.id}`} className="hover:underline">
                        {c.case_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white max-w-xs truncate">
                      <Link to={`/cases/${c.id}`} className="hover:underline">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium dark:text-gray-300">
                      {c.case_type}
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

        {/* Pagination bar */}
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

      {/* Case Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white border border-gray-200 dark:bg-court-900 dark:border-court-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-150 dark:border-court-850 bg-gray-50 dark:bg-court-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-court-500 text-white"><Scale size={20} /></div>
                <div>
                  <h3 className="font-outfit font-bold text-lg dark:text-white">Register Lawsuit Case</h3>
                  <p className="text-xs text-gray-500 dark:text-court-400">Add new court docket and trigger AI priority assessment</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-150 dark:hover:bg-court-800 text-gray-400 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {modalError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                    {modalError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Case Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                      Case Number (Unique ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCase.case_number}
                      onChange={(e) => setNewCase({ ...newCase, case_number: e.target.value })}
                      placeholder="e.g. C-2026-9041"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                    />
                  </div>

                  {/* Case Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                      Case Category Type *
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
                </div>

                {/* Case Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                    Case Title / Parties Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="e.g. State vs. Rajesh Sharma OR Verma Tech vs Zenith Solutions"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filing Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                      Filing Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newCase.filing_date}
                      onChange={(e) => setNewCase({ ...newCase, filing_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                    />
                  </div>

                  {/* Assigned Judge */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                      Assigned Presiding Judge
                    </label>
                    <select
                      value={newCase.judge_id}
                      onChange={(e) => setNewCase({ ...newCase, judge_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                    >
                      <option value="">Leave Unassigned</option>
                      {judges.map(j => (
                        <option key={j.judge_id} value={j.judge_id}>
                          {j.full_name} ({j.specialization} - {j.courtroom})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Case Description / Details */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                    Case Description & Critical Facts (Inspected by AI for Prioritization)
                  </label>
                  <textarea
                    rows={4}
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    placeholder="Describe case facts. E.g. Mention if senior citizen is involved, IPC section details, or custody disputes to enable accurate AI analysis..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-150 dark:border-court-850 bg-gray-50 dark:bg-court-950">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-white border border-gray-250 dark:bg-court-900 dark:border-court-800 rounded-xl text-xs font-semibold text-gray-600 dark:text-court-350 hover:bg-gray-50 dark:hover:bg-court-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-court-500 hover:bg-court-400 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register & Run AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
