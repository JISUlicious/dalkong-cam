import { createSign } from "node:crypto";

import { config } from "../config.js";

interface ServiceAccount {
  type: "service_account";
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

let cachedServiceAccount: ServiceAccount | null = null;
function getServiceAccount(): ServiceAccount | null {
  if (cachedServiceAccount) return cachedServiceAccount;
  if (!config.FCM_SERVICE_ACCOUNT_JSON) return null;
  try {
    const sa = JSON.parse(config.FCM_SERVICE_ACCOUNT_JSON) as ServiceAccount;
    if (sa.type !== "service_account") return null;
    cachedServiceAccount = sa;
    return sa;
  } catch {
    return null;
  }
}

interface CachedAccessToken {
  token: string;
  expiresAt: number;
}
let cachedToken: CachedAccessToken | null = null;

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const header = { alg: "RS256", typ: "JWT" };
  const headerPart = base64url(Buffer.from(JSON.stringify(header)));
  const payloadPart = base64url(Buffer.from(JSON.stringify(claims)));
  const signingInput = `${headerPart}.${payloadPart}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const sig = base64url(signer.sign(sa.private_key));
  const assertion = `${signingInput}.${sig}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`FCM token exchange failed: ${res.status}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in,
  };
  return data.access_token;
}

export interface FcmMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendFcmV1(msg: FcmMessage): Promise<boolean> {
  const sa = getServiceAccount();
  if (!sa) return false;
  const accessToken = await getAccessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const body = {
    message: {
      token: msg.token,
      notification: { title: msg.title, body: msg.body },
      data: msg.data,
      android: { priority: "HIGH" as const },
      apns: { headers: { "apns-priority": "10" } },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}
