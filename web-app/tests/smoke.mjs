import assert from "node:assert/strict";
const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
for (const [path, content] of [
  ["/", "Make it yours."],
  ["/login", "Sign in"],
  ["/signup", "Create account"],
  ["/demo", "Your collection"],
]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), new RegExp(content), path);
  console.log(`PASS ${path}`);
}
const dashboard = await fetch(base + "/dashboard", { redirect: "manual" });
assert.ok([307, 308].includes(dashboard.status));
assert.ok(
  new URL(dashboard.headers.get("location"), base).pathname === "/login",
);
const ai = await fetch(base + "/api/ai-enhance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ wordIds: [] }),
  redirect: "manual",
});
assert.ok(
  [401, 503].includes(ai.status),
  `Unauthenticated AI must be denied: ${ai.status}`,
);
assert.match(ai.headers.get("content-type"), /application\/json/);
const home = await fetch(base);
assert.equal(home.headers.get("x-frame-options"), "DENY");
const callback = await fetch(base + "/auth/callback?next=//example.com", {
  redirect: "manual",
});
assert.equal(
  new URL(callback.headers.get("location"), base).pathname,
  "/login",
);
console.log(
  "PASS private dashboard, AI authentication, callback, security headers",
);
const health = await fetch(base + "/api/health");
const data = await health.json();
assert.ok(["ok", "configuration_required", "unavailable"].includes(data.status));
if (process.env.SMOKE_REQUIRE_READY === "1")
  assert.equal(
    health.status,
    200,
    "Production Supabase configuration is required",
  );
console.log(`PASS health: ${data.status}; AI configured: ${data.services.ai}`);
