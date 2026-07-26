import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { money } from './currencies.js';

export default function Members({ currency, month, role, me }) {
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('edit');
  const [msg, setMsg] = useState('');

  const load = () => api.members(month).then(setData);
  useEffect(() => { load(); }, [month]);
  if (!data) return <div className="text-muted">Loading…</div>;

  const act = fn => async () => { setMsg(''); try { await fn(); await load(); } catch (err) { setMsg(err.message); } };

  const invite = act(async () => {
    await api.invite({ email, role: inviteRole });
    setEmail('');
    setMsg('Invite sent.');
  });

  return (
    <div className="grid-2">
      <div className="card elev-sm">
        <div className="card-title">People on this budget</div>
        {data.members.map(m => (
          <div key={m.id} className="rowline" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(140px,170px) 36px', boxShadow: 'inset 0 -1px 0 color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14 }}>
                {m.name}{m.role === 'owner' && <span className="tag tag-outline" style={{ marginLeft: 8 }}>Owner</span>}
                {m.id === me.id && <span className="text-muted" style={{ marginLeft: 8, fontSize: 12 }}>you</span>}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>{m.email} · {money(m.spent, currency)} this month</div>
            </div>
            <select className="input" value={m.role === 'owner' ? 'edit' : m.role}
                    disabled={m.role === 'owner' || role !== 'owner'}
                    onChange={e => act(() => api.setRole(m.id, e.target.value))()}>
              <option value="edit">Can add expenses</option>
              <option value="view">View only</option>
            </select>
            <div style={{ textAlign: 'right' }}>
              {role === 'owner' && m.role !== 'owner' && (
                <button className="btn btn-ghost" onClick={act(() => api.removeMember(m.id))} aria-label="Remove member"><i className="ph ph-x" /></button>
              )}
            </div>
          </div>
        ))}
        {data.invites.map(i => (
          <div key={i.id} className="rowline" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', opacity: 0.75 }}>
            <div>
              <div style={{ fontSize: 14 }}>{i.email}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Invite pending · {i.role === 'view' ? 'View only' : 'Can add expenses'}</div>
            </div>
            {role === 'owner' && <button className="btn btn-secondary" onClick={act(() => api.cancelInvite(i.id))}>Cancel</button>}
          </div>
        ))}
      </div>

      <div className="card elev-sm" style={{ padding: 'var(--space-8)' }}>
        <div className="card-title">Invite someone</div>
        <p className="text-muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
          They get an email link and can join with a password or with Google or GitHub. Signing up with the invited address joins this budget automatically.
        </p>
        <div className="field">
          <label>Email address</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" disabled={role !== 'owner'} />
        </div>
        <div className="field">
          <label>Permission</label>
          <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)} disabled={role !== 'owner'}>
            <option value="edit">Can add expenses</option>
            <option value="view">View only</option>
          </select>
        </div>
        <button className="btn btn-primary btn-block" onClick={invite} disabled={role !== 'owner'}>
          <i className="ph ph-paper-plane-tilt" /> Send invite
        </button>
        {msg && <div className="text-muted" style={{ fontSize: 12.5 }}>{msg}</div>}
      </div>
    </div>
  );
}
