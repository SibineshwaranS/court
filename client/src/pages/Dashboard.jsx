import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle,
  Scale, 
  ChevronRight,
  UserCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalCases: 0,
    pendingCases: 0,
    disposedCases: 0,
    todayHearingsCount: 0,
    highPriorityCount: 0
  });
  
  const [todayHearings, setTodayHearings] = useState([]);
  const [priorityCases, setPriorityCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Current System Date (Dynamic Today's Date)
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch court performance metrics (Total, pending, disposed, high priority)
        const perfRes = await api.get('/reports/court-performance');
        const perf = perfRes.data;

        // 2. Fetch hearings scheduled for today
        // Filter by judge if current user is a judge
        const hearingsParams = { date: todayDate };
        if (user.role === 'Judge' && user.judgeId) {
          hearingsParams.judge_id = user.judgeId;
        }
        const hearingsRes = await api.get('/hearings', { params: hearingsParams });
        
        // 3. Fetch cases (first page, limit 5, filter to High priority)
        const casesParams = { priority: 'High', limit: 5 };
        if (user.role === 'Judge' && user.judgeId) {
          casesParams.judge_id = user.judgeId;
        }
        const casesRes = await api.get('/cases', { params: casesParams });

        // Update states
        setStats({
          totalCases: perf.totalCases || 0,
          pendingCases: perf.statusBreakdown?.pending || 0,
          disposedCases: perf.statusBreakdown?.disposed || 0,
          todayHearingsCount: hearingsRes.data.length,
          highPriorityCount: perf.priorityBreakdown?.high || 0
        });

        setTodayHearings(hearingsRes.data);
        setPriorityCases(casesRes.data.cases || []);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-court-100 border-t-court-600 rounded-full animate-spin"></div>
          <span className="absolute top-3 left-3 text-lg">⚖️</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Cases Logged',
      value: stats.totalCases,
      icon: Briefcase,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/20'
    },
    {
      label: 'Pending Cases',
      value: stats.pendingCases,
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20'
    },
    {
      label: 'Cases Disposed',
      value: stats.disposedCases,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20'
    },
    {
      label: "Today's Hearings",
      value: stats.todayHearingsCount,
      icon: Calendar,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500',
      bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/20'
    },
    {
      label: 'High Priority Cases',
      value: stats.highPriorityCount,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-500',
      bgColor: 'bg-red-50/50 dark:bg-red-950/20'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="p-6 bg-gradient-to-r from-court-700 to-court-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-outfit font-extrabold text-2xl">
            Welcome back, {user?.full_name}
          </h3>
          <p className="text-court-200 text-sm mt-1">
            Role: <span className="font-semibold text-white">{user?.role}</span> &bull; Roster management is active. Current System Date: {new Date(todayDate).toLocaleDateString(undefined, { dateStyle: 'long' })}.
          </p>
        </div>
        <Link 
          to="/cases" 
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold rounded-xl transition-all tracking-wider uppercase"
        >
          View Case Dossier
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx}
              className={`flex flex-col p-5 bg-white border border-gray-150 rounded-2xl dark:bg-court-900 dark:border-court-850 shadow-sm ${kpi.bgColor}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 dark:text-court-300 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-xl text-white ${kpi.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <span className="text-3xl font-outfit font-extrabold text-gray-900 dark:text-white mt-4">
                {kpi.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Middle Grid - Today's Schedule & High Priority Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Hearings Schedule List */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-outfit font-bold text-lg text-gray-800 dark:text-white">
                Today's Roster Hearings
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scheduled trials and sessions for {new Date(todayDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>
            <Link 
              to="/hearings" 
              className="text-xs font-semibold text-court-500 dark:text-court-400 flex items-center gap-0.5 hover:underline"
            >
              <span>Calendar View</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-gray-100 dark:divide-court-800">
            {todayHearings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-2">📅</span>
                <p className="text-sm font-medium text-gray-400 dark:text-court-400">
                  No hearings rostered for today.
                </p>
              </div>
            ) : (
              todayHearings.map((h) => (
                <div key={h.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-court-600 dark:text-court-300">
                        {new Date(h.hearing_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-court-100 text-court-800 dark:bg-court-800 dark:text-court-200">
                        {h.courtroom}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        h.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : h.status === 'Rescheduled'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : h.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}>
                        {h.status || 'Scheduled'}
                      </span>
                      {h.case_priority === 'High' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">
                          HIGH
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white hover:underline">
                      <Link to={`/cases/${h.case_id}`}>
                        {h.case_number}: {h.case_title}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Purpose: <span className="font-semibold">{h.purpose || 'Procedural Hearing'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {user.role === 'Judge' ? (
                      <span className="text-xs text-gray-400 dark:text-court-400 italic">
                        Presiding
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <UserCheck size={14} />
                        <span className="truncate max-w-[120px]">{h.judge_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Priority Alerts Board */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-outfit font-bold text-lg text-gray-800 dark:text-white">
                Critical Case Priorities
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI prioritized cases requiring immediate action
              </p>
            </div>
            <Link 
              to="/cases?priority=High" 
              className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-0.5 hover:underline"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {priorityCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-2">🛡️</span>
                <p className="text-sm font-medium text-gray-400 dark:text-court-400">
                  No critical priority cases found.
                </p>
              </div>
            ) : (
              priorityCases.map((c) => (
                <div 
                  key={c.id} 
                  className="p-4 border border-red-100 rounded-2xl bg-red-50/20 dark:border-red-950/20 dark:bg-red-950/5 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold text-red-600 dark:text-red-400 tracking-wider">
                      {c.case_number}
                    </span>
                    <span className="text-xs font-bold text-red-700 bg-red-100 dark:bg-red-950/60 dark:text-red-200 px-2 py-0.5 rounded-full">
                      Score: {c.priority_score}%
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white mt-1 hover:underline">
                    <Link to={`/cases/${c.id}`}>{c.title}</Link>
                  </h4>
                  <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Type: <strong>{c.case_type}</strong></span>
                    <span>Delay: <strong className="text-red-500">{c.predicted_delay} Days</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
