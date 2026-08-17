import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Scale
} from 'lucide-react';

const Hearings = () => {
  const { user } = useAuth();
  
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [judges, setJudges] = useState([]);
  
  // Filter States
  const [judgeFilter, setJudgeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newCourtroom, setNewCourtroom] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch judges for filters
  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const res = await api.get('/auth/judges');
        setJudges(res.data);
      } catch (err) {
        console.error('Error fetching judges', err);
      }
    };
    if (user.role === 'Administrator' || user.role === 'Court Clerk') {
      fetchJudges();
    }
  }, [user]);

  // Fetch hearings
  const fetchHearings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      
      // Auto-restrict roster to judge's assignments if current user is a Judge
      if (user.role === 'Judge' && user.judgeId) {
        params.judge_id = user.judgeId;
      } else if (judgeFilter) {
        params.judge_id = judgeFilter;
      }

      const res = await api.get('/hearings', { params });
      setHearings(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching hearings:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, [judgeFilter, statusFilter, dateFilter, user]);

  const handleResetFilters = () => {
    setJudgeFilter('');
    setStatusFilter('');
    setDateFilter('');
  };

  // Quick hearing status change (Completed / Cancelled)
  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this hearing as ${status}?`)) return;
    try {
      await api.put(`/hearings/${id}`, { status });
      fetchHearings();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  // Open Reschedule Modal
  const openReschedule = (hearing) => {
    setSelectedHearing(hearing);
    // Format existing date to YYYY-MM-DDTHH:MM for datetime-local input
    const dateObj = new Date(hearing.hearing_date);
    // Correct timezone shift for ISO representation
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dateObj - tzOffset).toISOString().slice(0, 16);
    
    setNewDate(localISOTime);
    setNewCourtroom(hearing.courtroom);
    setRescheduleError('');
    setShowRescheduleModal(true);
  };

  // Reschedule Form Submit
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setRescheduleError('');
    setUpdating(true);

    try {
      // Reformat to space-separated SQL timestamp format e.g. YYYY-MM-DD HH:MM:SS
      const formattedDate = newDate.replace('T', ' ') + ':00';
      
      await api.put(`/hearings/${selectedHearing.id}`, {
        hearing_date: formattedDate,
        courtroom: newCourtroom,
        status: 'Rescheduled'
      });

      setShowRescheduleModal(false);
      fetchHearings();
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Error rescheduling hearing. Check date is not a holiday.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header view */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-gray-800 dark:text-white">
            Hearings Calendar & Roster
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            List and reschedule active hearings, trials, and court trials
          </p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 dark:bg-court-900 dark:border-court-850 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Title / Info */}
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-court-300">
          <Calendar size={18} className="text-court-500" />
          <span>Roster List ({hearings.length} Scheduled)</span>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Judge filter (Admin / Clerk only) */}
          {(user.role === 'Administrator' || user.role === 'Court Clerk') && (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-court-950 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-court-800 text-sm">
              <span className="text-gray-400"><User size={14} /></span>
              <select
                value={judgeFilter}
                onChange={(e) => setJudgeFilter(e.target.value)}
                className="bg-transparent focus:outline-none dark:text-white font-medium text-xs pr-2"
              >
                <option value="">All Judges</option>
                {judges.map(j => (
                  <option key={j.judge_id} value={j.judge_id}>
                    {j.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-court-950 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-court-800 text-sm">
            <span className="text-gray-400"><SlidersHorizontal size={14} /></span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none dark:text-white font-medium text-xs pr-2"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-court-950 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-court-800 text-sm">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent focus:outline-none dark:text-white font-medium text-xs"
            />
          </div>

          {/* Reset Filters */}
          {(judgeFilter || statusFilter || dateFilter) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-court-800 dark:hover:bg-court-700 text-xs font-bold rounded-xl transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Roster Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
          </div>
        ) : hearings.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-3xl py-20 text-center dark:bg-court-900 dark:border-court-800">
            <span className="text-5xl mb-4 block">📅</span>
            <h3 className="font-outfit font-bold text-lg text-gray-700 dark:text-court-300">
              No hearings found
            </h3>
            <p className="text-sm text-gray-400 dark:text-court-400 max-w-sm mx-auto mt-1">
              There are no roster schedules matching your active selection parameters.
            </p>
          </div>
        ) : (
          hearings.map((h) => (
            <div 
              key={h.id} 
              className="bg-white border border-gray-200 rounded-2xl p-5 dark:bg-court-900 dark:border-court-800 shadow-sm flex flex-col justify-between hover:border-court-300 dark:hover:border-court-700 transition-all duration-200"
            >
              <div className="space-y-3.5">
                {/* Header info */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-court-500 uppercase tracking-widest block">
                      {h.courtroom}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 block mt-0.5">
                      Case Number: {h.case_number}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    h.status === 'Scheduled' 
                      ? 'bg-blue-100 text-court-800 dark:bg-court-950/40 dark:text-court-300'
                      : h.status === 'Rescheduled'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : h.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                  }`}>
                    {h.status}
                  </span>
                </div>

                {/* Case Title */}
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white text-sm hover:underline leading-snug">
                    <Link to={`/cases/${h.case_id}`}>{h.case_title}</Link>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-court-400 mt-1">
                    Purpose: <span className="font-semibold text-gray-700 dark:text-court-300">{h.purpose || 'Procedural Hearing'}</span>
                  </p>
                </div>

                {/* Judge Info & Date Details */}
                <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-court-850 text-xs text-gray-600 dark:text-court-350">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-court-500" />
                    <span>{new Date(h.hearing_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-court-500" />
                    <span className="truncate">Presiding: {h.judge_name}</span>
                  </div>
                </div>

                {/* Comments box */}
                {h.comments && (
                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl dark:bg-court-950 dark:border-court-850 text-[11px] text-gray-500 dark:text-court-400 leading-snug italic">
                    Note: "{h.comments}"
                  </div>
                )}
              </div>

              {/* Action Buttons (Admins, Clerks, or Presiding Judge only) */}
              {h.status !== 'Completed' && h.status !== 'Cancelled' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-court-850">
                  <button
                    onClick={() => openReschedule(h)}
                    className="flex-1 py-1.5 bg-gray-50 border border-gray-250 hover:bg-gray-100 dark:bg-court-950 dark:border-court-800 rounded-lg text-[11px] font-bold text-gray-600 dark:text-court-300 dark:hover:bg-court-800 transition-all text-center"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleStatusChange(h.id, 'Completed')}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all"
                    title="Mark Completed"
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button
                    onClick={() => handleStatusChange(h.id, 'Cancelled')}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-all"
                    title="Cancel Hearing"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedHearing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-gray-200 dark:bg-court-900 dark:border-court-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 dark:border-court-850 bg-gray-50 dark:bg-court-950">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-court-500" />
                <h3 className="font-outfit font-bold text-sm dark:text-white">Reschedule Roster Session</h3>
              </div>
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="p-1.5 hover:bg-gray-150 dark:hover:bg-court-800 text-gray-400 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRescheduleSubmit}>
              <div className="p-6 space-y-4">
                {rescheduleError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {rescheduleError}
                  </div>
                )}

                <div className="bg-court-50/50 dark:bg-court-950/30 p-4 rounded-xl space-y-1 text-xs">
                  <span className="text-gray-400">Rescheduling Case</span>
                  <p className="font-bold text-gray-800 dark:text-white leading-snug">
                    {selectedHearing.case_number}: {selectedHearing.case_title}
                  </p>
                  <p className="text-gray-500">
                    Presiding: Hon'ble Judge {selectedHearing.judge_name}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                    New Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                    Court Room Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourtroom}
                    onChange={(e) => setNewCourtroom(e.target.value)}
                    placeholder="e.g. Courtroom 101"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-150 dark:border-court-850 bg-gray-50 dark:bg-court-950">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 bg-white border border-gray-250 dark:bg-court-900 dark:border-court-800 rounded-xl text-xs font-semibold text-gray-600 dark:text-court-300 hover:bg-gray-50 dark:hover:bg-court-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-court-500 hover:bg-court-400 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hearings;
