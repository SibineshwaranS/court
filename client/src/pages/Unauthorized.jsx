import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white border border-gray-200 rounded-3xl dark:bg-court-900 dark:border-court-800 shadow-sm max-w-lg mx-auto my-12">
      <div className="p-4 bg-red-50 text-red-500 rounded-full dark:bg-red-950/20 dark:text-red-400 mb-5">
        <ShieldAlert size={48} />
      </div>
      <h2 className="font-outfit font-extrabold text-2xl text-gray-800 dark:text-white">
        403 - Permission Denied
      </h2>
      <p className="text-sm text-gray-500 dark:text-court-400 mt-2 max-w-sm">
        You do not possess the required judicial credentials or role clearance to access this module page registry.
      </p>
      <Link 
        to="/dashboard"
        className="mt-6 px-6 py-3 bg-court-500 hover:bg-court-400 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
