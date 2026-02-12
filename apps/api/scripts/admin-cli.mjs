#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
const adminToken = process.env.ADMIN_BEARER_TOKEN || "";

if (!adminToken) {
  console.error("Missing ADMIN_BEARER_TOKEN in environment");
  process.exit(1);
}

const [,, command, arg1, arg2] = process.argv;
if (!command) {
  console.error("Usage: node scripts/admin-cli.mjs <command> [args]");
  console.error("Commands: approve <helperId>, reject <helperId>, suspend <helperId>, audit, commission <percent>");
  process.exit(1);
}

const request = async (method, route, body) => {
  const res = await fetch(`${apiBase}${route}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${adminToken}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(json, null, 2));
};

if (command === "approve" && arg1) {
  await request("POST", `/admin/helpers/${arg1}/approve`, {});
} else if (command === "reject" && arg1) {
  await request("POST", `/admin/helpers/${arg1}/reject`, {});
} else if (command === "suspend" && arg1) {
  await request("POST", `/admin/helpers/${arg1}/suspend`, {});
} else if (command === "audit") {
  await request("GET", "/admin/audit-logs");
} else if (command === "commission" && arg1) {
  const percent = Number(arg1);
  if (Number.isNaN(percent)) {
    console.error("commission expects numeric percent");
    process.exit(1);
  }
  await request("POST", "/admin/config/commission", { defaultPercent: percent });
} else {
  console.error("Invalid command/arguments");
  process.exit(1);
}
