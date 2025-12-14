import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const { login, loading: authLoading, isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();

  // 1. AUTO REDIRECT (If user is already logged in when visiting /login)
  if (!authLoading && isAuthenticated && profile?.role) {
    if (profile.role === 'executive') return <Navigate to="/executives" replace />;
    if (profile.role === 'procurement') return <Navigate to="/procurement" replace />;
    if (profile.role === 'audit') return <Navigate to="/audit" replace />;
    if (profile.role === 'finance') return <Navigate to="/finance" replace />;
    return <Navigate to="/requester" replace />; // Default requester
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 2. MANUAL SUBMIT HANDLER (Fixes the login loop)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      const res = await login(email, password);

      if (res.success && res.data) {
        const role = res.data.role;
        toast.success(`Welcome back, ${res.data.name}`);

        // EXPLICIT NAVIGATION BASED ON ROLE
        if (role === 'executive') {
           navigate('/executives');
        } else if (role === 'procurement') {
           navigate('/procurement');
        } else if (role === 'audit') {
           navigate('/audit');
        } else if (role === 'finance') {
           navigate('/finance');
        } else {
           navigate('/requester'); // Requester default
        }
      } else {
        setLocalError(res.error || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      setLocalError('Login failed. Check your network.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State UI
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#fe0000] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* --- TOP RIGHT: BACK TO HOME BUTTON --- */}
      <div className="absolute top-6 right-6 z-20">
        <Link to="/">
          <Button 
            variant="outline" 
            className="gap-2 border-slate-200 text-slate-600 hover:text-[#fe0000] hover:bg-red-50 hover:border-red-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Background Decor (Red Theme to match Landing) */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative z-10"
      >
        <div className="text-center mb-8">
          {/* Logo */}
          <img src="/saps.png" alt="SAPS" className="h-12 mx-auto mb-4 object-contain" />
          <h1 className="font-display text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-2">Sign in to access your dashboard</p>
        </div>

        {/* Error Message */}
        {localError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            {localError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <Input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
              required 
            />
          </div>

          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full h-11 bg-[#fe0000] hover:bg-[#d50000] text-white font-medium shadow-lg shadow-red-200 transition-all mt-2"
          >
            {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Don't have an account? <Link to="/signup" className="text-slate-900 font-medium hover:underline">Sign up</Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
           <span className="text-xs text-slate-300">© 2025 TechZ. All rights reserved.</span>
        </div>
      </motion.div>
    </div>
  );
}