import React, { useMemo, useState } from 'react';
import { CATEGORIES, money, toneOf, iconOf } from './currencies.js';

export default function Expenses({ expenses, currency, role, onDelete }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter(e =>
      (category === 'all' || e.category === category) &&
      (!q || [e.note, e.category, e.who, e.method].join(' ').toLowerCase().includes(q))
    );
  }, [expenses, query, category]);

  const total = rows.reduce((a, e) => a + Number(e.amount), 0);

  return (
    <div className="card elev-sm">
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" style={{ flex: 1, minWidth: 180 }} type="search" value={query}
               onChange={e => setQuery(e.target.value)} placeholder="Search notes, categories, people…" />
        <select className="input" style={{ width: 'auto' }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <span className="num text-muted" style={{ fontSize: 13 }}>{rows.length} expenses · {money(total, currency)}</span>
      </div>

      <div className="scroll-x desktop-only">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Description</th><th>Category</th><th>Added by</th><th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th><th /></tr>
          </thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id}>
                <td className="num text-muted">{String(e.spent_on).slice(0, 10)}</td>
                <td>
                  <div>{e.note || e.category}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {e.recurring ? 'Recurring monthly' : 'One-off'}{e.receipt_url ? ' · receipt attached' : ''}
                  </div>
                </td>
                <td><span className="tag tag-accent">{e.category}</span></td>
                <td>{e.who}</td>
                <td className="text-muted">{e.method}</td>
                <td className="num" style={{ textAlign: 'right' }}>{money(e.amount, currency)}</td>
                <td style={{ textAlign: 'right' }}>
                  {role !== 'view' && (
                    <button className="btn btn-ghost" onClick={() => onDelete(e.id)} aria-label="Delete expense"><i className="ph ph-trash" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-only" style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {rows.map(e => (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) auto', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-900)' }}>
            <i className={'ph ' + iconOf(e.category)} style={{ color: toneOf(e.category), marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14 }}>{e.note || e.category}</div>
              <div className="text-muted" style={{ fontSize: 11.5 }}>{String(e.spent_on).slice(0, 10)} · {e.who} · {e.method}</div>
              <span className="tag tag-accent" style={{ marginTop: 6 }}>{e.category}</span>
            </div>
            <div style={{ display: 'grid', justifyItems: 'end' }}>
              <div className="num">{money(e.amount, currency)}</div>
              {role !== 'view' && <button className="btn btn-ghost" onClick={() => onDelete(e.id)} aria-label="Delete expense"><i className="ph ph-trash" /></button>}
            </div>
          </div>
        ))}
      </div>

      {!rows.length && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <i className="ph ph-receipt" style={{ fontSize: 24, color: 'var(--color-neutral-600)' }} />
          <div style={{ fontSize: 14, marginTop: 8 }}>Nothing logged here yet</div>
          <p className="text-muted" style={{ fontSize: 12.5 }}>Expenses you or your members add will appear in this list.</p>
        </div>
      )}
    </div>
  );
}
