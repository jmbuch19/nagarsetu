// Meta WhatsApp Cloud API — send an OTP via the Authentication template.
//
// Meta's "Authentication" template category is purpose-built for OTPs:
//   • Body is a canned line with the code as the single {{1}} parameter:
//       "*{{1}}* is your verification code. For your security, do not
//        share this code."
//   • A "copy code" button takes the code as the single button parameter
//     so WhatsApp can offer one-tap copy on the recipient's device.
//
// The template name + language + the WABA's phone-number-id + a permanent
// access token come from env. The template MUST be approved by Meta before
// any send works — see WHATSAPP.md for the prep checklist.
//
// Returns a discriminated result so the caller (the Send-SMS hook) can
// translate Meta failures into the right HTTP response to Supabase. We
// NEVER want to return 200 to Supabase if Meta refused — that would let a
// member appear to receive an OTP they never got.

export type WhatsAppSendResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: string; status: number };

export type SendAuthTemplateConfig = {
  graphApiVersion: string;   // e.g. "v21.0"
  phoneNumberId: string;     // numeric, from WhatsApp Manager
  accessToken: string;       // permanent System-User token
  templateName: string;      // e.g. "nagarsetu_otp"
  templateLanguage: string;  // e.g. "en"
};

export async function sendWhatsAppAuthTemplate(args: {
  to: string;                // E.164, no +, e.g. "919876543210"
  otp: string;
  config: SendAuthTemplateConfig;
}): Promise<WhatsAppSendResult> {
  const { to, otp, config } = args;

  const url = `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: otp }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: otp }],
        },
      ],
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      reason: `network error reaching Meta Graph API: ${(err as Error).message}`,
    };
  }

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "<failed to read body>";
    }
    return {
      ok: false,
      status: response.status,
      reason: `Meta Graph API ${response.status}: ${detail.slice(0, 500)}`,
    };
  }

  let payload: { messages?: { id: string }[] };
  try {
    payload = (await response.json()) as { messages?: { id: string }[] };
  } catch {
    return {
      ok: false,
      status: 502,
      reason: "Meta returned non-JSON success body",
    };
  }

  const messageId = payload.messages?.[0]?.id;
  if (!messageId) {
    return {
      ok: false,
      status: 502,
      reason: "Meta success response missing messages[0].id",
    };
  }
  return { ok: true, messageId };
}
