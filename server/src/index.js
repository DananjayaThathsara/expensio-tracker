import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { q } from './db.js';
import { sendMail } from './mailer.js';
import { google, github } from './oauth.js';
import {
  hashPassword, checkPassword, setSession, clearSession, ensureHousehold,
  findOrCreateOAuthUser, requireAuth, requireEdit, requireOwner
} from './auth.js';

const app = express();
const CLIENT = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const monthOf = d => String(d).slice(0, 7);
const num = v => Number(v || 0);
const bad = (res, msg) => res.status(400).json({ error: msg });

/* ─────────────── auth ─────────────── */

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim()) return bad(res, 'Name is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return bad(res, 'Valid email is required');
  if ((password || '').length < 6) return bad(res, 'Password must be at least 6 characters');
  const exists = await q('select 1 from users where lower(email) = lower($1)', [email]);
  if (exists.rows.length) return bad(res, 'That email is already registered');
  const hash = await hashPassword(password);
  const u = await q(
    'insert into users (name, email, password_hash) values ($1,$2,$3) returning id, name, email',
    [name.trim(), email.trim(), hash]
  );
  await ensureHousehold(u.rows[0]);
  setSession(res, u.rows[0]);
  res.json({ user: u.rows[0] });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const found = await q('select * from users where lower(email) = lower($1)', [email || '']);
  const user = found.rows[0];
  if (!user || !(await checkPassword(password || '', user.password_hash)))
    return res.status(401).json({ error: 'Wrong email or password' });
  await ensureHousehold(user);
  setSession(res, user);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/logout', (req, res) => { clearSession(res); res.json({ ok: true }); });

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const hh = await q('select * from households where id = $1', [req.householdId]);
  res.json({ user: req.user, role: req.role, household: hh.rows[0] });
});

app.get('/api/auth/providers', (req, res) =>
  res.json({ google: google.configured(), github: github.configured() }));

for (const [name, provider] of [['google', google], ['github', github]]) {
  app.get(`/api/auth/${name}`, (req, res) => {
    if (!provider.configured()) return res.redirect(`${CLIENT}/?error=${name}_not_configured`);
    res.redirect(provider.authUrl(name));
  });
  app.get(`/api/auth/${name}/callback`, async (req, res) => {
    try {
      const profile = await provider.profile(req.query.code);
      const user = await findOrCreateOAuthUser(profile);
      await ensureHousehold(user);
      setSession(res, user);
      res.redirect(CLIENT);
    } catch (err) {
      console.error(err);
      res.redirect(`${CLIENT}/?error=${name}_sign_in_failed`);
    }
  });
}

/* ─────────────── settings ─────────────── */

app.get('/api/settings', requireAuth, async (req, res) => {
  const hh = await q('select * from households where id = $1', [req.householdId]);
  res.json(hh.rows[0]);
});

app.put('/api/settings', requireAuth, requireOwner, async (req, res) => {
  const { default_budget, currency, alert_threshold, notify_over, notify_weekly, notify_adds } = req.body || {};
  const hh = await q(
    `update households set
       default_budget  = coalesce($2, default_budget),
       currency        = coalesce($3, currency),
       alert_threshold = coalesce($4, alert_threshold),
       notify_over     = coalesce($5, notify_over),
       notify_weekly   = coalesce($6, notify_weekly),
       notify_adds     = coalesce($7, notify_adds)
     where id = $1 returning *`,
    [req.householdId, default_budget ?? null, currency ?? null, alert_threshold ?? null,
     notify_over ?? null, notify_weekly ?? null, notify_adds ?? null]
  );
  res.json(hh.rows[0]);
});

/* ─────────────── budgets ─────────────── */

app.get('/api/budgets', requireAuth, async (req, res) => {
  const hh = await q('select default_budget from households where id = $1', [req.householdId]);
  const rows = await q(
    `select b.month,
            b.amount,
            (select coalesce(sum(amount),0) from expenses e
              where e.household_id = b.household_id and to_char(e.spent_on,'YYYY-MM') = b.month) as spent
       from monthly_budgets b where b.household_id = $1 order by b.month desc`,
    [req.householdId]
  );
  res.json({ default_budget: num(hh.rows[0].default_budget), budgets: rows.rows });
});

app.put('/api/budgets/:month', requireAuth, requireOwner, async (req, res) => {
  const month = req.params.month;
  if (!/^\d{4}-\d{2}$/.test(month)) return bad(res, 'Month must look like 2026-07');
  const amount = num(req.body?.amount);
  if (amount <= 0) return bad(res, 'Amount must be greater than zero');
  const row = await q(
    `insert into monthly_budgets (household_id, month, amount) values ($1,$2,$3)
     on conflict (household_id, month) do update set amount = excluded.amount returning *`,
    [req.householdId, month, amount]
  );
  res.json(row.rows[0]);
});

app.delete('/api/budgets/:month', requireAuth, requireOwner, async (req, res) => {
  await q('delete from monthly_budgets where household_id = $1 and month = $2', [req.householdId, req.params.month]);
  res.json({ ok: true });
});

/* ─────────────── expenses ─────────────── */

app.get('/api/expenses', requireAuth, async (req, res) => {
  const month = req.query.month || monthOf(new Date().toISOString());
  const rows = await q(
    `select e.*, u.name as who
       from expenses e left join users u on u.id = e.user_id
      where e.household_id = $1 and to_char(e.spent_on,'YYYY-MM') = $2
      order by e.spent_on desc, e.id desc`,
    [req.householdId, month]
  );
  res.json(rows.rows.map(r => ({ ...r, amount: num(r.amount) })));
});

app.post('/api/expenses', requireAuth, requireEdit, async (req, res) => {
  const { amount, category, spent_on, note, method, recurring, receipt_url } = req.body || {};
  if (num(amount) <= 0) return bad(res, 'Amount must be greater than zero');
  if (!category) return bad(res, 'Category is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spent_on || '')) return bad(res, 'Date must look like 2026-07-25');
  const row = await q(
    `insert into expenses (household_id, user_id, amount, category, spent_on, note, method, recurring, receipt_url)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [req.householdId, req.user.id, num(amount), category, spent_on, note || '', method || 'Card', !!recurring, receipt_url || null]
  );
  await checkThreshold(req.householdId, monthOf(spent_on));
  res.json({ ...row.rows[0], amount: num(row.rows[0].amount), who: req.user.name });
});

app.delete('/api/expenses/:id', requireAuth, requireEdit, async (req, res) => {
  await q('delete from expenses where id = $1 and household_id = $2', [req.params.id, req.householdId]);
  res.json({ ok: true });
});

/* ─────────────── summary (dashboard + charts) ─────────────── */

app.get('/api/summary', requireAuth, async (req, res) => {
  const month = req.query.month || monthOf(new Date().toISOString());
  const hh = (await q('select * from households where id = $1', [req.householdId])).rows[0];

  const budgetRow = await q('select amount from monthly_budgets where household_id = $1 and month = $2', [req.householdId, month]);
  const budget = budgetRow.rows.length ? num(budgetRow.rows[0].amount) : num(hh.default_budget);

  const totals = await q(
    `select coalesce(sum(amount),0) as spent, count(*) as count from expenses
      where household_id = $1 and to_char(spent_on,'YYYY-MM') = $2`,
    [req.householdId, month]
  );
  const byCategory = await q(
    `select category, sum(amount) as amount from expenses
      where household_id = $1 and to_char(spent_on,'YYYY-MM') = $2
      group by category order by amount desc`,
    [req.householdId, month]
  );
  const byMember = await q(
    `select coalesce(u.name,'Removed user') as name, sum(e.amount) as amount
       from expenses e left join users u on u.id = e.user_id
      where e.household_id = $1 and to_char(e.spent_on,'YYYY-MM') = $2
      group by u.name order by amount desc`,
    [req.householdId, month]
  );
  const trend = await q(
    `with months as (
       select to_char((date_trunc('month', $2::date) - (n || ' month')::interval), 'YYYY-MM') as month
         from generate_series(5, 0, -1) as n
     )
     select m.month,
            coalesce((select amount from monthly_budgets b where b.household_id = $1 and b.month = m.month), $3) as budget,
            coalesce((select sum(amount) from expenses e where e.household_id = $1 and to_char(e.spent_on,'YYYY-MM') = m.month), 0) as spent
       from months m order by m.month`,
    [req.householdId, month + '-01', num(hh.default_budget)]
  );

  const spent = num(totals.rows[0].spent);
  res.json({
    month,
    currency: hh.currency,
    alert_threshold: hh.alert_threshold,
    budget,
    budget_is_default: budgetRow.rows.length === 0,
    spent,
    remaining: budget - spent,
    count: Number(totals.rows[0].count),
    by_category: byCategory.rows.map(r => ({ ...r, amount: num(r.amount) })),
    by_member: byMember.rows.map(r => ({ ...r, amount: num(r.amount) })),
    trend: trend.rows.map(r => ({ month: r.month, budget: num(r.budget), spent: num(r.spent) }))
  });
});

/* ─────────────── members & invites ─────────────── */

app.get('/api/members', requireAuth, async (req, res) => {
  const month = req.query.month || monthOf(new Date().toISOString());
  const members = await q(
    `select u.id, u.name, u.email, m.role,
            coalesce((select sum(e.amount) from expenses e
                       where e.user_id = u.id and e.household_id = m.household_id
                         and to_char(e.spent_on,'YYYY-MM') = $2), 0) as spent
       from memberships m join users u on u.id = m.user_id
      where m.household_id = $1
      order by (m.role = 'owner') desc, u.name`,
    [req.householdId, month]
  );
  const invites = await q('select id, email, role from invites where household_id = $1 order by id', [req.householdId]);
  res.json({
    members: members.rows.map(r => ({ ...r, spent: num(r.spent) })),
    invites: invites.rows
  });
});

app.put('/api/members/:id', requireAuth, requireOwner, async (req, res) => {
  const role = req.body?.role;
  if (!['edit', 'view'].includes(role)) return bad(res, 'Role must be edit or view');
  const owner = await q('select role from memberships where household_id = $1 and user_id = $2', [req.householdId, req.params.id]);
  if (owner.rows[0]?.role === 'owner') return bad(res, "The owner's role cannot be changed");
  await q('update memberships set role = $3 where household_id = $1 and user_id = $2', [req.householdId, req.params.id, role]);
  res.json({ ok: true });
});

app.delete('/api/members/:id', requireAuth, requireOwner, async (req, res) => {
  const m = await q('select role from memberships where household_id = $1 and user_id = $2', [req.householdId, req.params.id]);
  if (m.rows[0]?.role === 'owner') return bad(res, 'The owner cannot be removed');
  await q('delete from memberships where household_id = $1 and user_id = $2', [req.householdId, req.params.id]);
  res.json({ ok: true });
});

app.post('/api/invites', requireAuth, requireOwner, async (req, res) => {
  const { email, role } = req.body || {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return bad(res, 'Valid email is required');
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const existing = await q(
    `select 1 from memberships m join users u on u.id = m.user_id
      where m.household_id = $1 and lower(u.email) = lower($2)`,
    [req.householdId, email]
  );
  if (existing.rows.length) return bad(res, 'That person is already a member');
  const row = await q(
    'insert into invites (household_id, email, role, token) values ($1,$2,$3,$4) returning id, email, role',
    [req.householdId, email.trim(), role === 'view' ? 'view' : 'edit', token]
  );
  try {
    await sendMail({
    to: [email],
    subject: 'You have been invited to a shared budget',
    text: `Join the budget here: ${CLIENT}/?invite=${token}\n\nSign up with this email address (${email}) and you will be added automatically.`
  });
  res.json(row.rows[0]);
  } catch (error) {
    console.error('Invite email failed:', e.message);
    res.json({"message":e.message});
  }

});

app.delete('/api/invites/:id', requireAuth, requireOwner, async (req, res) => {
  await q('delete from invites where id = $1 and household_id = $2', [req.params.id, req.householdId]);
  res.json({ ok: true });
});

/* ─────────────── threshold email alerts ─────────────── */

async function checkThreshold(householdId, month) {
  const hh = (await q('select * from households where id = $1', [householdId])).rows[0];
  if (!hh?.notify_over) return;
  const b = await q('select amount from monthly_budgets where household_id = $1 and month = $2', [householdId, month]);
  const budget = b.rows.length ? num(b.rows[0].amount) : num(hh.default_budget);
  if (budget <= 0) return;
  const t = await q(
    `select coalesce(sum(amount),0) as spent from expenses
      where household_id = $1 and to_char(spent_on,'YYYY-MM') = $2`,
    [householdId, month]
  );
  const pct = (num(t.rows[0].spent) / budget) * 100;
  const level = pct >= 100 ? 100 : pct >= hh.alert_threshold ? hh.alert_threshold : 0;
  if (!level) return;
  const already = await q('select 1 from alerts_sent where household_id = $1 and month = $2 and level = $3', [householdId, month, level]);
  if (already.rows.length) return;
  await q('insert into alerts_sent (household_id, month, level) values ($1,$2,$3)', [householdId, month, level]);
  const people = await q(
    'select u.email from memberships m join users u on u.id = m.user_id where m.household_id = $1',
    [householdId]
  );
  await sendMail({
    to: people.rows.map(r => r.email),
    subject: level >= 100 ? `Over budget for ${month}` : `${Math.round(pct)}% of the ${month} budget used`,
    text: `Spent ${num(t.rows[0].spent)} of ${budget} (${Math.round(pct)}%) for ${month}.`
  });
}

/* ─────────────── start ─────────────── */

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log('API listening on http://localhost:' + port));
