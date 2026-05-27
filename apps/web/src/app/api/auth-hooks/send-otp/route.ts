// POST /api/auth-hooks/send-otp
//
// Supabase Auth's "Send SMS" hook target — fires every time a phone-OTP
// sign-in is requested (apps/web/src/app/sign-in/page.tsx). We hijack the
// delivery channel and route the OTP via Meta WhatsApp Cloud API instead
// of an SMS provider. See WHATSAPP.md for the full setup checklist.
//
// Configuration (Supabase dashboard → Auth → Hooks → Send SMS):
//   • URL    = https://jayhatkesh.in/api/auth-hooks/send-otp
//   • Method = POST
//   • Secret = (auto-generated, copy to SUPABASE_AUTH_HOOK_SECRET env var)
//
// Test phones declared in supabase/config.toml's [auth.sms.test_otp] block
// SHORT-CIRCUIT this hook entirely — Supabase serves the canned OTP itself
// without calling the SMS provider. That's intentional: it lets the founder
// drive the sign-in UI end-to-end without burning Meta template-send quota
// during development. This hook only fires for real phone numbers.

import { NextResponse } from "next/server";
import { verifySupabaseHookSignature } from "@/lib/auth-hooks/verify-supabase-signature";
import {
  sendWhatsAppAuthTemplate,
  type SendAuthTemplateConfig,
} from "@/lib/whatsapp/send-auth-template";

// Node runtime — we use node:crypto for HMAC. Edge runtime would also work
// via SubtleCrypto, but the Node path is one less moving part.
export const runtime = "nodejs";
// No caching — every request is uniquely signed and timestamped.
export const dynamic = "force-dynamic";

// Shape of Supabase's Send-SMS hook payload (v1).
// Schema: https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
type SendSmsHookPayload = {
  user: { id: string; phone: string };
  sms: { otp: string };
};

type RouteConfig = {
  hookSecret: string;
  whatsapp: SendAuthTemplateConfig;
};

function readConfig(): RouteConfig | { error: string } {
  const missing: string[] = [];
  const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_AUTH_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_AUTH_TEMPLATE_LANG;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;

  if (!hookSecret) missing.push("SUPABASE_AUTH_HOOK_SECRET");
  if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
  if (!phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
  if (!templateName) missing.push("WHATSAPP_AUTH_TEMPLATE_NAME");
  if (!templateLanguage) missing.push("WHATSAPP_AUTH_TEMPLATE_LANG");
  if (!graphApiVersion) missing.push("WHATSAPP_GRAPH_API_VERSION");

  if (missing.length > 0) {
    return { error: `missing env vars: ${missing.join(", ")}` };
  }
  return {
    hookSecret: hookSecret!,
    whatsapp: {
      accessToken: accessToken!,
      phoneNumberId: phoneNumberId!,
      templateName: templateName!,
      templateLanguage: templateLanguage!,
      graphApiVersion: graphApiVersion!,
    },
  };
}

// Supabase expects an error response in this exact shape — the human-
// readable `message` surfaces back through the client SDK as the OTP error.
// Docs: https://supabase.com/docs/guides/auth/auth-hooks#expected-output
function hookError(httpCode: number, message: string) {
  return NextResponse.json(
    { error: { http_code: httpCode, message } },
    { status: httpCode },
  );
}

export async function POST(request: Request) {
  const config = readConfig();
  if ("error" in config) {
    // Fail loud — never silently succeed when delivery is impossible.
    // Log on the server (the route's runtime logs); return a generic
    // message to the client to avoid leaking which var is missing.
    console.error("[send-otp hook] %s", config.error);
    return hookError(500, "OTP delivery channel not configured.");
  }

  // Raw body is what the HMAC was computed over. Do NOT json-parse and
  // re-stringify — whitespace differences would break the signature check.
  const rawBody = await request.text();

  const sigCheck = verifySupabaseHookSignature({
    rawBody,
    webhookId: request.headers.get("webhook-id"),
    webhookTimestamp: request.headers.get("webhook-timestamp"),
    webhookSignature: request.headers.get("webhook-signature"),
    secret: config.hookSecret,
  });
  if (!sigCheck.ok) {
    console.warn("[send-otp hook] signature rejected: %s", sigCheck.reason);
    return hookError(401, "Invalid hook signature.");
  }

  let payload: SendSmsHookPayload;
  try {
    payload = JSON.parse(rawBody) as SendSmsHookPayload;
  } catch {
    return hookError(400, "Malformed hook payload.");
  }
  const phone = payload?.user?.phone;
  const otp = payload?.sms?.otp;
  if (!phone || !otp) {
    return hookError(400, "Hook payload missing user.phone or sms.otp.");
  }

  // Supabase sends `phone` without the leading `+` (E.164 digits only).
  // The Meta Graph API accepts both forms; strip just in case.
  const to = phone.replace(/^\+/, "");

  const send = await sendWhatsAppAuthTemplate({
    to,
    otp,
    config: config.whatsapp,
  });

  if (!send.ok) {
    console.error(
      "[send-otp hook] WhatsApp send failed (%d): %s",
      send.status,
      send.reason,
    );
    // Translate Meta failures into a generic-to-client message — the member
    // shouldn't see Meta error codes, but the server logs do.
    return hookError(500, "Could not send OTP. Please try again.");
  }

  return NextResponse.json({}, { status: 200 });
}

// Anything other than POST = 405. Standard Webhooks only POSTs.
export function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}
