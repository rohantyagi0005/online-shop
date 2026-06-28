import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Must have at least name, one of email/phone, and password
    if (!name) {
      setError("Please enter your full name.");
      return;
    }
    if (!email && !phone) {
      setError("Please provide at least an email address or a phone number.");
      return;
    }
    if (!password) {
      setError("Please set a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (confirmPw && password !== confirmPw) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError('');

    const res = await register(name, email || null, password, phone || null);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || "Registration failed. Try a different email or phone.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col justify-center min-h-[600px] gap-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col gap-6 font-sans">

        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-1">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-xs">Register to reserve items and track your in-store pickups</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl text-xs text-rose-500 font-bold leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition-colors"
                required
              />
              <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Mobile Number
              <span className="text-[9px] bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">Can log in with this</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition-colors"
              />
              <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Email Address
              <span className="text-[9px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">Optional if phone provided</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition-colors"
              />
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pl-11 pr-12 text-sm outline-none focus:border-primary transition-colors"
                required
              />
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition-colors"
              />
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Login modes hint */}
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold leading-relaxed">
            💡 After registering, you can log in with either your <strong>phone number</strong> or <strong>email address</strong> — whichever you provided.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:opacity-90 text-white font-bold py-3 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="flex justify-between items-center text-xs mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Link to="/login" className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
