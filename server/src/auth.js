import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { q } from "./db.js";

const COOKIE = "expensio_token";
const isProd = () => process.env.NODE_ENV === "production";

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash || "");

export function setSession(res, user) {
  const token = jwt.sign({ uid: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: isProd() ? "none" : "lax",
    secure: isProd(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: isProd() ? "none" : "lax", secure: isProd() });
}

/** Creates the user's own household on first sign-in. */
export async function ensureHousehold(user) {
  const existing = await q("select household_id from memberships where user_id = $1 limit 1", [user.id]);
  if (existing.rows.length) return existing.rows[0].household_id;
  const hh = await q("insert into households (name, owner_id) values ($1, $2) returning id", [(user.name || "My") + "'s budget", user.id]);
  await q("insert into memberships (household_id, user_id, role) values ($1, $2, $3)", [hh.rows[0].id, user.id, "owner"]);
  // Accept any pending invites addressed to this email.
  const inv = await q("select household_id, role from invites where lower(email) = lower($1)", [user.email]);
  for (const row of inv.rows) {
    await q("insert into memberships (household_id, user_id, role) values ($1,$2,$3) on conflict do nothing", [row.household_id, user.id, row.role]);
  }
  await q("delete from invites where lower(email) = lower($1)", [user.email]);
  return hh.rows[0].id;
}

export async function findOrCreateOAuthUser({ name, email, provider, providerId }) {
  const found = await q("select * from users where lower(email) = lower($1)", [email]);
  if (found.rows.length) return found.rows[0];
  const created = await q("insert into users (name, email, provider, provider_id) values ($1,$2,$3,$4) returning *", [
    name || email.split("@")[0],
    email,
    provider,
    providerId,
  ]);
  return created.rows[0];
}

export async function requireAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
    const token = bearer || req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: "Not signed in" });
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);
    const u = await q("select id, name, email from users where id = $1", [uid]);
    if (!u.rows.length) return res.status(401).json({ error: "Not signed in" });
    req.user = u.rows[0];
    const hhId = Number(req.query.household || 0) || null;
    const m = hhId
      ? await q("select household_id, role from memberships where user_id = $1 and household_id = $2", [uid, hhId])
      : await q("select household_id, role from memberships where user_id = $1 order by household_id limit 1", [uid]);
    if (!m.rows.length) {
      req.householdId = await ensureHousehold(req.user);
      req.role = "owner";
    } else {
      req.householdId = m.rows[0].household_id;
      req.role = m.rows[0].role;
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired" });
  }
}

export const requireEdit = (req, res, next) => (req.role === "view" ? res.status(403).json({ error: "View-only access" }) : next());

export const requireOwner = (req, res, next) => (req.role !== "owner" ? res.status(403).json({ error: "Owner only" }) : next());
