import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const notifRef = useRef(null);

  // Initialize Dark Mode state
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close notification menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'Read' } : n)
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const unreadCount = notifications.filter(n => n.status !== 'Read').length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 dark:bg-court-950 dark:border-court-800 transition-colors duration-200">
      {/* Sidebar Toggle & Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-500 rounded-xl hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-court-900"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="font-outfit font-bold text-xl text-gray-800 dark:text-white">
            District Court System
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            AI-Powered Prioritization & Smart Scheduling Portal
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 text-gray-500 rounded-xl hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-court-900 transition-all"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className={`p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-court-900 transition-all ${
              unreadCount > 0 ? 'text-court-500 dark:text-court-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl dark:bg-court-900 dark:border-court-800 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-court-800">
                <span className="font-outfit font-semibold text-gray-800 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-court-800">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-court-400">
                    No notifications found
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => notif.status !== 'Read' && markRead(notif.id)}
                      className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-court-950 cursor-pointer transition-colors ${
                        notif.status !== 'Read' ? 'bg-court-50/40 dark:bg-court-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'Priority Alert' ? (
                          <AlertCircle size={16} className="text-red-500" />
                        ) : (
                          <CheckCircle size={16} className="text-court-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-gray-700 dark:text-gray-300 leading-snug break-words ${
                          notif.status !== 'Read' ? 'font-semibold' : ''
                        }`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-court-400">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-court-800" />

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col text-right hidden md:flex">
            <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
              {user?.full_name}
            </span>
            <span className="text-[11px] font-bold text-court-500 dark:text-court-400 uppercase tracking-wide">
              {user?.role}
            </span>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-court-100 text-court-700 dark:bg-court-800 dark:text-court-200 font-semibold shadow-inner">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
