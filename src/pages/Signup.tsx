// ...existing code...
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import './auth.css';

export default function Signup() {
  const { signup, logout } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    staffId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'requester',
    department: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.staffId || !form.email || !form.password || !form.confirmPassword || !form.department) {
      // simple inline validation message could be added
      return;
    }
    if (form.password !== form.confirmPassword) {
      return;
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
        await logout();
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" />
          <div>
            <div className="auth-title">Create your account</div>
            <div className="auth-subtitle">Join the streamlined approval workflow</div>
          </div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-grid-2">
            <div>
              <label className="auth-label">Name</label>
              <input
                className="auth-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="auth-label">Staff ID</label>
              <input
                className="auth-input"
                value={form.staffId}
                onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div className="auth-grid-2">
            <div>
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="auth-label">Confirm Password</label>
              <input
                className="auth-input"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="auth-grid-2">
            <div>
              <label className="auth-label">Role</label>
              <select
                className="auth-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="requester">Requester</option>
                <option value="procurement">Procurement</option>
                <option value="audit">Audit</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            <div>
              <label className="auth-label">Department</label>
              <input
                className="auth-input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? 'Creating…' : 'Sign Up'}
          </button>
          <div className={`auth-progress ${submitting ? 'active' : ''}`} />
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
// ...existing code...