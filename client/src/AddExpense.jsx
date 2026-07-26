import React, { useState } from 'react';
import { CATEGORIES, METHODS, money, symbolOf, todayISO } from './currencies.js';

export default function AddExpense({ currency, remaining, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: '', category: CATEGORIES[0].name, spent_on: todayISO(),
    method: 'Card', note: '', recurring: false, receipt_url: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = key => e => setForm({ ...form, [key]: e.target.value });
  const amount = Number(String(form.amount).replace(/[^0-9.]/g, '')) || 0;

  const save = async () => {
    if (amount <= 0) return setError('Enter an amount greater than zero.');
    setBusy(true);
    try {
      await onSave({ ...form, amount });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ width: 'min(560px, 100%)', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="dialog-title">Add expense</div>
            <div className="text-muted" style={{ fontSize: 12.5 }}>{money(remaining, currency)} left this month</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close"><i className="ph ph-x" /></button>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="field">
            <label>Amount</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="text-muted num">{symbolOf(currency)}</span>
              <input className="input num" inputMode="decimal" value={form.amount} onChange={set('amount')} placeholder="0" />
            </div>
          </div>
          <div className="field">
            <label>Date</label>
            <input className="input" type="date" value={form.spent_on} onChange={set('spent_on')} />
          </div>
          <div className="field">
            <label>Category</label>
            <select className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Payment method</label>
            <select className="input" value={form.method} onChange={set('method')}>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Note</label>
          <input className="input" value={form.note} onChange={set('note')} placeholder="What was this for?" />
        </div>
        <div className="field">
          <label>Receipt photo URL (optional)</label>
          <input className="input" value={form.receipt_url} onChange={set('receipt_url')} placeholder="https://…" />
        </div>

        <label className="radio" style={{ gap: 10 }}>
          <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} style={{ position: 'static', width: 16, height: 16, opacity: 1 }} />
          Repeats monthly
        </label>

        <p className="text-muted" style={{ fontSize: 12.5, margin: 0, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-900)' }}>
          {amount > 0 ? `After this, ${money(remaining - amount, currency)} left this month.` : 'Enter an amount to see what it leaves you.'}
        </p>
        {error && <div className="error">{error}</div>}

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}><i className="ph ph-check" /> {busy ? 'Saving…' : 'Save expense'}</button>
        </div>
      </div>
    </div>
  );
}
