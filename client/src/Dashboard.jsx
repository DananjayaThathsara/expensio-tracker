import React from "react";
import { money, monthLabel, toneOf, iconOf, OVER, WARN } from "./currencies.js";

export default function Dashboard({ summary, expenses, currency, month, go }) {
  if (!summary) return <div className="text-muted">Loading…</div>;
  const pct = summary.budget > 0 ? (summary.spent / summary.budget) * 100 : 0;
  const color =
    pct >= 100
      ? OVER
      : pct >= summary.alert_threshold
        ? WARN
        : "var(--color-accent)";
  const maxCat = summary.by_category[0]?.amount || 1;
  const days = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate();
  const now = new Date();
  const today = month === now.toISOString().slice(0, 7) ? now.getDate() : days;
  const left = Math.max(days - today + 1, 1);

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      {pct >= summary.alert_threshold && (
        <div
          className="card"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: "var(--space-3)",
            boxShadow: `inset 3px 0 0 ${color}, var(--shadow-sm)`,
          }}
        >
          <i className="ph ph-warning-circle" style={{ color }} />
          <div style={{ flex: 1, fontSize: 13.5 }}>
            {pct >= 100
              ? `You are over budget for ${monthLabel(month)} by ${money(summary.spent - summary.budget, currency)}.`
              : `You have used ${Math.round(pct)}% of your ${monthLabel(month)} budget.`}
          </div>
          <span className="text-muted" style={{ fontSize: 12 }}>
            <i className="ph ph-envelope-simple" /> members emailed
          </span>
        </div>
      )}

      <div className="grid-2">
        <div
          className="card elev-sm"
          style={{ padding: "var(--space-8)", gap: "var(--space-6)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="card-kicker">Remaining · {monthLabel(month)}</div>
              <div className="hero-num num" style={{ color }}>
                {money(summary.remaining, currency)}
              </div>
              <p
                className="text-muted"
                style={{ fontSize: 13, margin: "6px 0 0" }}
              >
                {summary.remaining > 0
                  ? `${money(summary.remaining / left, currency)} a day across the remaining ${left} days`
                  : "Over budget - nothing left for the rest of the month"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Budget
              </div>
              <div
                className="num"
                style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}
              >
                {money(summary.budget, currency)}
              </div>
              <div className="text-muted" style={{ fontSize: 11 }}>
                {summary.budget_is_default
                  ? "default from settings"
                  : "set for this month"}
              </div>
              <button className="btn btn-ghost" onClick={() => go("budget")}>
                Edit <i className="ph ph-arrow-right" />
              </button>
            </div>
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                marginBottom: 6,
              }}
            >
              <span className="text-muted">
                Spent{" "}
                <span className="num" style={{ color: "var(--color-text)" }}>
                  {money(summary.spent, currency)}
                </span>
              </span>
              <span style={{ color }}>{Math.round(pct)}% used</span>
            </div>
            <div className="track">
              <div
                style={{ width: Math.min(pct, 100) + "%", background: color }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: "var(--space-6)" }}>
          <div className="card elev-sm">
            <div className="card-kicker">Total spent so far</div>
            <div
              className="num"
              style={{ fontFamily: "var(--font-heading)", fontSize: 30 }}
            >
              {money(summary.spent, currency)}
            </div>
            <div className="card-meta">
              {summary.count} expenses · {summary.by_category.length} categories
            </div>
          </div>
          <div className="card elev-sm">
            <div className="card-kicker">Where it went</div>
            <div
              style={{ display: "grid", gap: "var(--space-3)", marginTop: 6 }}
            >
              {summary.by_category.slice(0, 5).map((c) => (
                <div key={c.category}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span>{c.category}</span>
                    <span className="num text-muted">
                      {money(c.amount, currency)}
                    </span>
                  </div>
                  <div className="track" style={{ height: 5 }}>
                    <div
                      style={{
                        width: Math.max((c.amount / maxCat) * 100, 3) + "%",
                        background: toneOf(c.category),
                      }}
                    />
                  </div>
                </div>
              ))}
              {!summary.by_category.length && (
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Nothing logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card elev-sm">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="card-title">Recent expenses</div>
          <button className="btn btn-ghost" onClick={() => go("expenses")}>
            View all
          </button>
        </div>
        {expenses.slice(0, 6).map((e) => (
          <div
            key={e.id}
            className="rowline"
            style={{ gridTemplateColumns: "26px minmax(0,1fr) auto" }}
          >
            <i
              className={"ph " + iconOf(e.category)}
              style={{ color: toneOf(e.category) }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5 }}>{e.note || e.category}</div>
              <div className="text-muted" style={{ fontSize: 11.5 }}>
                {String(e.spent_on).slice(0, 10)} · {e.who} · {e.method}
              </div>
            </div>
            <div className="num">{money(e.amount, currency)}</div>
          </div>
        ))}
        {!expenses.length && (
          <div className="text-muted" style={{ fontSize: 13 }}>
            No expenses for this month yet.
          </div>
        )}
      </div>
    </div>
  );
}
