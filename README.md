# Expensio - monthly budget & shared expenses

A working full-stack app: **React (Vite)** front end, **Node/Express** API, **Postgres on Neon**.
Email + password login, Google and GitHub OAuth, one budget per month with a default fallback,
expenses with category / date / note / method / recurring / receipt, shared members with
add-vs-view permissions, category and per-member charts, and 80%-threshold email alerts.

```
budget-app/
├─ server/          Node + Express API (Postgres/Neon)
│  └─ src/
│     ├─ index.js      all routes
│     ├─ auth.js       sessions, password hashing, permissions
│     ├─ oauth.js      Google + GitHub authorization-code flow
│     ├─ db.js         pg pool
│     ├─ mailer.js     alert + invite emails (logs if no SMTP)
│     ├─ schema.sql    tables
│     └─ init-db.js    applies schema.sql
└─ client/          React front end (Vite)
   └─ src/
      ├─ App.jsx       shell, nav, month + currency
      ├─ Login.jsx     email/password + OAuth buttons
      ├─ Dashboard.jsx remaining / spent / progress
      ├─ BudgetPage.jsx per-month budget
      ├─ Expenses.jsx  list, search, filter, delete
      ├─ Charts.jsx    6-month trend, categories, members
      ├─ Members.jsx   roles + invites
      ├─ Settings.jsx  default budget, currency, alerts
      └─ AddExpense.jsx
```

---

## 1. What you need

- **Node 18 or newer** (`node -v`) - the OAuth code uses the built-in `fetch`.
- A **Neon** account (free): https://neon.tech
- Optional: Google / GitHub OAuth apps, and SMTP credentials for real emails.

## 2. Create the database (Neon)

1. Sign in to Neon → **New project** → pick a region → create.
2. Open **Connection string** and copy the **pooled** connection string. It looks like
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
3. Keep it handy - it is your `DATABASE_URL`.

## 3. Configure and run the API

```bash
cd budget-app/server
cp .env.example .env      # then edit .env
npm install
npm run db:init           # creates all tables in Neon
npm run dev               # http://localhost:4000
```

In `.env` you must set `DATABASE_URL` and `JWT_SECRET` (any long random string).
Check it works: open http://localhost:4000/api/health → `{"ok":true}`.

## 4. Run the front end

```bash
cd budget-app/client
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173, create an account, and you are in. Email/password works with no
OAuth setup at all.

## 5. Optional: Google and GitHub sign-in

**Google** - https://console.cloud.google.com → _APIs & Services_ → _Credentials_ →
_Create credentials_ → _OAuth client ID_ → **Web application**.
Authorised redirect URI: `http://localhost:4000/api/auth/google/callback`.
Put the client ID/secret into the server `.env`.

**GitHub** - https://github.com/settings/developers → _New OAuth App_.
Homepage `http://localhost:5173`, Authorization callback URL
`http://localhost:4000/api/auth/github/callback`. Copy the client ID, generate a secret,
put both into `.env`.

Restart the API. The buttons on the login screen become live (they are dimmed while unconfigured).

## 6. Optional: email alerts

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (any provider - Resend,
SendGrid, Mailgun, Gmail app password). Without SMTP the server prints the email to the console
instead, so nothing breaks in development.

An alert fires at most once per month per level: once when spending crosses the threshold
(default 80%) and once when it crosses 100%.

---

## How the app behaves

- **Monthly budget.** Set an amount for any month on the Budget screen. Months with nothing set
  fall back to the **default monthly budget** in Settings, and the dashboard says which is in use.
- **Roles.** The creator is _owner_: only they change the budget, currency, settings, roles and
  members. _Can add expenses_ members log spending; _view only_ members can see everything and
  add nothing (the API enforces this, not just the UI).
- **Invites.** Owner enters an email → row in `invites` + an email link. When that person signs
  up with the same address (password or OAuth) they are added to the budget automatically.
- **Currency.** ~160 world currencies, each labelled with its country; USD is the default.
  Amounts are formatted with `Intl.NumberFormat`, so symbol and grouping follow the currency.

### API reference

| Method          | Path                                  | Notes                                                        |
| --------------- | ------------------------------------- | ------------------------------------------------------------ |
| POST            | `/api/auth/signup` `/login` `/logout` | httpOnly JWT cookie                                          |
| GET             | `/api/auth/me`                        | user + role + household settings                             |
| GET             | `/api/auth/google` `/api/auth/github` | redirect to provider                                         |
| GET             | `/api/summary?month=YYYY-MM`          | budget, spent, remaining, categories, members, 6-month trend |
| GET POST DELETE | `/api/expenses`                       | list / create / `/:id` delete                                |
| GET PUT DELETE  | `/api/budgets`                        | list / `/:month` set / `/:month` reset to default            |
| GET PUT         | `/api/settings`                       | default budget, currency, threshold, notifications           |
| GET             | `/api/members?month=`                 | members + pending invites                                    |
| PUT DELETE      | `/api/members/:id`                    | change role / remove                                         |
| POST DELETE     | `/api/invites`                        | invite / `/:id` cancel                                       |

---

## 7. Deployment

Front end and API deploy separately. Any Node host works; below is the shortest path.

### API on Render (or Railway / Fly)

1. Push this folder to GitHub.
2. Render → **New Web Service** → pick the repo → **Root directory** `server`.
3. Build command `npm install`, start command `npm start`.
4. Environment variables:
   `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`,
   `CLIENT_ORIGIN=https://your-frontend-domain`,
   `SERVER_ORIGIN=https://your-api-domain`,
   plus the OAuth and SMTP values you use.
5. Deploy, then run the schema once - either locally with production `DATABASE_URL`
   (`npm run db:init`) or from Neon's SQL editor by pasting `server/src/schema.sql`.

### Front end on Vercel (or Netlify / Cloudflare Pages)

1. Vercel → **New Project** → same repo → **Root directory** `client`.
2. Framework _Vite_, build `npm run build`, output `dist`.
3. Environment variable `VITE_API_URL=https://your-api-domain`.
4. Deploy.

### After the first deploy

- Update the OAuth redirect URIs to the production API:
  `https://your-api-domain/api/auth/google/callback` and `…/github/callback`.
- Set `CLIENT_ORIGIN` on the API to the exact deployed front-end URL - CORS and the session
  cookie both depend on it.
- `NODE_ENV=production` makes the cookie `Secure` + `SameSite=None`, which is required for a
  cookie that crosses domains. Both sides must be HTTPS.
- Neon free projects suspend when idle; the first request after a pause takes a second or two.

### Same-domain alternative (no CORS)

Put the API behind `/api` on the front-end host (Vercel rewrites, Netlify proxy, or an Nginx
`location /api`), set `VITE_API_URL=` empty, and the cookie stays first-party - simplest for
production if you would rather avoid cross-site cookies entirely.

## Troubleshooting

| Symptom                               | Cause                                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| `relation "users" does not exist`     | `npm run db:init` not run against this database                      |
| Login works, then every call is 401   | `CLIENT_ORIGIN` mismatch, or `NODE_ENV=production` without HTTPS     |
| `self signed certificate` / SSL error | `DATABASE_URL` missing `?sslmode=require`                            |
| OAuth returns `redirect_uri_mismatch` | Provider redirect URI ≠ `SERVER_ORIGIN/api/auth/<provider>/callback` |
| Buttons dimmed on login screen        | That provider's client ID/secret is not set                          |
| No emails arrive                      | No SMTP configured - check the server console                        |
