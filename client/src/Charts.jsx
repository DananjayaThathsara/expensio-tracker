import React from 'react';
import { money, monthLabel, toneOf, OVER } from './currencies.js';

export default function Charts({ summary, currency, month }) {
  if (!summary) return <div className="text-muted">Loading…</div>;
  const maxBar = Math.max(1, ...summary.trend.map(t => Math.max(t.budget, t.spent)));
  const maxCat = summary.by_category[0]?.amount || 1;
  const maxWho = summary.by_member[0]?.amount || 1;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div className="card elev-sm" style={{ padding: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div className="card-title">Budget versus spend</div>
            <div className="text-muted" style={{ fontSize: 12.5 }}>Last six months</div>
          </div>
          <div className="text-muted" style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 11.5 }}>
            <span><span style={{ display: 'inline-block', width: 9, height: 9, background: 'var(--color-accent-500)', marginRight: 6 }} />Spent</span>
            <span><span style={{ display: 'inline-block', width: 9, height: 9, background: 'var(--color-neutral-800)', marginRight: 6 }} />Budget</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: 'var(--space-4)', alignItems: 'end', height: 200, marginTop: 'var(--space-6)' }}>
          {summary.trend.map(t => (
            <div key={t.month} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 8 }}>
              <div className="num text-muted" style={{ fontSize: 10.5, textAlign: 'center' }}>{money(t.spent, currency)}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: '100%' }}>
                <div style={{ width: '44%', background: 'var(--color-neutral-800)', height: Math.max((t.budget / maxBar) * 100, 2) + '%', borderRadius: '4px 4px 0 0' }} />
                <div style={{ width: '44%', background: t.spent > t.budget ? OVER : 'var(--color-accent-500)', height: Math.max((t.spent / maxBar) * 100, 2) + '%', borderRadius: '4px 4px 0 0' }} />
              </div>
              <div className="text-muted" style={{ fontSize: 11, textAlign: 'center' }}>{t.month.slice(5)}/{t.month.slice(2, 4)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card elev-sm">
          <div className="card-title">Category breakdown · {monthLabel(month)}</div>
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 8 }}>
            {summary.by_category.map(c => (
              <div key={c.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{c.category}</span>
                  <span className="num text-muted">{money(c.amount, currency)} · {summary.spent ? Math.round((c.amount / summary.spent) * 100) : 0}%</span>
                </div>
                <div className="track"><div style={{ width: Math.max((c.amount / maxCat) * 100, 3) + '%', background: toneOf(c.category) }} /></div>
              </div>
            ))}
            {!summary.by_category.length && <div className="text-muted" style={{ fontSize: 13 }}>No expenses this month.</div>}
          </div>
        </div>

        <div className="card elev-sm">
          <div className="card-title">Who spent what</div>
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 8 }}>
            {summary.by_member.map(m => (
              <div key={m.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{m.name}</span><span className="num text-muted">{money(m.amount, currency)}</span>
                </div>
                <div className="track"><div style={{ width: Math.max((m.amount / maxWho) * 100, 3) + '%', background: 'var(--color-accent-500)' }} /></div>
              </div>
            ))}
            {!summary.by_member.length && <div className="text-muted" style={{ fontSize: 13 }}>No expenses this month.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
