const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const getToken = () => localStorage.getItem("expensio_token");
export const setToken = (t) => (t ? localStorage.setItem("expensio_token", t) : localStorage.removeItem("expensio_token"));

async function call(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  base: BASE,
  me: () => call("/api/auth/me"),
  providers: () => call("/api/auth/providers"),
  signup: async (body) => {
    const d = await call("/api/auth/signup", { method: "POST", body });
    if (d.token) setToken(d.token);
    return d;
  },
  login: async (body) => {
    const d = await call("/api/auth/login", { method: "POST", body });
    if (d.token) setToken(d.token);
    return d;
  },
  logout: async () => {
    const d = await call("/api/auth/logout", { method: "POST" });
    setToken(null);
    return d;
  },
  oauthUrl: (name) => BASE + "/api/auth/" + name,

  summary: (month) => call("/api/summary?month=" + month),
  expenses: (month) => call("/api/expenses?month=" + month),
  addExpense: (body) => call("/api/expenses", { method: "POST", body }),
  deleteExpense: (id) => call("/api/expenses/" + id, { method: "DELETE" }),

  budgets: () => call("/api/budgets"),
  setBudget: (month, amount) => call("/api/budgets/" + month, { method: "PUT", body: { amount } }),
  clearBudget: (month) => call("/api/budgets/" + month, { method: "DELETE" }),

  settings: () => call("/api/settings"),
  saveSettings: (body) => call("/api/settings", { method: "PUT", body }),

  members: (month) => call("/api/members?month=" + month),
  setRole: (id, role) => call("/api/members/" + id, { method: "PUT", body: { role } }),
  removeMember: (id) => call("/api/members/" + id, { method: "DELETE" }),
  invite: (body) => call("/api/invites", { method: "POST", body }),
  cancelInvite: (id) => call("/api/invites/" + id, { method: "DELETE" }),
};
