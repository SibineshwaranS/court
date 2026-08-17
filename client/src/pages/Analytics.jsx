import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { BarChart3, TrendingUp, Calendar, ShieldAlert } from 'lucide-react';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  
  // Data sets from APIs
  const [priorityData, setPriorityData] = useState(null);
  const [workloadData, setWorkloadData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [ageData, setAgeData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        const [priorityRes, workloadRes, monthlyRes, ageRes] = await Promise.all([
          api.get('/analytics/priority-distribution'),
          api.get('/analytics/judge-workload'),
          api.get('/analytics/monthly-cases'),
          api.get('/analytics/pending-age')
        ]);

        setPriorityData(priorityRes.data);
        setWorkloadData(workloadRes.data);
        setMonthlyData(monthlyRes.data);
        setAgeData(ageRes.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data', err);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- 1. Priority Distribution Chart Configuration ---
  const priorityChartConfig = {
    labels: ['High Priority', 'Medium Priority', 'Low Priority'],
    datasets: [
      {
        data: [
          priorityData?.High || 0,
          priorityData?.Medium || 0,
          priorityData?.Low || 0
        ],
        backgroundColor: ['rgba(239, 68, 68, 0.85)', 'rgba(245, 158, 11, 0.85)', 'rgba(16, 185, 129, 0.85)'],
        borderColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 1.5,
      }
    ]
  };

  // --- 2. Judge Workload Chart Configuration ---
  const workloadLabels = workloadData.map(w => w.name);
  const workloadChartConfig = {
    labels: workloadLabels,
    datasets: [
      {
        label: 'Pending Registry',
        data: workloadData.map(w => parseInt(w.pending, 10)),
        backgroundColor: 'rgba(245, 158, 11, 0.75)',
        borderRadius: 6,
      },
      {
        label: 'Active Hearings',
        data: workloadData.map(w => parseInt(w.active_hearing, 10)),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderRadius: 6,
      }
    ]
  };

  // --- 3. Monthly Registration Filings Chart ---
  const monthlyLabels = monthlyData.map(m => {
    const d = new Date(m.month + '-02'); // Offset timezone
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  });
  const monthlyChartConfig = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'New Lawsuits Registered',
        data: monthlyData.map(m => parseInt(m.count, 10)),
        borderColor: '#3c6395',
        backgroundColor: 'rgba(60, 99, 149, 0.15)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#3c6395',
      }
    ]
  };

  // --- 4. Pending Cases Age Distribution Chart ---
  const ageLabels = ageData.map(a => a.age_bracket);
  const ageChartConfig = {
    labels: ageLabels,
    datasets: [
      {
        data: ageData.map(a => parseInt(a.count, 10)),
        backgroundColor: [
          'rgba(59, 130, 246, 0.75)',
          'rgba(99, 102, 241, 0.75)',
          'rgba(139, 92, 246, 0.75)',
          'rgba(244, 63, 94, 0.75)',
          'rgba(225, 29, 72, 0.85)'
        ],
        borderWidth: 0,
      }
    ]
  };

  // Global Chart Layout options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: 'Inter', size: 11 },
          padding: 15,
        }
      }
    }
  };

  const barOptions = {
    ...options,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="font-outfit font-extrabold text-2xl text-gray-800 dark:text-white">
          Court Analytics Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Visual insights, workload ratios, clearance rates and caseload statistics
        </p>
      </div>

      {/* Grid containing charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Priority Distribution */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm h-96 flex flex-col">
          <h3 className="font-outfit font-bold text-base text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-court-500" />
            <span>Caseload Priority Distribution</span>
          </h3>
          <div className="flex-1 relative">
            <Pie data={priorityChartConfig} options={options} />
          </div>
        </div>

        {/* Judge Workload */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm h-96 flex flex-col">
          <h3 className="font-outfit font-bold text-base text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-court-500" />
            <span>Presiding Judges Workload Allocation</span>
          </h3>
          <div className="flex-1 relative">
            <Bar data={workloadChartConfig} options={barOptions} />
          </div>
        </div>

        {/* Monthly case registrations */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm h-96 flex flex-col">
          <h3 className="font-outfit font-bold text-base text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-court-500" />
            <span>Caseload Ingestion Rate (Past 6 Months)</span>
          </h3>
          <div className="flex-1 relative">
            <Line data={monthlyChartConfig} options={options} />
          </div>
        </div>

        {/* Pending Cases Age Distribution */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 dark:bg-court-900 dark:border-court-800 shadow-sm h-96 flex flex-col">
          <h3 className="font-outfit font-bold text-base text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-court-500" />
            <span>Pending Caseload Ageing Bracket</span>
          </h3>
          <div className="flex-1 relative">
            <Doughnut data={ageChartConfig} options={options} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
