import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ArrowLeft, 
  BrainCircuit, 
  Calendar, 
  Clock, 
  FileText, 
  Scale, 
  Upload, 
  UserPlus, 
  Users, 
  AlertTriangle,
  History,
  CornerDownRight,
  TrendingDown,
  Info,
  CalendarDays
} from 'lucide-react';

const CaseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [judges, setJudges] = useState([]);
  
  // Doc Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // AI Recalculate State
  const [runningAI, setRunningAI] = useState(false);

  // Smart Scheduler Drawer State
  const [showScheduler, setShowScheduler] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingScheduler, setLoadingScheduler] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [schedulingHearing, setSchedulingHearing] = useState(false);
  
  // Hearing scheduling form fields
  const [hearingPurpose, setHearingPurpose] = useState('Framing of charges');
  const [hearingComments, setHearingComments] = useState('');

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/cases/${id}`);
      setCaseData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching case detail', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  // Fetch judges for assignment list
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

  // Re-run AI Priority & Delay predictions
  const handleRerunAI = async () => {
    try {
      setRunningAI(true);
      await api.post(`/cases/${id}/predict`);
      await fetchCaseDetail(); // Refresh details
      setRunningAI(false);
    } catch (err) {
      alert('Error running AI predictions: ' + (err.response?.data?.message || err.message));
      setRunningAI(false);
    }
  };

  // Handle Judge Roster Assignment
  const handleJudgeAssign = async (judgeId) => {
    try {
      await api.put(`/cases/${id}`, { judge_id: judgeId ? parseInt(judgeId, 10) : null });
      fetchCaseDetail(); // Refresh details
    } catch (err) {
      alert('Error assigning judge: ' + (err.response?.data?.message || err.message));
    }
  };

  // Upload Document
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadError('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploadingFile(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post(`/cases/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSelectedFile(null);
      // Reset input element
      document.getElementById('file-upload-input').value = '';
      fetchCaseDetail(); // Refresh details
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Error uploading file.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Fetch Recommendations from Smart Scheduler
  const handleOpenScheduler = async () => {
    if (!caseData.judge_id) {
      alert('Please assign a judge to the case before scheduling hearings.');
      return;
    }
    
    setShowScheduler(true);
    setLoadingScheduler(true);
    setSelectedDateObj(null);
    
    try {
      const res = await api.get('/hearings/recommendations', {
        params: {
          case_id: caseData.id,
          judge_id: caseData.judge_id
        }
      });
      setRecommendations(res.data);
    } catch (err) {
      console.error('Error fetching scheduler dates', err);
    } finally {
      setLoadingScheduler(false);
    }
  };

  // Schedule Hearing
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDateObj) return;

    setSchedulingHearing(true);
    try {
      const payload = {
        case_id: caseData.id,
        judge_id: caseData.judge_id,
        hearing_date: `${selectedDateObj.date} 10:00:00`, // Standard morning court session time
        courtroom: caseData.judge_courtroom || 'Courtroom 101',
        purpose: hearingPurpose,
        comments: hearingComments
      };

      await api.post('/hearings', payload);
      setShowScheduler(false);
      fetchCaseDetail(); // Refresh details
    } catch (err) {
      alert(err.response?.data?.message || 'Error scheduling hearing');
    } finally {
      setSchedulingHearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center bg-white border border-gray-200 rounded-3xl dark:bg-court-900 dark:border-court-850">
        <h3 className="font-bold text-gray-700 dark:text-court-300">Case dossier not found</h3>
        <Link to="/cases" className="text-court-500 mt-2 block hover:underline">Back to Docket</Link>
      </div>
    );
  }

  // Parse AI prediction reasons safely
  let aiReasons = [];
  if (caseData.predictions && caseData.predictions.length > 0) {
    const rawReasons = caseData.predictions[0].reasons;
    aiReasons = typeof rawReasons === 'string' ? JSON.parse(rawReasons) : rawReasons;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Back link & Actions banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link 
          to="/cases" 
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-court-400 hover:text-court-500 font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Back to Court Docket</span>
        </Link>
        <div className="flex gap-2">
          {/* Smart Scheduler Trigger */}
          {caseData.status !== 'Disposed' && (
            <button
              onClick={handleOpenScheduler}
              className="flex items-center gap-2 px-4 py-2 bg-court-500 hover:bg-court-400 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <CalendarDays size={14} />
              <span>Smart Scheduler</span>
            </button>
          )}
          
          {/* AI Trigger */}
          <button
            onClick={handleRerunAI}
            disabled={runningAI}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <BrainCircuit size={14} className={runningAI ? 'animate-pulse' : ''} />
            <span>{runningAI ? 'Analyzing...' : 'Run AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Case Header Box */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-court-500 dark:text-court-400 uppercase tracking-wider">
              {caseData.case_type} Case File
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              caseData.status === 'Pending' 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-250'
                : caseData.status === 'Hearing'
                ? 'bg-blue-100 text-court-800 dark:bg-court-950/40 dark:text-court-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}>
              {caseData.status}
            </span>
          </div>
          <h2 className="font-outfit font-extrabold text-2xl text-gray-800 dark:text-white">
            {caseData.case_number}: {caseData.title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filing Date: <span className="font-semibold text-gray-700 dark:text-court-300">{new Date(caseData.filing_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Details vs AI predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Details, Documents, Assignment */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Lawsuit Facts & Details */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm">
            <h3 className="font-outfit font-bold text-lg text-gray-850 dark:text-white mb-4 flex items-center gap-2">
              <Scale size={18} className="text-court-500" />
              <span>Lawsuit Particulars & Facts</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {caseData.description || 'No lawsuit description details provided.'}
            </p>
          </div>

          {/* Roster Judge Assignment */}
          {(user.role === 'Administrator' || user.role === 'Court Clerk') && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm">
              <h3 className="font-outfit font-bold text-lg text-gray-850 dark:text-white mb-4 flex items-center gap-2">
                <UserPlus size={18} className="text-court-500" />
                <span>Assign Presiding Judge</span>
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <select
                  value={caseData.judge_id || ''}
                  onChange={(e) => handleJudgeAssign(e.target.value)}
                  className="w-full sm:w-72 px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                >
                  <option value="">Unassigned</option>
                  {judges.map((j) => (
                    <option key={j.judge_id} value={j.judge_id}>
                      {j.full_name} ({j.specialization} - {j.courtroom})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 dark:text-court-400">
                  Assigning a judge will automatically schedule the hearing courtroom and calendar sync.
                </span>
              </div>
            </div>
          )}

          {/* Documents Dossier and Upload */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm space-y-5">
            <h3 className="font-outfit font-bold text-lg text-gray-850 dark:text-white mb-2 flex items-center gap-2">
              <FileText size={18} className="text-court-500" />
              <span>Documents Dossier</span>
            </h3>

            {/* Upload form (Clerks & Admins only) */}
            {(user.role === 'Administrator' || user.role === 'Court Clerk') && (
              <form onSubmit={handleUploadSubmit} className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl dark:bg-court-950 dark:border-court-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full">
                    <input
                      type="file"
                      id="file-upload-input"
                      onChange={handleFileChange}
                      className="text-xs text-gray-500 dark:text-court-300 w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-court-50 file:text-court-700 hover:file:bg-court-100 dark:file:bg-court-900 dark:file:text-court-200 cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 dark:text-court-400 mt-1">Allows PDF, Doc, Image up to 10MB.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingFile || !selectedFile}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-court-500 text-white font-semibold text-xs rounded-xl shadow disabled:opacity-50 transition-all hover:bg-court-400 shrink-0"
                  >
                    <Upload size={14} />
                    <span>{uploadingFile ? 'Uploading...' : 'Upload Attachment'}</span>
                  </button>
                </div>
                {uploadError && <p className="text-xs text-red-500 mt-2 font-medium">{uploadError}</p>}
              </form>
            )}

            {/* Uploaded Documents List */}
            <div className="divide-y divide-gray-150 dark:divide-court-850">
              {caseData.documents?.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-court-400 text-center py-6">
                  No document attachments found for this case file.
                </p>
              ) : (
                caseData.documents?.map((doc) => (
                  <div key={doc.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-court-50 dark:bg-court-950 text-court-600 dark:text-court-300 rounded-xl">
                        <FileText size={18} />
                      </div>
                      <div>
                        {/* Static link to doc */}
                        <a 
                          href={`/uploads/${doc.file_path.split('\\').pop().split('/').pop()}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-800 dark:text-white hover:underline hover:text-court-500"
                        >
                          {doc.file_name}
                        </a>
                        <p className="text-[11px] text-gray-400 dark:text-court-400 mt-0.5">
                          Uploaded by {doc.uploaded_by_name} &bull; {new Date(doc.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: AI predictions & History */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Prioritization Panel */}
          <div className="bg-gradient-to-br from-court-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-court-850 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-court-300 uppercase tracking-widest">
              <BrainCircuit size={16} className="text-court-400" />
              <span>AI Priority Analytics</span>
            </div>
            
            <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-2xl p-4">
              <div>
                <span className="text-[10px] text-court-300 font-bold uppercase tracking-wider">Classification</span>
                <p className={`font-outfit font-extrabold text-xl ${
                  caseData.priority === 'High' ? 'text-red-400' : caseData.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {caseData.priority} Priority
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-court-300 font-bold uppercase tracking-wider">Priority Score</span>
                <p className="font-outfit font-extrabold text-xl text-white">
                  {caseData.priority_score}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-4">
              <div className="p-2.5 rounded-xl bg-white/5 text-court-300">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] text-court-300 font-bold uppercase tracking-wider">Hearing Delay Prediction</span>
                <p className="font-semibold text-sm text-white">
                  {caseData.predicted_delay} Days Average
                </p>
              </div>
            </div>

            {/* Delay/Priority Reasons */}
            <div className="space-y-2">
              <span className="text-[10px] text-court-300 font-bold uppercase tracking-wider">Prioritization Factors</span>
              {aiReasons.length === 0 ? (
                <p className="text-xs text-court-400 italic">No AI reasons compiled. Run AI analysis.</p>
              ) : (
                <div className="space-y-1.5">
                  {aiReasons.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-court-200">
                      <TrendingDown size={14} className="shrink-0 mt-0.5 text-court-400" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Roster Presiding Judge Details */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm space-y-4">
            <h3 className="font-outfit font-bold text-sm text-gray-500 dark:text-court-300 uppercase tracking-wider">
              Presiding Bench
            </h3>
            {caseData.judge_id ? (
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-court-50 dark:bg-court-950 text-court-700 dark:text-court-300 shadow-inner">
                  <Users size={22} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white leading-tight">
                    {caseData.judge_name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-court-400 mt-0.5">
                    {caseData.judge_courtroom} &bull; Specialization: {caseData.case_type}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-yellow-50/50 border border-yellow-200 text-yellow-700 text-xs dark:bg-yellow-950/10 dark:border-yellow-950/20 dark:text-yellow-400 flex gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>No judge assigned to this roster. Case remains in pending registry.</span>
              </div>
            )}
          </div>

          {/* Case History Timeline */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm space-y-5">
            <h3 className="font-outfit font-bold text-lg text-gray-850 dark:text-white mb-2 flex items-center gap-2">
              <History size={18} className="text-court-500" />
              <span>Court Action Timeline</span>
            </h3>
            <div className="relative border-l border-gray-200 dark:border-court-800 ml-3.5 space-y-6">
              
              {/* Filing Date timeline block */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white bg-court-500 dark:border-court-900" />
                <span className="text-[10px] font-bold text-gray-400 dark:text-court-400 block">
                  {new Date(caseData.filing_date).toLocaleDateString()}
                </span>
                <p className="text-xs font-semibold text-gray-700 dark:text-court-300 mt-0.5">
                  Lawsuit docket filed in court.
                </p>
              </div>

              {/* Scheduled Hearings timeline blocks */}
              {caseData.hearings?.map((h) => (
                <div key={h.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white bg-indigo-500 dark:border-court-900" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-court-400 block">
                    {new Date(h.hearing_date).toLocaleString()}
                  </span>
                  <p className="text-xs font-semibold text-gray-700 dark:text-court-300 mt-0.5">
                    Hearing scheduled: <span className="font-bold text-court-700 dark:text-court-300">{h.purpose || 'Procedural'}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-court-400">
                    Status: {h.status} &bull; Room: {h.courtroom}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Smart Hearing Scheduler Drawer / Modal overlay */}
      {showScheduler && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border-l border-gray-200 dark:bg-court-900 dark:border-court-800 shadow-2xl flex flex-col h-full animate-slide-left">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-150 dark:border-court-850 flex justify-between items-center bg-gray-50 dark:bg-court-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-court-500 text-white"><Calendar size={18} /></div>
                <div>
                  <h3 className="font-outfit font-bold text-base dark:text-white">Smart Scheduler</h3>
                  <p className="text-xs text-gray-400 dark:text-court-400">Recommends conflict-free trial dates</p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduler(false)}
                className="p-1.5 hover:bg-gray-150 dark:hover:bg-court-800 text-gray-400 rounded-full transition-all"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-4 bg-court-50 border border-court-200 text-court-800 rounded-2xl dark:bg-court-950/20 dark:border-court-850 dark:text-court-300 text-xs flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                  The scheduler reviews holidays, weekend closures, and Hon'ble Judge {caseData.judge_name}'s existing scheduled roster workload.
                </span>
              </div>

              {loadingScheduler ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Recommended Slots</span>
                  {recommendations.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-court-400">No conflict-free slots found in the next 60 days.</p>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((rec, index) => (
                        <div 
                          key={index}
                          onClick={() => setSelectedDateObj(rec)}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex justify-between items-center ${
                            selectedDateObj?.date === rec.date
                              ? 'border-court-500 bg-court-50/25 dark:bg-court-950/30'
                              : 'border-gray-200 dark:border-court-800 hover:border-court-400 dark:hover:border-court-700'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-800 dark:text-white">
                              {new Date(rec.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-court-400">
                              {rec.dayName} &bull; Workload: {rec.existingHearingsCount} Hearings
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status.includes('Highly') 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : rec.status.includes('Overbooked')
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                : 'bg-blue-100 text-court-800 dark:bg-court-950/40 dark:text-court-300'
                            }`}>
                              {rec.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Schedule form, displayed once user selects recommended date */}
              {selectedDateObj && (
                <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-4 border-t border-gray-150 dark:border-court-850 animate-fade-in">
                  <div className="bg-court-50/40 dark:bg-court-950/30 p-4 rounded-2xl space-y-1 text-xs">
                    <span className="text-gray-400">Selected Hearing Slot</span>
                    <p className="font-bold text-sm text-court-700 dark:text-court-300">
                      {new Date(selectedDateObj.date).toLocaleDateString(undefined, { dateStyle: 'long' })} (10:00 AM)
                    </p>
                    <p className="text-gray-500 dark:text-court-400">
                      Courtroom: <strong>{caseData.judge_courtroom}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                      Hearing Purpose *
                    </label>
                    <select
                      value={hearingPurpose}
                      onChange={(e) => setHearingPurpose(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm"
                    >
                      <option value="First hearing/Summons return">First hearing/Summons return</option>
                      <option value="Framing of charges">Framing of charges</option>
                      <option value="Cross-examination of witness">Cross-examination of witness</option>
                      <option value="Final arguments">Final arguments</option>
                      <option value="Pronouncement of Judgement">Pronouncement of Judgement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-court-300 uppercase tracking-wider mb-1.5">
                      Comments / Notes
                    </label>
                    <textarea
                      rows={3}
                      value={hearingComments}
                      onChange={(e) => setHearingComments(e.target.value)}
                      placeholder="Add specific comments or preparation files needed..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-court-400 dark:bg-court-950 dark:border-court-800 dark:text-white text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={schedulingHearing}
                    className="w-full py-3 bg-court-500 hover:bg-court-400 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center disabled:opacity-50"
                  >
                    {schedulingHearing ? 'Scheduling Hearing...' : 'Confirm Roster Schedule'}
                  </button>
                </form>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-gray-150 dark:border-court-850 bg-gray-50 dark:bg-court-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScheduler(false)}
                className="px-4 py-2 border border-gray-250 dark:border-court-800 bg-white dark:bg-court-900 rounded-xl text-xs font-semibold text-gray-600 dark:text-court-300 hover:bg-gray-50 dark:hover:bg-court-800 transition-all"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CaseDetail;
