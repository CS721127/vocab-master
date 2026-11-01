import test from "node:test";
import assert from "node:assert/strict";
import { signupErrorDestination } from "../src/lib/auth-feedback.ts";

test("duplicate registration directs the user to sign in with a clear explanation", () => {
  for (const code of ["user_already_exists", "email_exists"]) {
    const destination = new URL(signupErrorDestination(code), "https://example.com");
    assert.equal(destination.pathname, "/login");
    assert.match(destination.searchParams.get("message"), /already exists.*sign in/i);
    assert.equal(destination.searchParams.has("error"), false);
  }
});

test("rate limits and other failures remain errors on the signup page", () => {
  const limited = new URL(signupErrorDestination("over_email_send_rate_limit"), "https://example.com");
  assert.equal(limited.pathname, "/signup");
  assert.match(limited.searchParams.get("error"), /wait/i);
  const unknown = new URL(signupErrorDestination(undefined), "https://example.com");
  assert.equal(unknown.pathname, "/signup");
  assert.ok(unknown.searchParams.get("error"));
  assert.equal(unknown.searchParams.has("message"), false);
});
