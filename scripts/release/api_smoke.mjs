#!/usr/bin/env node
const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
const customerToken = process.env.CUSTOMER_BEARER_TOKEN || "";
const helperToken = process.env.HELPER_BEARER_TOKEN || "";

const call = async (method, route, token = "", body) => {
  const res = await fetch(`${apiBase}${route}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
};

const assertOk = (label, response) => {
  if (!response.ok) {
    console.error(`[FAIL] ${label}`, response.status, JSON.stringify(response.data));
    process.exit(1);
  }
  console.log(`[OK] ${label}`);
};

const main = async () => {
  assertOk("health", await call("GET", "/health"));
  assertOk("categories", await call("GET", "/categories"));
  assertOk("zones", await call("GET", "/zones"));

  if (customerToken) {
    assertOk("auth/me customer", await call("GET", "/auth/me", customerToken));
    assertOk("addresses customer", await call("GET", "/addresses", customerToken));
  } else {
    console.log("[SKIP] customer token checks");
  }

  if (helperToken) {
    assertOk("helper/me", await call("GET", "/helper/me", helperToken));
    assertOk("helper/bookings", await call("GET", "/helper/bookings", helperToken));
    assertOk("helper/earnings", await call("GET", "/helper/earnings", helperToken));
  } else {
    console.log("[SKIP] helper token checks");
  }

  console.log("\nAPI smoke checks passed.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
