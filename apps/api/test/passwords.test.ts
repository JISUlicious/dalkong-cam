import { describe, expect, it } from "vitest";

import {
  checkPasswordPolicy,
  hashPassword,
  verifyPassword,
} from "../src/auth/passwords.js";

describe("password policy", () => {
  it("rejects short passwords", () => {
    const r = checkPasswordPolicy("short", []);
    expect(r.ok).toBe(false);
  });

  it("rejects passwords too similar to email", () => {
    const r = checkPasswordPolicy("alice@example.com", ["alice@example.com"]);
    expect(r.ok).toBe(false);
  });

  it("rejects 'password123!' style entries", () => {
    const r = checkPasswordPolicy("Password123!", []);
    expect(r.ok).toBe(false);
  });

  it("accepts a long passphrase", () => {
    const r = checkPasswordPolicy(
      "violet-hexagon-driftwood-quartz",
      ["alice@example.com"],
    );
    expect(r.ok).toBe(true);
  });
});

describe("password hashing", () => {
  it("verifies the same password and rejects others", async () => {
    const hash = await hashPassword("violet-hexagon-driftwood-quartz");
    expect(await verifyPassword(hash, "violet-hexagon-driftwood-quartz")).toBe(
      true,
    );
    expect(await verifyPassword(hash, "wrong-password-1234")).toBe(false);
  });

  it("returns false on garbage hash without throwing", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});
