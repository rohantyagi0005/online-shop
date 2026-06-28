import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Phone, ArrowRight, Shield, AtSign } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Detect whether user typed a phone number or email
  const isPhone = /^\+?[0-9\s\-()]{7,15}$/.test(identifier.trim());

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(identifier.trim(), password);
    if (res.success) {
      // Navigate based on returned role (not just email text check)
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message || "Invalid credentials. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col justify-center min-h-[600px] gap-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col gap-6 font-sans">
        
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-1">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-xs">Sign in with your email address or mobile number</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl text-xs text-rose-500 font-bold leading-relaxed flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          {/* Identifier Field — Email or Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Email Address or Phone Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="you@example.com or +91 98765 43210"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="username"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition-colors"
                required
              />
              {isPhone
                ? <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                : <AtSign className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              }
            </div>
            <p className="text-[10px] text-slate-400 pl-1">
              {isPhone ? '📱 Logging in with phone number' : '✉️ Logging in with email address'}
            </p>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pl-11 pr-12 text-sm outline-none focus:border-primary transition-colors"
                required
              />
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:opacity-90 text-white font-bold py-3 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex justify-between items-center text-xs mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <span className="text-slate-400">Don't have an account?</span>
          <Link to="/register" className="text-primary font-bold hover:underline flex items-center gap-1">
            Register <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Admin tip */}
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2.5">
        <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <strong>Owner / Admin:</strong> Use your admin email and password to access the Owner Dashboard.
          <div className="mt-1 font-mono text-[10px]">Default: admin@giftshop.com / admin123</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
