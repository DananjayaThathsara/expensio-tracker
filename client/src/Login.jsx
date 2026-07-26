import React, { useEffect, useState } from 'react';
import { api } from './api.js';

export default function Login({ onSignedIn }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState({ google: false, github: false });

  useEffect(() => {
    api.providers().then(setProviders).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setError(params.get('error').replace(/_/g, ' '));
  }, []);

  const set = key => e => setForm({ ...form, [key]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !form.name.trim()) return setError('Enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    try {
      const res = mode === 'signup' ? await api.signup(form) : await api.login(form);
      onSignedIn(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
      <div className="desktop-only" style={{ padding: 'var(--space-8) calc(var(--space-8) * 2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <i className="ph ph-wallet" style={{ color: 'var(--color-accent)', fontSize: 20 }} />
          <span className="nav-brand">Expensio</span>
        </div>
        <div style={{ maxWidth: 460 }}>
          <h6 style={{ color: 'var(--color-accent)' }}>Monthly budgeting</h6>
          <h1 style={{ textWrap: 'pretty' }}>Know exactly what is left to spend this month.</h1>
          <p className="text-muted">Set a budget for each month, log expenses as they happen, and share it with the people spending alongside you.</p>
        </div>
        <div className="text-muted" style={{ fontSize: 12 }}>© {new Date().getFullYear()} Expensio</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <form onSubmit={submit} className="card elev-sm" style={{ width: '100%', maxWidth: 380, padding: 'var(--space-8)', gap: 'var(--space-4)' }}>
          <div>
            <h4 style={{ margin: 0 }}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h4>
            <p className="text-muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
              {mode === 'signup' ? 'Start tracking this month in under a minute.' : 'Sign in to see what is left for this month.'}
            </p>
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <a className="btn btn-secondary btn-block" href={api.oauthUrl('google')} style={{ margin: 0, opacity: providers.google ? 1 : 0.5 }}>
              <i className="ph ph-google-logo" /> Continue with Google
            </a>
            {/* <a className="btn btn-secondary btn-block" href={api.oauthUrl('github')} style={{ margin: 0, opacity: providers.github ? 1 : 0.5 }}>
              <i className="ph ph-github-logo" /> Continue with GitHub
            </a> */}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
            <span className="text-muted" style={{ fontSize: 11 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
          </div>

          {mode === 'signup' && (
            <div className="field">
              <label>Full name</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Alex Carter" autoComplete="name" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete="current-password" />
          </div>

          {error && <div className="error"><i className="ph ph-warning-circle" /> {error}</div>}

          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>

          <div className="text-muted" style={{ fontSize: 13 }}>
            {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
            <a href="#" onClick={e => { e.preventDefault(); setError(''); setMode(mode === 'signup' ? 'login' : 'signup'); }}>
              {mode === 'signup' ? 'Sign in' : 'Create an account'}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
