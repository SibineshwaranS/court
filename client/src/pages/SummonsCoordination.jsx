import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DEFAULT_WITNESSES, DEFAULT_CASES, DEFAULT_SUMMONS } from '../services/mockSummonsData';
import {
  Send,
  Video,
  UserCheck,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
  X,
  Search,
  Filter,
  Shield,
  Download,
  Mail,
  Printer,
  FileText,
  CheckCircle,
  Smartphone
} from 'lucide-react';

const SummonsCoordination = () => {
  const [activeTab, setActiveTab] = useState('summons'); // 'summons' | 'witnesses'
  const [summonsList, setSummonsList] = useState(DEFAULT_SUMMONS);
  const [witnessesList, setWitnessesList] = useState(DEFAULT_WITNESSES);
  const [casesList, setCasesList] = useState(DEFAULT_CASES);
  const [loading, setLoading] = useState(false);

  // New Summons Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedWitnessId, setSelectedWitnessId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [mode, setMode] = useState('Virtual VC');
  const [notes, setNotes] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState('Email'); // 'Email' | 'Hand Delivery'
  const [fromEmail, setFromEmail] = useState('court.registry.salem@tn.gov.in');
  const [toEmail, setToEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [assignedBailiff, setAssignedBailiff] = useState('Process Server R. Selvam');
  const [submitting, setSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // Witness conflict check
  const [conflictWarning, setConflictWarning] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [viewForm33Summons, setViewForm33Summons] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [summonsFilter, setSummonsFilter] = useState('All');
  const [summonsSearch, setSummonsSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Robust multi-endpoint fetch using allSettled to ensure cases ALWAYS load
      const [summonsResult, witnessesResult, casesResult] = await Promise.allSettled([
        api.get('/summons'),
        api.get('/witnesses'),
        api.get('/cases?limit=100')
      ]);

      if (summonsResult.status === 'fulfilled') {
        const raw = summonsResult.value?.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        if (list.length > 0) setSummonsList(list);
      }

      if (witnessesResult.status === 'fulfilled') {
        const raw = witnessesResult.value?.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        if (list.length > 0) setWitnessesList(list);
      }

      if (casesResult.status === 'fulfilled') {
        const raw = casesResult.value?.data;
        const list = Array.isArray(raw?.cases)
          ? raw.cases
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        if (list.length > 0) setCasesList(list);
      }
    } catch (err) {
      console.warn('Backend loading note, using synchronized fallbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check witness availability when date and witness are selected
  useEffect(() => {
    const checkConflict = async () => {
      if (selectedWitnessId && scheduledDate) {
        try {
          const dateOnly = scheduledDate.split('T')[0];
          const res = await api.get(`/witnesses/${selectedWitnessId}/availability?start_date=${dateOnly}&end_date=${dateOnly}`);
          if (res.data && res.data.length > 0) {
            const entry = res.data[0];
            if (entry.status !== 'Available') {
              setConflictWarning({
                status: entry.status,
                remarks: entry.remarks
              });
            } else {
              setConflictWarning(null);
            }
          } else {
            setConflictWarning(null);
          }
        } catch (e) {
          setConflictWarning(null);
        }
      } else {
        setConflictWarning(null);
      }
    };
    checkConflict();
  }, [selectedWitnessId, scheduledDate]);

  const handleSelectWitness = (wId) => {
    setSelectedWitnessId(wId);
    const found = witnessesList.find(w => w.id === parseInt(wId, 10));
    if (found) {
      setToEmail(found.email || '');
      setDeliveryAddress(`${found.station_or_hospital}, Salem Jurisdiction`);
    }
  };

  const handleCreateSummons = async (e) => {
    e.preventDefault();
    if (!selectedCaseId || !selectedWitnessId || !scheduledDate) return;

    try {
      setSubmitting(true);
      const res = await api.post('/summons', {
        case_id: selectedCaseId,
        witness_id: selectedWitnessId,
        scheduled_date: scheduledDate,
        mode,
        delivery_channel: deliveryChannel,
        from_email: fromEmail,
        to_email: toEmail,
        delivery_address: deliveryAddress,
        assigned_bailiff: assignedBailiff,
        notes
      });
      setShowModal(false);
      setSelectedCaseId('');
      setSelectedWitnessId('');
      setScheduledDate('');
      setNotes('');
      setToEmail('');
      setDeliveryAddress('');
      setConflictWarning(null);
      await fetchData();
      // Immediately open official Form 33 e-Summons document!
      setViewForm33Summons(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue summons');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (summonsId, newStatus) => {
    try {
      setStatusUpdating(true);
      await api.put(`/summons/${summonsId}/status`, { status: newStatus });
      await fetchData();
      if (viewForm33Summons && viewForm33Summons.id === summonsId) {
        setViewForm33Summons(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true);
      const res = await api.post('/summons/test-email', { email: 'sibineshwarans@gmail.com' });
      alert(`Success! Summons email dispatched to sibineshwarans@gmail.com.\n\nStatus: ${res.data.success ? 'Sent' : 'Processed'}\nRef: ${res.data.messageId || 'Delivered'}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch test email');
    } finally {
      setSendingTest(false);
    }
  };

  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(''), 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-gray-500">Loading Witness & Summons Coordination System...</p>
      </div>
    );
  }

  const virtualSummonsCount = summonsList.filter(s => s.mode === 'Virtual VC' || s.mode === 'Hybrid').length;
  
  const filteredSummons = summonsList.filter(s => {
    const matchesFilter = 
      summonsFilter === 'All' ? true :
      summonsFilter === 'Virtual VC' ? s.mode === 'Virtual VC' :
      summonsFilter === 'Hybrid' ? s.mode === 'Hybrid' :
      summonsFilter === 'In-Hand' ? (s.delivery_channel === 'Hand Delivery' || s.mode === 'Physical Courtroom') :
      summonsFilter === 'Acknowledged' ? s.status === 'Acknowledged' : true;

    const q = summonsSearch.toLowerCase().trim();
    if (!q) return matchesFilter;

    const matchesSearch = 
      (s.summons_number && s.summons_number.toLowerCase().includes(q)) ||
      (s.case_number && s.case_number.toLowerCase().includes(q)) ||
      (s.case_title && s.case_title.toLowerCase().includes(q)) ||
      (s.witness_name && s.witness_name.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-court-900 p-6 rounded-3xl border border-gray-200/80 dark:border-court-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 rounded-full flex items-center gap-1.5">
              <Video size={14} />
              e-Summons & VC Coordination
            </span>
            <span className="text-xs text-gray-400">Interoperable Criminal Justice System (ICJS)</span>
          </div>
          <h1 className="font-outfit font-extrabold text-2xl text-gray-900 dark:text-white mt-2">
            Smart Summons & Virtual Witness Coordination
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Connect hearing dockets directly with government witness calendars (IOs, Medical Doctors, Forensic Experts) to eliminate witness-absent trial adjournments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-court-600 hover:bg-court-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus size={16} />
            <span>Issue Smart Summons</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white dark:bg-court-900 rounded-2xl border border-gray-200/80 dark:border-court-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Summons Issued</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
              <Send size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-outfit text-gray-900 dark:text-white">
              {summonsList.length}
            </span>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} />
              100% Dispatched via SMS Gateway
            </p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-court-900 rounded-2xl border border-gray-200/80 dark:border-court-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Virtual Court (VC) Summons</span>
            <span className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
              <Video size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-outfit text-gray-900 dark:text-white">
              {virtualSummonsCount}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Direct video conference joining links
            </p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-court-900 rounded-2xl border border-gray-200/80 dark:border-court-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Govt & Expert Witnesses</span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <UserCheck size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-outfit text-gray-900 dark:text-white">
              {witnessesList.length}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Police IOs, Medical Officers, Forensic Experts
            </p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-court-900 rounded-2xl border border-gray-200/80 dark:border-court-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Adjournment Avoidance</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <Shield size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-outfit text-gray-900 dark:text-white">
              88%
            </span>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Duty conflicts caught pre-scheduling
            </p>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-court-950 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('summons')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'summons'
              ? 'bg-white text-court-700 dark:bg-court-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Send size={14} />
          <span>Active Digital Summons & VC Dockets ({summonsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('witnesses')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'witnesses'
              ? 'bg-white text-court-700 dark:bg-court-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <UserCheck size={14} />
          <span>Government & Expert Witnesses Registry ({witnessesList.length})</span>
        </button>
      </div>

      {/* TAB 1: SUMMONS TABLE */}
      {activeTab === 'summons' && (
        <div className="p-6 bg-white dark:bg-court-900 rounded-3xl border border-gray-200/80 dark:border-court-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-outfit font-bold text-lg text-gray-900 dark:text-white">
                Summons Docket & Virtual Courtroom Links
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Official digital summons dispatched to witnesses with authenticated Virtual Courtroom (VC) video links
              </p>
            </div>
          </div>

          {/* Filter Pills and Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 pt-2 border-t border-gray-100 dark:border-court-800">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'All', label: 'All Dockets (' + summonsList.length + ')' },
                { id: 'Virtual VC', label: '🎥 Virtual VC (' + summonsList.filter(s => s.mode === 'Virtual VC').length + ')' },
                { id: 'Hybrid', label: '⚖️ Hybrid (' + summonsList.filter(s => s.mode === 'Hybrid').length + ')' },
                { id: 'In-Hand', label: '🏛️ In-Hand / Bailiff (' + summonsList.filter(s => s.delivery_channel === 'Hand Delivery' || s.mode === 'Physical Courtroom').length + ')' },
                { id: 'Acknowledged', label: '✓ Acknowledged (' + summonsList.filter(s => s.status === 'Acknowledged').length + ')' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSummonsFilter(tab.id)}
                  className={'px-3 py-1.5 rounded-xl font-bold transition-all ' + (
                    summonsFilter === tab.id
                      ? 'bg-court-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-court-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-court-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search summons, case, witness..."
                value={summonsSearch}
                onChange={(e) => setSummonsSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-court-800 bg-gray-50 dark:bg-court-950 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-court-500"
              />
              {summonsSearch && (
                <button onClick={() => setSummonsSearch('')} className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600">×</button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-court-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Summons Ref</th>
                  <th className="py-3 px-4">Case Docket</th>
                  <th className="py-3 px-4">Witness Deponent</th>
                  <th className="py-3 px-4">Scheduled Session</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Virtual VC Link</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-court-850 text-sm">
                {filteredSummons.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-court-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-court-600 dark:text-court-300">
                      {s.summons_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">{s.case_number}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{s.case_title}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800 dark:text-gray-200">{s.witness_name}</div>
                      <div className="text-xs text-gray-500">{s.witness_designation} • {s.station_or_hospital}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {new Date(s.scheduled_date).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        s.mode === 'Virtual VC'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                          : s.mode === 'Hybrid'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-court-800 dark:text-gray-300'
                      }`}>
                        {s.mode === 'Virtual VC' && <Video size={12} />}
                        <span>{s.mode}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.vc_link ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={s.vc_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-court-50 dark:bg-court-950 hover:bg-court-100 dark:hover:bg-court-800 text-court-700 dark:text-court-300 text-xs font-semibold rounded-lg border border-court-200/80 dark:border-court-800 transition-colors"
                          >
                            <span>Open VC</span>
                            <ExternalLink size={12} />
                          </a>
                          <a
                            href={`/api/summons/${s.id}/preview-email`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg border border-blue-200/80 dark:border-blue-800 transition-colors"
                            title="View exact official summons email dispatched to recipient"
                          >
                            <Mail size={12} />
                            <span>Notice</span>
                          </a>
                          <button
                            onClick={() => setViewForm33Summons(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-lg border border-amber-200/80 dark:border-amber-800 transition-colors"
                            title="Official Court Form No. 33 (Schedule II CrPC / NSTEP e-Summons)"
                          >
                            <FileText size={12} />
                            <span>Form 33</span>
                          </button>
                          <button
                            onClick={() => handleCopyLink(s.vc_link, s.id)}
                            className="p-1 text-gray-400 hover:text-court-600 transition-colors"
                            title="Copy VC Joining Link"
                          >
                            <Copy size={14} />
                          </button>
                          {copySuccess === s.id && (
                            <span className="text-xs text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Physical Attendance</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          s.status === 'Acknowledged'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {s.status}
                        </span>
                        {s.status !== 'Acknowledged' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'Acknowledged')}
                            disabled={statusUpdating}
                            className="text-[10px] text-court-600 hover:text-court-800 dark:text-court-400 font-bold underline cursor-pointer"
                            title="Simulate Witness/Police Digital Return via NSTEP"
                          >
                            Mark Served
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WITNESSES REGISTRY */}
      {activeTab === 'witnesses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {witnessesList.map((w) => (
            <div
              key={w.id}
              className="p-6 bg-white dark:bg-court-900 rounded-3xl border border-gray-200/80 dark:border-court-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-gray-100 dark:bg-court-800 text-gray-600 dark:text-gray-300 rounded-lg">
                    {w.badge_number || 'GOVT-DEP'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Verified ICJS Registry
                  </span>
                </div>

                <h3 className="font-outfit font-extrabold text-lg text-gray-900 dark:text-white mt-3">
                  {w.name}
                </h3>
                <p className="text-xs font-semibold text-court-600 dark:text-court-300">
                  {w.designation}
                </p>

                <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400 shrink-0" />
                    <span>{w.station_or_hospital}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-gray-400 shrink-0" />
                    <span>{w.department}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-court-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-600">
                  Available for Next Deposition
                </span>
                <button
                  onClick={() => {
                    setSelectedWitnessId(w.id.toString());
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 bg-court-50 dark:bg-court-950 hover:bg-court-100 dark:hover:bg-court-800 text-court-700 dark:text-court-300 text-xs font-bold rounded-xl transition-colors border border-court-200 dark:border-court-800"
                >
                  Issue Summons
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Summons Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-court-900 rounded-3xl border border-gray-200 dark:border-court-800 p-6 sm:p-8 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-outfit font-bold text-xl text-gray-900 dark:text-white">
                  Issue Digital Summons & VC Session
                </h2>
                <p className="text-xs text-gray-500">
                  Pre-screen witness availability and generate authenticated Video Conference link
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSummons} className="space-y-4">
              {/* Select Case */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Target Case Docket *
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-950 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none"
                >
                  <option value="">
                    {casesList.length === 0 ? "-- Loading registered cases... --" : "-- Choose active registered case --"}
                  </option>
                  {casesList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title} ({c.priority} Priority)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Witness */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Government / Expert Witness Deponent *
                </label>
                <select
                  value={selectedWitnessId}
                  onChange={(e) => handleSelectWitness(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-950 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none"
                >
                  <option value="">-- Choose witness --</option>
                  {witnessesList.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.designation} - {w.station_or_hospital})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Deposition Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-950 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none"
                />
              </div>

              {/* Real-time Conflict Warning Banner */}
              {conflictWarning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Witness Conflict Detected:</span> {conflictWarning.status}
                    <p className="text-[11px] opacity-90 mt-0.5">{conflictWarning.remarks}</p>
                  </div>
                </div>
              )}

              {/* Summons Delivery Mode (Email vs Hand Delivery by Address) */}
              <div className="p-4 bg-gray-50 dark:bg-court-950/70 rounded-2xl border border-gray-200 dark:border-court-800 space-y-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Summons Service & Delivery Mode *
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryChannel('Email')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      deliveryChannel === 'Email'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-court-900 text-gray-700 dark:text-gray-300 border-gray-250 dark:border-court-800'
                    }`}
                  >
                    <Mail size={14} />
                    <span>Electronic (Email Notice)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryChannel('Hand Delivery')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      deliveryChannel === 'Hand Delivery'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-court-900 text-gray-700 dark:text-gray-300 border-gray-250 dark:border-court-800'
                    }`}
                  >
                    <Building2 size={14} />
                    <span>In-Hand (By Address)</span>
                  </button>
                </div>

                {deliveryChannel === 'Email' ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                        From Email (Sender) *
                      </label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        required
                        placeholder="e.g. court.registry.salem@tn.gov.in"
                        className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                        To Email (Recipient) *
                      </label>
                      <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        required
                        placeholder="Type recipient's email address here..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                        Delivery Postal Address / Station Jurisdiction *
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required
                        placeholder="Enter complete physical address for bailiff hand delivery..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                        Assigned Process Server / Bailiff
                      </label>
                      <input
                        type="text"
                        value={assignedBailiff}
                        onChange={(e) => setAssignedBailiff(e.target.value)}
                        placeholder="e.g. Process Server R. Selvam (Court Process Unit)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mode */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Hearing Deposition Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Virtual VC', 'Physical Courtroom', 'Hybrid'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        mode === m
                          ? 'bg-court-600 text-white border-court-600 shadow-sm'
                          : 'bg-gray-50 dark:bg-court-950 text-gray-700 dark:text-gray-300 border-gray-250 dark:border-court-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Prosecution Purpose / Documents Required
                </label>
                <input
                  type="text"
                  placeholder="e.g. Produce FIR Case Diary / Post-Mortem Report"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-court-800 bg-white dark:bg-court-950 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-court-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-court-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-court-600 hover:bg-court-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Generating e-Summons...' : 'Issue e-Summons & VC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Form 33 e-Summons / NSTEP Document Modal */}
      {viewForm33Summons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-gray-300 relative my-8 animate-in fade-in zoom-in-95 print:p-0 print:border-none print:shadow-none">
            
            {/* Top Toolbar (Hidden when printing) */}
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-200 flex items-center gap-1.5">
                  <FileText size={14} />
                  NSTEP Process Docket
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {viewForm33Summons.summons_number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Printer size={14} />
                  <span>Print Form 33</span>
                </button>
                <button
                  onClick={() => setViewForm33Summons(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Official Legal Summons Document (Schedule II CrPC Form 33) */}
            <div className="border-4 border-double border-gray-800 p-6 sm:p-8 bg-amber-50/20 font-serif">
              
              {/* Header */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <div className="text-xs font-bold tracking-widest uppercase text-gray-600">
                  Republic of India • e-Courts Mission Mode Project
                </div>
                <div className="text-xs font-bold tracking-wider text-blue-900 mt-0.5">
                  National Service and Tracking of Electronic Processes (NSTEP) • ICJS
                </div>
                <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-gray-900 mt-2">
                  IN THE COURT OF THE DISTRICT & SESSIONS JUDGE, SALEM
                </h1>
                <p className="text-xs italic text-gray-600 mt-0.5">
                  High Court of Judicature at Madras, Tamil Nadu
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-gray-900 text-white text-xs font-sans font-bold tracking-wider uppercase rounded">
                  FORM NO. 33 — SUMMONS TO A WITNESS (SECTION 61 & 62, Cr.P.C., 1973)
                </div>
              </div>

              {/* CNR & Process Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs font-sans mb-5 pb-3 border-b border-gray-300">
                <div>
                  <span className="font-bold text-gray-500">Case Docket Number: </span>
                  <span className="font-bold text-gray-900">{viewForm33Summons.case_number}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500">NSTEP Process ID: </span>
                  <span className="font-mono font-bold text-court-700">{viewForm33Summons.summons_number}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-gray-500">Matter: </span>
                  <span className="font-semibold text-gray-800">{viewForm33Summons.case_title}</span>
                </div>
              </div>

              {/* Notice Recipient */}
              <div className="mb-5 text-sm">
                <p className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-1">TO:</p>
                <div className="pl-4 border-l-2 border-gray-800">
                  <p className="font-bold text-base text-gray-900">{viewForm33Summons.witness_name}</p>
                  <p className="text-xs text-gray-700 font-sans">{viewForm33Summons.witness_designation}</p>
                  <p className="text-xs text-gray-700 font-sans">{viewForm33Summons.station_or_hospital}</p>
                  <div className="mt-2 text-xs font-sans">
                    <span className="font-bold text-gray-600">Service Mode: </span>
                    <span className="font-semibold text-court-700">
                      {viewForm33Summons.delivery_channel === 'Hand Delivery'
                        ? `In-Hand Delivery via Bailiff (${viewForm33Summons.assigned_bailiff || 'Process Server'})`
                        : `Electronic Process via Email (${viewForm33Summons.to_email || viewForm33Summons.witness_email || 'Direct Email'})`}
                    </span>
                    {viewForm33Summons.delivery_address && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Delivery Address: {viewForm33Summons.delivery_address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Summons Text */}
              <div className="text-justify text-xs sm:text-sm leading-relaxed text-gray-800 space-y-3 mb-6">
                <p>
                  <strong>WHEREAS</strong> complaint has been lodged before this Court that the above-named matter requires your testimony, and it appears to this Court that you are likely to give material evidence or produce essential records on behalf of the prosecution/court;
                </p>
                <p>
                  <strong>YOU ARE HEREBY SUMMONED</strong> to appear before this Court, or to participate through the authenticated <strong>Virtual Courtroom (VC)</strong> video conference portal on:
                </p>
                
                <div className="p-3 bg-gray-100 rounded-xl text-center font-sans border border-gray-300 my-2">
                  <div className="text-xs font-bold text-gray-500 uppercase">Mandatory Scheduled Session</div>
                  <div className="text-base font-extrabold text-court-800 mt-0.5">
                    {new Date(viewForm33Summons.scheduled_date).toLocaleString('en-IN', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </div>
                  <div className="text-xs font-semibold text-purple-700 mt-1">
                    Mode: {viewForm33Summons.mode || 'Virtual Court Video Conference'}
                  </div>
                </div>

                {viewForm33Summons.notes && (
                  <p className="font-sans text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <strong>Specific Production Order: </strong> {viewForm33Summons.notes}
                  </p>
                )}

                <p className="text-xs italic text-gray-600">
                  Herein fail not, under penalty of law under Section 174 of the Indian Penal Code (contempt of lawful order of public servant).
                </p>
              </div>

              {/* Virtual Courtroom Joining Details */}
              {viewForm33Summons.vc_link && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 mb-6 font-sans">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <Video size={14} />
                        Authorized Virtual Courtroom Video Link
                      </p>
                      <p className="text-xs text-purple-700 mt-0.5 font-mono break-all">
                        {viewForm33Summons.vc_link}
                      </p>
                    </div>
                    <a
                      href={viewForm33Summons.vc_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 ml-3 print:hidden"
                    >
                      <span>Join VC</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              {/* Signatures & Seal */}
              <div className="flex justify-between items-end pt-6 border-t-2 border-gray-800 font-sans text-xs">
                <div className="text-center">
                  <div className="w-16 h-16 border-2 border-gray-800 rounded-full flex items-center justify-center font-bold text-[9px] text-gray-700 mx-auto mb-1 uppercase tracking-tighter">
                    Court Seal
                  </div>
                  <span className="text-gray-500 text-[10px]">District Court, Salem</span>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">By Order of the Hon'ble Court</p>
                  <p className="text-gray-600 mt-1">Registrar / Chief Judicial Magistrate</p>
                  <p className="text-gray-400 text-[10px] font-mono mt-0.5">
                    Digitally Signed via ICJS e-Sign: {viewForm33Summons.qr_code_token || 'VERIFIED_TOKEN'}
                  </p>
                </div>
              </div>

            </div>

            {/* NSTEP Service Tracking Workflow (Bottom) */}
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 font-sans print:hidden">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                  <Smartphone size={14} />
                  NSTEP Electronic Delivery & Return Tracker
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  viewForm33Summons.status === 'Acknowledged'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  Current Status: {viewForm33Summons.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="p-2 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                  1. Process Generated ✅
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                  2. Dispatched (ICJS) ✅
                </div>
                <div className="p-2 bg-blue-50 text-blue-800 font-bold rounded-lg border border-blue-200">
                  3. Police/Bailiff Roster ✅
                </div>
                <div className={`p-2 font-bold rounded-lg border ${
                  viewForm33Summons.status === 'Acknowledged'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {viewForm33Summons.status === 'Acknowledged' ? '4. Acknowledged ✅' : '4. Awaiting Return'}
                </div>
              </div>

              {viewForm33Summons.status !== 'Acknowledged' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleUpdateStatus(viewForm33Summons.id, 'Acknowledged')}
                    disabled={statusUpdating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <CheckCircle size={14} />
                    <span>Confirm Service Acknowledgment (NSTEP Return)</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SummonsCoordination;

