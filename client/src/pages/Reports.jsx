import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Scale, 
  Users, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filter values
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch Report
  const fetchReportData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      const params = {};

      if (activeTab === 'daily') {
        endpoint = '/reports/daily';
        params.date = selectedDate;
      } else if (activeTab === 'monthly') {
        endpoint = '/reports/monthly';
        params.year = selectedYear;
        params.month = selectedMonth;
      } else if (activeTab === 'judge') {
        endpoint = '/reports/judge-performance';
      } else if (activeTab === 'court') {
        endpoint = '/reports/court-performance';
      } else if (activeTab === 'delay') {
        endpoint = '/reports/delay-analysis';
      }

      const res = await api.get(endpoint, { params });
      setReportData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, selectedDate, selectedYear, selectedMonth]);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (!reportData) return;

    let headers = [];
    let rows = [];
    let filename = `court_report_${activeTab}`;

    if (activeTab === 'judge') {
      headers = ['Judge ID', 'Judge Name', 'Specialization', 'Courtroom', 'Total Assigned', 'Pending', 'Active Hearings', 'Disposed', 'Avg Delay (Days)', 'Hearings Scheduled'];
      rows = reportData.map(j => [
        j.judge_id, j.judge_name, j.specialization, j.courtroom, j.total_cases_assigned, j.pending_cases, j.active_hearings, j.disposed_cases, j.avg_predicted_delay, j.total_hearings_scheduled
      ]);
    } else if (activeTab === 'delay') {
      headers = ['Prioritization Factor / Reason', 'Frequency Count'];
      rows = reportData.map(r => [r.reason, r.count]);
    } else if (activeTab === 'daily') {
      headers = ['Report Date', 'Cases Filed Count', 'Hearings Scheduled Count', 'Total Disposed Count'];
      rows = [[reportData.reportDate, reportData.casesFiledCount, reportData.hearingsCount, reportData.disposedCount]];
      filename += `_${selectedDate}`;
    } else if (activeTab === 'monthly') {
      headers = ['Period', 'Cases Filed Count', 'Hearings Scheduled Count', 'Total Disposed Count'];
      rows = [[reportData.period, reportData.casesFiledCount, reportData.hearingsCount, reportData.disposedCount]];
      filename += `_${selectedYear}_${selectedMonth}`;
    } else if (activeTab === 'court') {
      headers = ['Caseload Logged', 'Clearance Rate (%)', 'Avg Delay (Days)', 'Pending', 'Hearing', 'Disposed'];
      rows = [[
        reportData.totalCases, reportData.clearanceRatePercent, reportData.averageDelayDays,
        reportData.statusBreakdown?.pending, reportData.statusBreakdown?.hearing, reportData.statusBreakdown?.disposed
      ]];
    }

    // Generate CSV string
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: 'daily', label: 'Daily Court Summary', icon: Calendar },
    { id: 'monthly', label: 'Monthly Report', icon: FileText },
    { id: 'judge', label: 'Judge Performance', icon: Users },
    { id: 'court', label: 'Court Workload', icon: Scale },
    { id: 'delay', label: 'AI Delay Analysis', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header and top buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-gray-800 dark:text-white">
            Court Reports & Logs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate judicial summaries, export spreadsheets, and print legal statistics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!reportData || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-250 dark:bg-court-900 dark:border-court-850 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:text-court-300 dark:hover:bg-court-800 transition-all disabled:opacity-50"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!reportData || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-court-500 hover:bg-court-400 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs list (hidden in print) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-court-950 rounded-2xl w-fit print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-court-700 dark:bg-court-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:text-court-400 dark:hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report parameters filters (hidden in print) */}
      {activeTab === 'daily' && (
        <div className="bg-white border border-gray-150 rounded-2xl p-4 dark:bg-court-900 dark:border-court-850 w-fit flex items-center gap-3 text-sm print:hidden">
          <span className="font-semibold text-gray-500">Report Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-court-950 border border-gray-200 dark:border-court-800 rounded-xl focus:outline-none dark:text-white text-xs"
          />
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="bg-white border border-gray-150 rounded-2xl p-4 dark:bg-court-900 dark:border-court-850 w-fit flex items-center gap-3 text-sm print:hidden">
          <span className="font-semibold text-gray-500">Select Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-gray-50 dark:bg-court-950 border border-gray-200 dark:border-court-800 rounded-xl focus:outline-none dark:text-white text-xs pr-4 font-semibold"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString(undefined, { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-gray-50 dark:bg-court-950 border border-gray-200 dark:border-court-800 rounded-xl focus:outline-none dark:text-white text-xs pr-4 font-semibold"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {/* Printable Report Content Container */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm print:shadow-none print:border-none">
        
        {/* Print Brand Header (Visible in print only) */}
        <div className="hidden print:flex items-center gap-3 border-b-2 border-gray-800 pb-5 mb-6">
          <span className="text-3xl">⚖️</span>
          <div>
            <h1 className="font-bold text-2xl uppercase">Ministry of Law & Justice</h1>
            <p className="text-sm font-semibold tracking-wider">DEPARTMENT OF JUSTICE &bull; DISTRICT COURT PORTAL</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
          </div>
        ) : !reportData ? (
          <p className="text-center text-sm text-gray-400 py-12">No report data compiled.</p>
        ) : (
          <div className="space-y-6">
            
            {/* Header info */}
            <div>
              <h3 className="font-outfit font-extrabold text-xl text-gray-850 dark:text-white">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <p className="text-xs text-gray-500 dark:text-court-400 mt-1">
                Generated on: {new Date().toLocaleString()} &bull; Security Level: Restricted (Internal Judicial Use)
              </p>
            </div>

            {/* --- DAILY SUMMARY LAYOUT --- */}
            {activeTab === 'daily' && (
              <div className="space-y-6">
                {/* Metric count grids */}
                <div className="grid grid-cols-3 gap-5">
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Cases Registered</span>
                    <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{reportData.casesFiledCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Hearings Scheduled</span>
                    <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{reportData.hearingsCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Total Disposed Registry</span>
                    <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{reportData.disposedCount}</p>
                  </div>
                </div>

                {/* Hearings List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-wider">Scheduled Hearings list</h4>
                  {reportData.hearings.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No hearings scheduled on this date.</p>
                  ) : (
                    <div className="border border-gray-150 rounded-2xl overflow-hidden dark:border-court-850">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-court-950 border-b border-gray-150 dark:border-court-850 font-bold text-gray-500 dark:text-court-300">
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Case ID</th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Judge Name</th>
                            <th className="px-4 py-3">Room</th>
                            <th className="px-4 py-3">Purpose</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-court-850">
                          {reportData.hearings.map((h, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-court-950/25">
                              <td className="px-4 py-3 font-semibold">{new Date(h.hearing_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="px-4 py-3 font-bold">{h.case_number}</td>
                              <td className="px-4 py-3 truncate max-w-xs">{h.case_title}</td>
                              <td className="px-4 py-3">{h.judge_name}</td>
                              <td className="px-4 py-3 font-semibold">{h.courtroom}</td>
                              <td className="px-4 py-3">{h.purpose || 'Trial'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- MONTHLY REPORT LAYOUT --- */}
            {activeTab === 'monthly' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-5">
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Monthly Registrations</span>
                    <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{reportData.casesFiledCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Monthly Trials Scheduled</span>
                    <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{reportData.hearingsCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Clearance Disposed Registry</span>
                    <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{reportData.disposedCount}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-wider">Cases Ingested Registry</h4>
                  {reportData.casesFiled.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No cases filed during this month.</p>
                  ) : (
                    <div className="border border-gray-150 rounded-2xl overflow-hidden dark:border-court-850">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-court-950 border-b border-gray-150 dark:border-court-850 font-bold text-gray-500 dark:text-court-300">
                            <th className="px-4 py-3">Filing Date</th>
                            <th className="px-4 py-3">Case ID</th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Priority Classification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-court-850">
                          {reportData.casesFiled.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-court-950/25">
                              <td className="px-4 py-3">{new Date(c.filing_date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-bold">{c.case_number}</td>
                              <td className="px-4 py-3 truncate max-w-xs">{c.title}</td>
                              <td className="px-4 py-3">{c.case_type}</td>
                              <td className="px-4 py-3 font-semibold">{c.priority}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- JUDGE PERFORMANCE LAYOUT --- */}
            {activeTab === 'judge' && (
              <div className="border border-gray-150 rounded-2xl overflow-hidden dark:border-court-850 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-court-950 border-b border-gray-150 dark:border-court-850 font-bold text-gray-500 dark:text-court-300">
                      <th className="px-6 py-4">Judge Name</th>
                      <th className="px-6 py-4">Bench Category</th>
                      <th className="px-6 py-4">Court Room</th>
                      <th className="px-6 py-4 text-center">Cases Assigned</th>
                      <th className="px-6 py-4 text-center font-semibold text-amber-500">Pending</th>
                      <th className="px-6 py-4 text-center font-semibold text-blue-500">Active Hearing</th>
                      <th className="px-6 py-4 text-center font-semibold text-emerald-500">Disposed</th>
                      <th className="px-6 py-4 text-center">Roster Trials Scheduled</th>
                      <th className="px-6 py-4 text-center">Avg Prediction Delay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-court-850">
                    {reportData.map((j) => (
                      <tr key={j.judge_id} className="hover:bg-gray-50/50 dark:hover:bg-court-950/25">
                        <td className="px-6 py-4 font-bold">{j.judge_name}</td>
                        <td className="px-6 py-4">{j.specialization}</td>
                        <td className="px-6 py-4 font-semibold">{j.courtroom}</td>
                        <td className="px-6 py-4 text-center font-medium">{j.total_cases_assigned}</td>
                        <td className="px-6 py-4 text-center text-amber-500 font-semibold">{j.pending_cases}</td>
                        <td className="px-6 py-4 text-center text-blue-500 font-semibold">{j.active_hearings}</td>
                        <td className="px-6 py-4 text-center text-emerald-500 font-semibold">{j.disposed_cases}</td>
                        <td className="px-6 py-4 text-center font-medium">{j.total_hearings_scheduled}</td>
                        <td className="px-6 py-4 text-center font-bold text-red-500">{j.avg_predicted_delay} Days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- COURT WORKLOAD LAYOUT --- */}
            {activeTab === 'court' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-5">
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Total Logged Caseload</span>
                    <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{reportData.totalCases}</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Roster Clearance Rate</span>
                    <p className="text-3xl font-extrabold text-emerald-500 mt-2">{reportData.clearanceRatePercent}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Avg Lawsuit Delay</span>
                    <p className="text-3xl font-extrabold text-red-500 mt-2">{reportData.averageDelayDays} Days</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl dark:bg-court-950 dark:border-court-850">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Hearing-Stage Cases</span>
                    <p className="text-3xl font-extrabold text-blue-500 mt-2">{reportData.statusBreakdown?.hearing}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Status counts */}
                  <div className="p-5 border border-gray-150 rounded-2xl dark:border-court-850">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">Case Registry Status Counts</h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="font-medium text-amber-500">Pending Registry</span>
                        <span className="font-bold">{reportData.statusBreakdown?.pending} Cases</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="font-medium text-blue-500">Active Hearings Stage</span>
                        <span className="font-bold">{reportData.statusBreakdown?.hearing} Cases</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-emerald-500">Disposed Archives</span>
                        <span className="font-bold">{reportData.statusBreakdown?.disposed} Cases</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority breakdown */}
                  <div className="p-5 border border-gray-150 rounded-2xl dark:border-court-850">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">Caseload Priority Ratios</h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="font-medium text-red-500">High Urgency (Priority)</span>
                        <span className="font-bold">{reportData.priorityBreakdown?.high} Cases</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="font-medium text-amber-500">Medium Priority</span>
                        <span className="font-bold">{reportData.priorityBreakdown?.medium} Cases</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-emerald-500">Low Priority</span>
                        <span className="font-bold">{reportData.priorityBreakdown?.low} Cases</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- AI DELAY ANALYSIS LAYOUT --- */}
            {activeTab === 'delay' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-court-400">
                  Aggregation of critical delay causes returned by the AI prediction module across all lawsuits.
                </p>
                <div className="border border-gray-150 rounded-2xl overflow-hidden dark:border-court-850 max-w-2xl text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-court-950 border-b border-gray-150 dark:border-court-850 font-bold text-gray-500 dark:text-court-300">
                        <th className="px-6 py-4">Prioritization Factor / Reason Tag</th>
                        <th className="px-6 py-4 text-center">Frequency of occurrence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-court-850 text-sm">
                      {reportData.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-court-950/25">
                          <td className="px-6 py-4 font-semibold flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                            <span>{r.reason}</span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-court-700 dark:text-court-300">
                            {r.count} times
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default Reports;
