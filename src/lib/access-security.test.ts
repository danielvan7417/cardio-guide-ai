import { describe, expect, test } from "bun:test";
import { failedLogin, remainingLockSeconds, signupSchema, emptyAttempts, normalizeAttempts, isInvalidCredentials } from "./access-security";

const accepts = (password: string) => signupSchema.safeParse({ email: "test@example.com", password, nombre: "Test", consentimiento: true }).success;

describe("Registration password rules", () => {
  test("minimum 8 characters", () => { expect(accepts("Abc123!")).toBe(false); expect(accepts("Abcd123!")).toBe(true); });
  test("requires a number", () => { expect(accepts("Abcdefg!")).toBe(false); expect(accepts("Abcdef1!")).toBe(true); });
  test("requires an uppercase letter", () => { expect(accepts("abcdef1!")).toBe(false); expect(accepts("Abcdef1!")).toBe(true); });
  test("requires a special character, not whitespace", () => { expect(accepts("Abcdef12")).toBe(false); expect(accepts("Abcdef1 ")).toBe(false); expect(accepts("Abcdef1!")).toBe(true); });
});

describe("Browser login cooldown", () => {
  test("blocks on the fifth failure, not earlier", () => {
    let state = { ...emptyAttempts };
    for (let i = 1; i <= 4; i++) { state = failedLogin(state, 1000); expect(state.failures).toBe(i); expect(state.lockedUntil).toBe(0); }
    state = failedLogin(state, 1000);
    expect(state).toEqual({ failures: 5, lockedUntil: 61000 });
  });
  test("blocks for exactly 60 seconds and resets after expiry", () => {
    const state = failedLogin({ failures: 4, lockedUntil: 0 }, 1000);
    expect(remainingLockSeconds(state, 1000)).toBe(60);
    expect(remainingLockSeconds(state, 60000)).toBe(1);
    expect(remainingLockSeconds(state, 61000)).toBe(0);
    expect(normalizeAttempts(state, 61000)).toEqual(emptyAttempts);
    expect(failedLogin(state, 61000)).toEqual({ failures: 1, lockedUntil: 0 });
  });
  test("an attempted login during cooldown does not extend it", () => {
    expect(failedLogin({ failures: 5, lockedUntil: 61000 }, 30000)).toEqual({ failures: 5, lockedUntil: 61000 });
  });
  test("persisted cooldown remains active after reload", () => {
    expect(normalizeAttempts(JSON.parse(JSON.stringify({ failures: 5, lockedUntil: 61000 })), 10000)).toEqual({ failures: 5, lockedUntil: 61000 });
  });
  test("only invalid credentials count, not network or service failures", () => {
    expect(isInvalidCredentials({ code: "invalid_credentials", message: "Incorrect" })).toBe(true);
    expect(isInvalidCredentials({ message: "Invalid login credentials" })).toBe(true);
    expect(isInvalidCredentials({ code: "over_request_rate_limit", message: "Too many requests" })).toBe(false);
    expect(isInvalidCredentials({ message: "Failed to fetch" })).toBe(false);
  });
});