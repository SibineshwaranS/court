import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, Lock, User, AlertCircle, Info } from 'lucide-react';

const Login = () => {
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLocalError('Please enter both username and password.');
      return;
    }

    setLocalError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      // AuthContext handles state, error is also returned
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-court-950 via-court-900 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-court-500 to-court-400 rounded-2xl shadow-xl shadow-court-500/20 text-white mb-4 animate-bounce">
            <Scale size={32} />
          </div>
          <h1 className="font-outfit font-extrabold text-3xl text-white tracking-tight text-center">
            Judicial Case Management
          </h1>
          <p className="text-sm text-court-300 font-medium tracking-wide uppercase mt-1">
            District Courts Administration
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 dark:bg-court-900/60 dark:border-court-800">
          <h2 className="font-outfit font-bold text-xl text-white mb-6">
            Sign In to Portal
          </h2>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Display Errors */}
            {(localError || error || isExpired) && (
              <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-200 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  {isExpired && !localError && !error && (
                    <span>Your session has expired. Please log in again.</span>
                  )}
                  {localError && <span>{localError}</span>}
                  {!localError && error && <span>{error}</span>}
                </div>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-court-200 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-court-300">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-court-400 focus:outline-none focus:border-court-400 focus:ring-1 focus:ring-court-400 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-court-200 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-court-300">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-court-400 focus:outline-none focus:border-court-400 focus:ring-1 focus:ring-court-400 transition-all text-sm"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <span 
                onClick={() => alert('Password reset is mocked. Please use the quick credentials helper below to sign in, or click a helper button to autofill and submit.')}
                className="text-xs text-court-300 hover:text-white cursor-pointer transition-colors font-medium"
              >
                Forgot Password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-court-500 hover:bg-court-400 text-white font-semibold rounded-2xl shadow-lg shadow-court-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Mock Credentials Helper */}
        <div className="mt-6 bg-white/5 border border-white/5 rounded-3xl p-5 dark:bg-court-950/20">
          <div className="flex gap-2 items-center justify-between text-court-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-court-400" />
              <span>SIH Quick Credential Helper</span>
            </div>
            <span className="text-[10px] text-court-400 font-normal">Click to fill</span>
          </div>

          {/* Admin & Clerk Row */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'password123')}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-xs text-court-100 rounded-xl transition-all border border-white/10 text-left hover:border-court-400"
            >
              <p className="font-bold text-[10px] text-court-300 uppercase">Administrator</p>
              <p className="font-semibold text-white mt-0.5 truncate">admin</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('clerk_roy', 'password123')}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-xs text-court-100 rounded-xl transition-all border border-white/10 text-left hover:border-court-400"
            >
              <p className="font-bold text-[10px] text-court-300 uppercase">Court Clerk</p>
              <p className="font-semibold text-white mt-0.5 truncate">clerk_roy</p>
            </button>
          </div>

          {/* All Judges Section */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] font-bold text-court-300 uppercase tracking-wider mb-2">
              Judges (Presiding Bench)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('judge_sharma', 'password123')}
                className="p-2 bg-white/5 hover:bg-white/10 text-xs text-court-100 rounded-xl transition-all border border-white/10 text-left hover:border-court-400"
                title="Hon'ble Judge Rajesh Sharma (Criminal Courtroom 101)"
              >
                <p className="font-bold text-[9px] text-amber-400 uppercase">Criminal</p>
                <p className="font-semibold text-white text-[11px] truncate">judge_sharma</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('judge_patel', 'password123')}
                className="p-2 bg-white/5 hover:bg-white/10 text-xs text-court-100 rounded-xl transition-all border border-white/10 text-left hover:border-court-400"
                title="Hon'ble Judge Sneha Patel (Civil Courtroom 102)"
              >
                <p className="font-bold text-[9px] text-sky-400 uppercase">Civil</p>
                <p className="font-semibold text-white text-[11px] truncate">judge_patel</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('judge_verma', 'password123')}
                className="p-2 bg-white/5 hover:bg-white/10 text-xs text-court-100 rounded-xl transition-all border border-white/10 text-left hover:border-court-400"
                title="Hon'ble Judge Amit Verma (Family Courtroom 103)"
              >
                <p className="font-bold text-[9px] text-emerald-400 uppercase">Family</p>
                <p className="font-semibold text-white text-[11px] truncate">judge_verma</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
