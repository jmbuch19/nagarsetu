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

// Blood groups — mirrors the CHECK on members.blood_group (migration 0021).
export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

// Matrimony — mirrors the CHECKs on members (migration 0036). marital_status is
// declared; the opt-in + "seeking" apply only when single/divorced/widowed.
export const MARITAL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;
export const MARITAL_STATUS_VALUES: readonly string[] =
  MARITAL_STATUS_OPTIONS.map((m) => m.value);
export const MATRIMONY_ELIGIBLE: readonly string[] = [
  "single",
  "divorced",
  "widowed",
];
export const MATRIMONY_SEEKING_OPTIONS = [
  { value: "bride", label: "A bride" },
  { value: "groom", label: "A groom" },
  { value: "companion", label: "A life companion" },
] as const;
export const MATRIMONY_SEEKING_VALUES: readonly string[] =
  MATRIMONY_SEEKING_OPTIONS.map((s) => s.value);

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Oldest accepted year of birth — guards typos; not a minor/age gate
// (DPDP minor handling is a Phase 1 §8 item).
export const MIN_BIRTH_YEAR = 1900;

// ── member_professions editor ───────────────────────────────────────────────
// status mirrors the CHECK on member_professions.status (migration 0004:
// 'current','retired','studying'). Retired expertise still counts; studying
// marks a mentee candidate (SPEC §7.04).
export const PROFESSION_STATUS_OPTIONS = [
  { value: "current", label: "Current" },
  { value: "retired", label: "Retired" },
  { value: "studying", label: "Studying" },
] as const;

export const PROFESSION_STATUS_VALUES: readonly string[] =
  PROFESSION_STATUS_OPTIONS.map((s) => s.value);

// char_length cap mirrors the CHECK on member_professions.expertise_text.
export const EXPERTISE_MAX = 280;
// years_experience CHECK is between 0 and 99 (migration 0004).
export const YEARS_MIN = 0;
export const YEARS_MAX = 99;

// ── member_capabilities editor (the સેવા opt-ins, SPEC §7.04) ────────────────
// kind mirrors the CHECK on member_capabilities.kind (migrations 0004 + 0020).
export const CAPABILITY_KIND_OPTIONS = [
  { value: "expert_guidance", label: "Expert guidance in my field" },
  { value: "mentor", label: "Mentor an aspiring Nagar" },
  {
    value: "volunteer_time",
    label: "Give my time (elder care, companionship, community help)",
  },
  {
    value: "creative",
    label: "Share my creative work (writing, poetry, art, music)",
  },
  { value: "open_to_work", label: "Open to work (part-time / full-time)" },
  { value: "other", label: "Something else I can offer" },
] as const;

export const CAPABILITY_KIND_VALUES: readonly string[] =
  CAPABILITY_KIND_OPTIONS.map((k) => k.value);

// domain + description are free text on member_capabilities (no DB CHECK);
// these caps are app-side guards.
export const DOMAIN_MAX = 80;
export const CAPABILITY_DESC_MAX = 280;
