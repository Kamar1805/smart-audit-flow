import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import './auth.css';

export default function Login() {
  const { login, loading: authLoading, isAuthenticated, profile } = useAuth();

  // Redirect when loaded and authenticated
  if (!authLoading && isAuthenticated && profile?.role) {
    const roleRoute =
      profile.role === 'requester' ? '/requester' :
      profile.role === 'procurement' ? '/procurement' :
      profile.role === 'audit' ? '/audit' :
      profile.role === 'finance' ? '/finance' : '/';
    return <Navigate to={roleRoute} replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // Redirect happens via render-level Navigate when profile loads
    } catch (err) {
      console.error(err);
      setLocalError('Login failed. Check your credentials or network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-page">
        {/* Navbar */}
        <div className="auth-navbar">
          <div className="auth-navbar-inner">
            <Link to="/" className="auth-back">← Back to Home</Link>
            <nav className="auth-nav">
              <Link to="/login" className="auth-active">Login</Link>
              <Link to="/signup">Signup</Link>
            </nav>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" />
            <div>
              <div className="auth-title">Loading</div>
              <div className="auth-subtitle">Please wait…</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer" style={{ marginTop: 24 }}>
          <span>© 2025 TechZ. All rights reserved.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Navbar */}
      <div className="auth-navbar">
        <div className="auth-navbar-inner">
          <Link to="/" className="auth-back">← Back to Home</Link>
          <nav className="auth-nav">
            <Link to="/login" className="auth-active">Login</Link>
            <Link to="/signup">Signup</Link>
          </nav>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" />
          <div>
            <div className="auth-title">Welcome back</div>
            <div className="auth-subtitle">Sign in to continue</div>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {localError && <div className="auth-error">{localError}</div>}

          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
          <div className={`auth-progress ${submitting ? 'active' : ''}`} />
        </form>

        <div className="auth-footer">
          Don’t have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </div>

      {/* Page footer */}
      <div className="auth-footer" style={{ marginTop: 24 }}>
        <span>© 2025 TechZ. All rights reserved.</span>
      </div>
    </div>
  );
}