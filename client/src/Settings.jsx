import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import { CURRENCIES, symbolOf } from "./currencies.js";

export default function Settings({ role, onChanged, onLogout }) {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.settings().then(setS);
  }, []);
  if (!s) return <div className="text-muted">Loading…</div>;

  const save = async (patch) => {
    setMsg("");
    const next = { ...s, ...patch };
    setS(next);
    try {
      await api.saveSettings({
        default_budget: Number(next.default_budget),
        currency: next.currency,
        alert_threshold: Number(next.alert_threshold),
        notify_over: next.notify_over,
        notify_weekly: next.notify_weekly,
        notify_adds: next.notify_adds,
      });
      onChanged();
      setMsg("Saved.");
    } catch (err) {
      setMsg(err.message);
    }
  };

  const disabled = role !== "owner";
  const country = CURRENCIES.find((c) => c.code === s.currency)?.country || "";

  return (
    <div className="grid-2">
      <div className="card elev-sm" style={{ padding: "var(--space-8)" }}>
        <div className="card-title">Defaults</div>
        <div className="field">
          <label>Default monthly budget</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="text-muted num">{symbolOf(s.currency)}</span>
            <input
              className="input num"
              inputMode="numeric"
              value={s.default_budget}
              disabled={disabled}
              onChange={(e) => setS({ ...s, default_budget: e.target.value })}
              onBlur={() => save({})}
            />
          </div>
          <div className="text-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
            Used for any month you have not set a budget for.
          </div>
        </div>
        <div className="field">
          <label>Currency</label>
          <select
            className="input"
            value={s.currency}
            disabled={disabled}
            onChange={(e) => save({ currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.country}
              </option>
            ))}
          </select>
          <div className="text-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
            Showing amounts in {s.currency} - {country}.
          </div>
        </div>
        <div className="field">
          <label>Alert me when spending passes</label>
          <div className="seg">
            {[70, 80, 90, 100].map((t) => (
              <label
                key={t}
                className="seg-opt num"
                style={
                  Number(s.alert_threshold) === t
                    ? {
                        color: "var(--color-accent)",
                        boxShadow: "inset 0 0 0 1px var(--color-accent)",
                      }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="threshold"
                  checked={Number(s.alert_threshold) === t}
                  disabled={disabled}
                  onChange={() => save({ alert_threshold: t })}
                />
                {t}%
              </label>
            ))}
          </div>
        </div>
        {msg && (
          <div className="text-muted" style={{ fontSize: 12.5 }}>
            {msg}
          </div>
        )}
        {disabled && (
          <div className="text-muted" style={{ fontSize: 12.5 }}>
            Only the owner can change these.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: "var(--space-6)" }}>
        <div className="card elev-sm">
          <div className="card-title">Notifications</div>
          {[
            [
              "notify_over",
              "Threshold and overspend emails",
              "Emailed to every member when spending crosses the threshold",
            ],
            [
              "notify_weekly",
              "Weekly summary",
              "Monday morning: spent so far and what is left",
            ],
            [
              "notify_adds",
              "Every expense a member adds",
              "Can get noisy on a shared budget",
            ],
          ].map(([key, label, sub]) => (
            <div
              key={key}
              className="rowline"
              style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}
            >
              <div>
                <div style={{ fontSize: 13.5 }}>{label}</div>
                <div className="text-muted" style={{ fontSize: 11.5 }}>
                  {sub}
                </div>
              </div>
              <label className="radio">
                <input
                  type="checkbox"
                  checked={!!s[key]}
                  disabled={disabled}
                  onChange={(e) => save({ [key]: e.target.checked })}
                  style={{
                    position: "static",
                    width: 18,
                    height: 18,
                    opacity: 1,
                  }}
                />
              </label>
            </div>
          ))}
        </div>
        <div className="card elev-sm">
          <div className="card-title">Account</div>
          <button className="btn btn-secondary btn-block" onClick={onLogout}>
            <i className="ph ph-sign-out" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
