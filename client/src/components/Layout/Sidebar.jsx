import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  BarChart3, 
  FileText, 
  Scale, 
  LogOut 
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const links = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Administrator', 'Judge', 'Court Clerk']
    },
    {
      to: '/cases',
      label: 'Case Management',
      icon: Briefcase,
      roles: ['Administrator', 'Judge', 'Court Clerk']
    },
    {
      to: '/hearings',
      label: 'Hearings Calendar',
      icon: Calendar,
      roles: ['Administrator', 'Judge', 'Court Clerk']
    },
    {
      to: '/analytics',
      label: 'Analytics Dashboard',
      icon: BarChart3,
      roles: ['Administrator', 'Judge']
    },
    {
      to: '/reports',
      label: 'Reports & Export',
      icon: FileText,
      roles: ['Administrator', 'Judge']
    }
  ];

  const filteredLinks = links.filter(link => user && link.roles.includes(user.role));

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-court-900 border-r border-court-800 text-gray-300 transition-transform duration-300 transform lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-court-800">
          <div className="p-2 rounded-lg bg-court-500 text-white">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="font-outfit font-bold text-white text-lg leading-tight">AI Court Portal</h1>
            <span className="text-xs text-court-300 tracking-wider uppercase font-semibold">SIH 2025 (SIH1280)</span>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="px-6 py-4 border-b border-court-800 bg-court-950/40">
          <p className="text-xs text-court-400 font-semibold uppercase tracking-wider">Logged In As</p>
          <p className="font-medium text-white truncate mt-0.5">{user?.full_name}</p>
          <span className="inline-block px-2 py-0.5 mt-1.5 text-[10px] font-bold text-court-200 bg-court-800 rounded">
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-court-500 text-white shadow-lg shadow-court-500/20'
                      : 'hover:bg-court-800 hover:text-white text-court-200'
                  }`
                }
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-court-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
