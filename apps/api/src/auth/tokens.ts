import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { config } from "../config.js";
import type { JwtAccessPayload } from "@dalkong/shared";

function base64url(input: Buffer | string): string {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string): Buffer {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function signHs256(input: string, secret: string): string {
  return base64url(createHmac("sha256", secret).update(input).digest());
}

interface JwtBase {
  iat: number;
  exp: number;
}

export interface AccessClaims extends JwtBase, JwtAccessPayload {}
export interface RefreshClaims extends JwtBase {
  sub: string;
  jti: string;
  type: "refresh";
}

function encodeJwt(payload: object, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const sig = signHs256(signingInput, secret);
  return `${signingInput}.${sig}`;
}

function decodeAndVerify<T>(token: string, secret: string): T {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [headerPart, payloadPart, sig] = parts as [string, string, string];
  const expected = signHs256(`${headerPart}.${payloadPart}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Bad signature");
  }
  const claims = JSON.parse(fromBase64url(payloadPart).toString("utf8")) as T & JwtBase;
  if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) {
    throw new Error("Token expired");
  }
  return claims;
}

export function issueAccessToken(user: {
  id: string;
  email: string;
  emailVerified: boolean;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: AccessClaims = {
    sub: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    type: "access",
    iat: now,
    exp: now + config.JWT_ACCESS_TTL_SECONDS,
  };
  return encodeJwt(claims, config.JWT_ACCESS_SECRET);
}

export function verifyAccessToken(token: string): AccessClaims {
  const claims = decodeAndVerify<AccessClaims>(token, config.JWT_ACCESS_SECRET);
  if (claims.type !== "access") throw new Error("Wrong token type");
  return claims;
}

export interface RefreshIssued {
  token: string;
  jti: string;
  expiresAt: Date;
  tokenHash: string;
}

export function issueRefreshToken(userId: string): RefreshIssued {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + config.JWT_REFRESH_TTL_SECONDS;
  const jti = randomBytes(16).toString("hex");
  const claims: RefreshClaims = {
    sub: userId,
    jti,
    type: "refresh",
    iat: now,
    exp,
  };
  const token = encodeJwt(claims, config.JWT_REFRESH_SECRET);
  return {
    token,
    jti,
    expiresAt: new Date(exp * 1000),
    tokenHash: hashRefreshToken(token),
  };
}

export function verifyRefreshToken(token: string): RefreshClaims {
  const claims = decodeAndVerify<RefreshClaims>(
    token,
    config.JWT_REFRESH_SECRET,
  );
  if (claims.type !== "refresh") throw new Error("Wrong token type");
  return claims;
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function issueEmailVerificationToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24;
  const payload = { sub: userId, type: "email-verify", iat: now, exp };
  return encodeJwt(payload, config.EMAIL_VERIFICATION_SECRET);
}

export function verifyEmailVerificationToken(token: string): { sub: string } {
  const claims = decodeAndVerify<{ sub: string; type: string } & JwtBase>(
    token,
    config.EMAIL_VERIFICATION_SECRET,
  );
  if (claims.type !== "email-verify") throw new Error("Wrong token type");
  return { sub: claims.sub };
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
