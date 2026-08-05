import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const COOKIE = "next_admin_session";
const TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, number>();
const attempts = new Map<string, { count: number; resetAt: number }>();

function password(): string {
  const value = process.env.ADMIN_PASSWORD?.trim();
  if (!value) throw new Error("ADMIN_PASSWORD must be configured");
  return value;
}

function cookies(req: Request): Record<string, string> {
  return Object.fromEntries((req.headers.cookie || "").split(";").map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf("=");
    return [decodeURIComponent(v.slice(0, i)), decodeURIComponent(v.slice(i + 1))];
  }));
}

function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function isAdmin(req: Request): boolean {
  const token = cookies(req)[COOKIE];
  if (!token) return false;
  const expires = sessions.get(token);
  if (!expires || expires < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) return res.status(401).json({ error: "ADMIN_AUTH_REQUIRED" });
  return next();
}

export function loginAdmin(req: Request, res: Response) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const rate = attempts.get(ip);
  if (rate && rate.resetAt > now && rate.count >= 8) {
    return res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
  }
  const supplied = typeof req.body?.password === "string" ? req.body.password : "";
  if (!safeEqual(supplied, password())) {
    attempts.set(ip, { count: rate && rate.resetAt > now ? rate.count + 1 : 1, resetAt: now + 15 * 60 * 1000 });
    return res.status(401).json({ error: "INVALID_PASSWORD" });
  }
  attempts.delete(ip);
  const token = crypto.randomBytes(32).toString("base64url");
  sessions.set(token, now + TTL_MS);
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL_MS / 1000}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res.json({ authenticated: true });
}

export function logoutAdmin(req: Request, res: Response) {
  const token = cookies(req)[COOKIE];
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res.json({ authenticated: false });
}
