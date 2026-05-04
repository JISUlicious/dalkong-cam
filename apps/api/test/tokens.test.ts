import { describe, expect, it } from "vitest";

// Set env BEFORE importing modules that read it.
process.env.NODE_ENV = "test";
process.env.PUBLIC_BASE_URL = "https://test.example";
process.env.DATABASE_URL = "postgres://x:y@localhost/test";
process.env.JWT_ACCESS_SECRET = "x".repeat(32);
process.env.JWT_REFRESH_SECRET = "y".repeat(32);
process.env.EMAIL_VERIFICATION_SECRET = "z".repeat(32);
process.env.EMAIL_FROM = "no-reply@test.example";
process.env.SMTP_URL = "smtp://test";
process.env.MINIO_ENDPOINT = "localhost";
process.env.MINIO_ACCESS_KEY = "x";
process.env.MINIO_SECRET_KEY = "y";
process.env.TURN_REALM = "test";
process.env.TURN_SHARED_SECRET = "t".repeat(32);
process.env.TURN_URLS = "turn:turn.test:3478";
process.env.STUN_URLS = "stun:stun.test:3478";
process.env.CORS_ORIGINS = "https://test.example";

const tokens = await import("../src/auth/tokens.js");

describe("access tokens", () => {
  it("round-trips and rejects tampering", () => {
    const tok = tokens.issueAccessToken({
      id: "u1",
      email: "u1@test",
      emailVerified: true,
    });
    const claims = tokens.verifyAccessToken(tok);
    expect(claims.sub).toBe("u1");
    expect(claims.emailVerified).toBe(true);

    // Flip a character in the signature; should fail.
    const broken = tok.slice(0, -2) + (tok.endsWith("a") ? "b" : "a") + tok.slice(-1);
    expect(() => tokens.verifyAccessToken(broken)).toThrow();
  });

  it("rejects refresh tokens used as access tokens", () => {
    const r = tokens.issueRefreshToken("u1");
    expect(() => tokens.verifyAccessToken(r.token)).toThrow();
  });
});

describe("refresh tokens", () => {
  it("hashes tokens with sha256 (deterministic, same length)", () => {
    const r1 = tokens.issueRefreshToken("u1");
    const r2 = tokens.issueRefreshToken("u1");
    expect(r1.tokenHash).toHaveLength(64);
    expect(r2.tokenHash).toHaveLength(64);
    expect(r1.tokenHash).not.toBe(r2.tokenHash);
    expect(tokens.hashRefreshToken(r1.token)).toBe(r1.tokenHash);
  });
});

describe("email verification token", () => {
  it("round-trips", () => {
    const t = tokens.issueEmailVerificationToken("u1");
    const r = tokens.verifyEmailVerificationToken(t);
    expect(r.sub).toBe("u1");
  });
});
