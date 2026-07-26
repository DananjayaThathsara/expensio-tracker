import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { monthLabel, recentMonths, CURRENCIES, symbolOf } from './currencies.js';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import BudgetPage from './BudgetPage.jsx';
import Expenses from './Expenses.jsx';
import Charts from './Charts.jsx';
import Members from './Members.jsx';
import Settings from './Settings.jsx';
import AddExpense from './AddExpense.jsx';

const NAV = [
  ['dashboard', 'Dashboard', 'ph-house'],
  ['expenses', 'Expenses', 'ph-list-dashes'],
  ['budget', 'Budget', 'ph-target'],
  ['charts', 'Breakdown', 'ph-chart-bar'],
  ['members', 'Members', 'ph-users'],
  ['settings', 'Settings', 'ph-gear']
];
const MONTHS = recentMonths(12);

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [screen, setScreen] = useState('dashboard');
  const [month, setMonth] = useState(MONTHS[0]);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.me().then(setSession).catch(() => setSession(null));
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const [s, e, me] = await Promise.all([api.summary(month), api.expenses(month), api.me()]);
      setSummary(s); setExpenses(e); setSession(me);
    } catch (err) { setError(err.message); }
  }, [session?.user?.id, month]);

  useEffect(() => { refresh(); }, [refresh]);

  if (session === undefined) return <div style={{ padding: 40 }} className="text-muted">Loading…</div>;
  if (!session) return <Login onSignedIn={() => api.me().then(setSession)} />;

  const currency = session.household.currency || 'USD';
  const logout = async () => { await api.logout(); setSession(null); };

  const addExpense = async body => { await api.addExpense(body); await refresh(); };
  const removeExpense = async id => { await api.deleteExpense(id); await refresh(); };

  const page = {
    dashboard: <Dashboard summary={summary} expenses={expenses} currency={currency} month={month} go={setScreen} />,
    budget: <BudgetPage currency={currency} month={month} role={session.role} onChanged={refresh} />,
    expenses: <Expenses expenses={expenses} currency={currency} role={session.role} onDelete={removeExpense} />,
    charts: <Charts summary={summary} currency={currency} month={month} />,
    members: <Members currency={currency} month={month} role={session.role} me={session.user} />,
    settings: <Settings role={session.role} onChanged={refresh} onLogout={logout} />
  }[screen];

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
            <i className="ph ph-wallet" style={{ color: 'var(--color-accent)' }} />Expensio
          </div>
          <nav className="desktop-only" style={{ display: 'flex', gap: 'var(--space-4)' }}>
            {NAV.map(([key, label]) => (
              <button key={key} className="navlink" data-active={screen === key} onClick={() => setScreen(key)}>{label}</button>
            ))}
          </nav>
          <select className="input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <select className="input desktop-only" style={{ width: 'auto' }} value={currency}
                  disabled={session.role !== 'owner'}
                  onChange={async e => { await api.saveSettings({ currency: e.target.value }); await refresh(); }}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{symbolOf(c.code)} {c.code}</option>)}
          </select>
          {session.role !== 'view' && (
            <button className="btn btn-primary desktop-only" onClick={() => setShowAdd(true)}><i className="ph ph-plus" /> Add expense</button>
          )}
        </div>
      </div>

      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <div>
            <h3 style={{ margin: 0 }}>{NAV.find(n => n[0] === screen)[1]}</h3>
            <p className="text-muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
              {monthLabel(month)} · signed in as {session.user.name} ({session.role})
            </p>
          </div>
        </div>
        {error && <div className="error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
        {page}
      </div>

      {session.role !== 'view' && (
        <button className="btn btn-primary fab" onClick={() => setShowAdd(true)} aria-label="Add expense"><i className="ph ph-plus" style={{ fontSize: 22 }} /></button>
      )}
      <nav className="tabbar">
        {NAV.map(([key, label, icon]) => (
          <button key={key} data-active={screen === key} onClick={() => setScreen(key)}>
            <i className={'ph ' + icon} style={{ fontSize: 19 }} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {showAdd && (
        <AddExpense currency={currency} remaining={summary?.remaining || 0}
                    onClose={() => setShowAdd(false)} onSave={addExpense} />
      )}
    </>
  );
}
