#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const envPath = path.join(process.cwd(), "apps", "api", ".env");
if (!fs.existsSync(envPath)) {
  console.error(`Missing env file: ${envPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const map = new Map();
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx <= 0) continue;
  map.set(t.slice(0, idx), t.slice(idx + 1));
}

const secret = map.get("APP_JWT_SECRET");
if (!secret) {
  console.error("APP_JWT_SECRET missing in apps/api/.env");
  process.exit(1);
}

const ensureUserId = (key) => {
  const existing = map.get(key);
  if (existing && existing.length > 0) return existing;
  const id = crypto.randomUUID();
  map.set(key, id);
  return id;
};

const b64url = (obj) =>
  Buffer.from(typeof obj === "string" ? obj : JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const sign = (payload) => {
  const header = { alg: "HS256", typ: "JWT" };
  const p1 = b64url(header);
  const p2 = b64url(payload);
  const body = `${p1}.${p2}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${body}.${sig}`;
};

const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 30;

const customerUserId = ensureUserId("CUSTOMER_USER_ID");
const helperUserId = ensureUserId("HELPER_USER_ID");
const adminUserId = ensureUserId("ADMIN_USER_ID");

const mkPayload = (sub, role) => ({
  sub,
  role,
  src: "helparo_app",
  iat: now,
  exp,
  iss: "helparo-api",
  aud: "helparo-mobile"
});

map.set("CUSTOMER_BEARER_TOKEN", sign(mkPayload(customerUserId, "customer")));
map.set("HELPER_BEARER_TOKEN", sign(mkPayload(helperUserId, "helper")));
map.set("ADMIN_BEARER_TOKEN", sign(mkPayload(adminUserId, "admin")));

const lines = raw.split(/\r?\n/);
const keys = new Set(map.keys());
const seen = new Set();

const updated = lines.map((line) => {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) return line;
  const idx = line.indexOf("=");
  const key = line.slice(0, idx).trim();
  if (!keys.has(key)) return line;
  seen.add(key);
  return `${key}=${map.get(key)}`;
});

for (const key of keys) {
  if (!seen.has(key)) {
    updated.push(`${key}=${map.get(key)}`);
  }
}

fs.writeFileSync(envPath, updated.join("\n"));
console.log("Generated and saved CUSTOMER/HELPER/ADMIN test tokens in apps/api/.env");
