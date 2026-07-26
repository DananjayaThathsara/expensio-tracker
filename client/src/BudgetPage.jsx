import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import { money, monthLabel, symbolOf, OVER } from "./currencies.js";

export default function BudgetPage({ currency, month, role, onChanged }) {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");

  const load = () =>
    api.budgets().then((d) => {
      setData(d);
      const found = d.budgets.find((b) => b.month === month);
      setDraft(String(Number(found?.amount ?? d.default_budget)));
    });

  useEffect(() => {
    load();
  }, [month]);
  if (!data) return <div className="text-muted">Loading…</div>;

  const save = async () => {
    setMsg("");
    try {
      await api.setBudget(month, Number(String(draft).replace(/[^0-9.]/g, "")));
      await load();
      onChanged();
      setMsg("Saved.");
    } catch (err) {
      setMsg(err.message);
    }
  };
  const reset = async () => {
    setMsg("");
    try {
      await api.clearBudget(month);
      await load();
      onChanged();
      setMsg("Using the default budget.");
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="grid-2">
      <div
        className="card elev-sm"
        style={{ padding: "var(--space-8)", gap: "var(--space-4)" }}
      >
        <div>
          <div className="card-title">Budget for {monthLabel(month)}</div>
          <p className="text-muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
            Every month is set on its own. Skip a month and the default from
            Settings is used automatically.
          </p>
        </div>
        <div className="field">
          <label>Monthly budget</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="text-muted num">{symbolOf(currency)}</span>
            <input
              className="input num"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={role !== "owner"}
              style={{ fontSize: 20, minHeight: 46 }}
            />
          </div>
        </div>
        {role === "owner" ? (
          <div
            style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
          >
            <button
              className="btn btn-primary"
              onClick={save}
              style={{ flex: 1, minWidth: 150 }}
            >
              <i className="ph ph-check" /> Save budget
            </button>
            <button className="btn btn-secondary" onClick={reset}>
              Use default
            </button>
          </div>
        ) : (
          <div className="text-muted" style={{ fontSize: 12.5 }}>
            Only the owner can change the budget.
          </div>
        )}
        {msg && (
          <div className="text-muted" style={{ fontSize: 12.5 }}>
            {msg}
          </div>
        )}
      </div>

      <div className="card elev-sm">
        <div className="card-title">Month by month</div>
        <div className="scroll-x">
          <table className="table num">
            <thead>
              <tr>
                <th>Month</th>
                <th style={{ textAlign: "right" }}>Budget</th>
                <th style={{ textAlign: "right" }}>Spent</th>
                <th style={{ textAlign: "right" }}>Left</th>
              </tr>
            </thead>
            <tbody>
              {data.budgets.map((b) => {
                const leftover = Number(b.amount) - Number(b.spent);
                return (
                  <tr key={b.month}>
                    <td style={{ fontFamily: "var(--font-body)" }}>
                      {monthLabel(b.month)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {money(b.amount, currency)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {money(b.spent, currency)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: leftover < 0 ? OVER : "var(--color-accent-300)",
                      }}
                    >
                      {money(leftover, currency)}
                    </td>
                  </tr>
                );
              })}
              {!data.budgets.length && (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No month-specific budgets yet - the default of{" "}
                    {money(data.default_budget, currency)} applies.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
