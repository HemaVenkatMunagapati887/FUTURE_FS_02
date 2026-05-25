import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@crm.com'); // Autofilled with seed account for testing convenience
  const [password, setPassword] = useState('password123'); // Autofilled with seed password
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setFormError('Please enter both email and password.');
    }

    setFormError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setFormError(err.message || 'Verification failed. Please double-check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-crm-dark px-4 py-12 bg-mesh overflow-hidden">
      {/* Decorative Glow Orbs in Background */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-crm-primary/10 blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md animate-scale-up">
        {/* Logo Card */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-crm-primary/10 border border-crm-primary/30 shadow-glow mb-3 transition-transform hover:scale-110 duration-300">
            <Shield className="h-8 w-8 text-crm-primary" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-crm-textMuted bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-1.5 text-sm text-crm-textMuted">
            Sign in to manage your CRM pipeline
          </p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel rounded-3xl p-8 shadow-glass border border-crm-border/60 hover:border-crm-primary/30 transition-all duration-300">
          {formError && (
            <div className="mb-6 flex items-start space-x-2.5 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 animate-bounce" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-crm-textMuted">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-crm-border bg-crm-dark/60 py-3 pl-11 pr-4 text-sm text-crm-text placeholder-crm-textMuted/60 transition-all duration-300 focus:border-crm-primary focus:outline-none focus:ring-1 focus:ring-crm-primary focus:shadow-glow"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-crm-textMuted">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-crm-border bg-crm-dark/60 py-3 pl-11 pr-12 text-sm text-crm-text placeholder-crm-textMuted/60 transition-all duration-300 focus:border-crm-primary focus:outline-none focus:ring-1 focus:ring-crm-primary focus:shadow-glow"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-crm-textMuted hover:text-crm-text focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-crm-primary px-4 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:bg-crm-primaryHover active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts Panel */}
        <div className="mt-8 rounded-2xl bg-crm-card/40 border border-crm-border/40 p-5 text-center shadow-md">
          <p className="text-xs text-crm-textMuted mb-3">
            Demo Credentials (click to quick fill):
          </p>
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@crm.com')}
                className="rounded-lg bg-crm-border/40 hover:bg-crm-primary/20 border border-crm-border hover:border-crm-primary/40 px-2 py-1.5 text-crm-text font-medium transition-all cursor-pointer active:scale-95"
              >
                <div className="text-[10px] text-crm-textMuted uppercase font-bold">Admin</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@crm.com')}
                className="rounded-lg bg-crm-border/40 hover:bg-crm-warning/20 border border-crm-border hover:border-crm-warning/40 px-2 py-1.5 text-crm-text font-medium transition-all cursor-pointer active:scale-95"
              >
                <div className="text-[10px] text-crm-textMuted uppercase font-bold">Manager</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('venkat@crm.com')}
                className="rounded-lg bg-crm-border/40 hover:bg-crm-info/20 border border-crm-border hover:border-crm-info/40 px-2 py-1.5 text-crm-text font-medium transition-all cursor-pointer active:scale-95"
              >
                <div className="text-[10px] text-crm-textMuted uppercase font-bold">Employee</div>
              </button>
            </div>
            <div className="text-[10px] text-crm-textMuted font-mono">
              Password: <span className="text-crm-text">password123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
