import argon2 from "argon2";
import zxcvbn from "zxcvbn";

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export interface PasswordPolicyResult {
  ok: boolean;
  reason?: string;
  score?: number;
}

export function checkPasswordPolicy(
  password: string,
  contextInputs: string[] = [],
): PasswordPolicyResult {
  if (password.length < 12) {
    return { ok: false, reason: "Password must be at least 12 characters." };
  }
  if (password.length > 128) {
    return { ok: false, reason: "Password is too long." };
  }
  const result = zxcvbn(password, contextInputs);
  if (result.score < 3) {
    return {
      ok: false,
      reason:
        result.feedback.warning ||
        "Password is too weak. Try a longer passphrase.",
      score: result.score,
    };
  }
  return { ok: true, score: result.score };
}
