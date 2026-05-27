// Consent — Terms acceptance + WhatsApp opt-in
//
// Used at the sign-up gate per AGENDA §2. The active Terms version is the
// only one accepted at signup; bumping this string forces re-acceptance
// (re-acceptance flow is deferred — see migration 0014 comments).

export const TERMS_VERSION = "v1.0" as const;

export type ConsentPayload = {
  /** True when the member explicitly opted in to WhatsApp business messages. */
  opt_in_whatsapp: boolean;
  /** ISO 8601 timestamp of Terms acceptance. */
  terms_accepted_at: string;
  /** Terms version the member accepted (must match TERMS_VERSION). */
  terms_version: string;
};

/** Build a fresh consent payload to pass to supabase.auth.signInWithOtp(). */
export function buildConsentPayload(optInWhatsapp: boolean): ConsentPayload {
  return {
    opt_in_whatsapp: optInWhatsapp,
    terms_accepted_at: new Date().toISOString(),
    terms_version: TERMS_VERSION,
  };
}
