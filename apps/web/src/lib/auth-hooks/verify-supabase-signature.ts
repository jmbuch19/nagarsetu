// Supabase Auth-hook signature verification.
//
// Supabase signs Send-SMS / Send-Email hook requests using the Standard
// Webhooks v1 spec: https://www.standardwebhooks.com/. We need to verify
// every incoming hook so a third party can't POST forged OTPs to our
// public endpoint and get them delivered through our Meta WABA quota.
//
// The shared secret is configured in the Supabase dashboard (Auth → Hooks)
// and stored locally as SUPABASE_AUTH_HOOK_SECRET in the format Supabase
// hands out: `v1,whsec_<base64>`. The bytes after `whsec_` are the HMAC key.
//
// Signed payload (per Standard Webhooks):  `${id}.${timestamp}.${rawBody}`
// Signature header format: `v1,<base64sig> v1,<base64sig2> …`
// (Multiple sigs supported for secret rotation — accept if ANY matches.)
//
// Timestamp skew is rejected at ±5 min to bound replay attacks.

import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SKEW_SECONDS = 5 * 60;

export type SignatureCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

export function verifySupabaseHookSignature(args: {
  rawBody: string;
  webhookId: string | null;
  webhookTimestamp: string | null;
  webhookSignature: string | null;
  secret: string;
}): SignatureCheckResult {
  const { rawBody, webhookId, webhookTimestamp, webhookSignature, secret } =
    args;

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { ok: false, reason: "missing standard-webhooks headers" };
  }

  const tsSeconds = Number(webhookTimestamp);
  if (!Number.isFinite(tsSeconds)) {
    return { ok: false, reason: "non-numeric webhook-timestamp" };
  }
  const skew = Math.abs(Math.floor(Date.now() / 1000) - tsSeconds);
  if (skew > MAX_SKEW_SECONDS) {
    return { ok: false, reason: `timestamp skew ${skew}s exceeds limit` };
  }

  // Secret format `v1,whsec_<base64>`. Tolerate either with or without the
  // `v1,` prefix — the dashboard hands out the full form.
  const keyB64 = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  let key: Buffer;
  try {
    key = Buffer.from(keyB64, "base64");
  } catch {
    return { ok: false, reason: "secret is not valid base64" };
  }
  if (key.length === 0) {
    return { ok: false, reason: "secret decoded to empty bytes" };
  }

  const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expectedSig = createHmac("sha256", key)
    .update(signedPayload)
    .digest("base64");
  const expectedBuf = Buffer.from(expectedSig, "base64");

  // Header may contain space-separated `v1,sig` pairs (secret rotation).
  // Accept if ANY v1 entry matches.
  for (const token of webhookSignature.split(/\s+/)) {
    const m = token.match(/^v1,(.+)$/);
    if (!m) continue;
    const candidate = Buffer.from(m[1], "base64");
    if (candidate.length !== expectedBuf.length) continue;
    if (timingSafeEqual(candidate, expectedBuf)) {
      return { ok: true };
    }
  }

  return { ok: false, reason: "no matching v1 signature" };
}
