// Profile form constants — shared by the page, the client form, and the
// server action. Kept out of `actions.ts` because a "use server" module may
// only export async functions (these are plain values).

// gender enum mirrors the CHECK constraint on members.gender
// (migration 0004: 'male','female','other','prefer_not_to_say').
export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const GENDER_VALUES: readonly string[] = GENDER_OPTIONS.map(
  (g) => g.value,
);

export const NAME_MAX = 80;
export const BIO_MAX = 600;
// Global from day one (MEMORY geography decision) — accept Indian PINs AND
// diaspora postal codes (US ZIP, UK alphanumeric, etc.), so validate loosely
// rather than locking to a 6-digit Indian PIN.
export const PINCODE_MIN = 3;
export const PINCODE_MAX = 12;
export const PINCODE_RE = /^[A-Za-z0-9 -]+$/;

export const EMAIL_MAX = 254;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Oldest accepted year of birth — guards typos; not a minor/age gate
// (DPDP minor handling is a Phase 1 §8 item).
export const MIN_BIRTH_YEAR = 1900;
