import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center space-y-4">
      <div className="rounded-full bg-red-500/10 p-4 border border-red-500/20 text-red-400 animate-bounce">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
      <p className="max-w-md text-sm text-crm-textMuted">
        You do not possess the necessary authorization credentials to view this resource. Please consult a system administrator if you believe this is an error.
      </p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 rounded-xl bg-crm-card border border-crm-border px-4 py-2 text-xs font-semibold hover:bg-crm-border/60"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};

export default Unauthorized;
