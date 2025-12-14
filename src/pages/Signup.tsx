import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function Signup() {
  const { signup, logout } = useAuth();
  const navigate = useNavigate();
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    staffId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'requester',
    department: '',
    executiveId: '',
    position: '' as '' | 'Executive Director' | 'Group Managing Director' | 'The Chairman',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!form.name || !form.staffId || !form.email || !form.password || !form.confirmPassword || !form.department) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Executive validation
    if (form.role === 'executive') {
      if (!form.executiveId || !form.position) {
        setError('Executive ID and Position are required.');
        return;
      }
      if (form.executiveId.trim().toLowerCase() !== 'kamar1805') {
        setError('Invalid Executive ID.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await signup({
        name: form.name,
        staffId: form.staffId,
        email: form.email,
        password: form.password,
        role: form.role as any,
        department: form.department,
      });
      
      if (res.success) {
        await logout(); // Ensure clean state
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Background Decor (Red Theme) */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Signup Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <img src="/saps.png" alt="SAPS" className="h-12 mx-auto mb-4 object-contain" />
          <h1 className="font-display text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 text-sm mt-2">Join the SAPS platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* Row 1: Name & Staff ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <Input 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff ID</label>
              <Input 
                value={form.staffId}
                onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
                required
              />
            </div>
          </div>

          {/* Row 2: Email & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <Input 
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
              <Input 
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
                required
              />
            </div>
          </div>

          {/* Row 3: Role (Full Width or Split) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
            <select
              className="flex h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe0000] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="requester">Requester (Head of Dept)</option>
              <option value="procurement">Procurement Officer</option>
              <option value="audit">Internal Audit</option>
              <option value="finance">Finance Approver</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {form.role === 'executive' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Executive ID</label>
                <Input 
                  value={form.executiveId}
                  onChange={(e) => setForm({ ...form, executiveId: e.target.value })}
                  placeholder="Enter Executive ID (Kamar1805)"
                  className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position</label>
                <select
                  className="flex h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe0000]"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value as any })}
                  required
                >
                  <option value="">Select a position</option>
                  <option value="Executive Director">Executive Director</option>
                  <option value="Group Managing Director">Group Managing Director</option>
                  <option value="The Chairman">The Chairman</option>
                </select>
              </div>
            </div>
          )}

          {/* Row 4: Password & Confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <Input 
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
              <Input 
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#fe0000] focus:ring-[#fe0000]"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full h-11 bg-[#fe0000] hover:bg-[#d50000] text-white font-medium shadow-lg shadow-red-200 transition-all mt-6"
          >
            {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-slate-900 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}