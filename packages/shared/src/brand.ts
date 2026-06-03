export const brand = {
  primary: "#0E6B6B",
  primaryDark: "#0A4F4F",
  accent: "#E97C1F",
  gold: "#C9A24B",
  bg: "#FBFAF5",
  surface: "#EAF1E7",
  text: "#1E2A2A",
  textMuted: "#5B6B6B",
  border: "#DCE6DD",
  success: "#2E7D52",
  warning: "#D99100",
  danger: "#C2492E",
} as const;

export type BrandToken = keyof typeof brand;

// Product identity. Per MEMORY locked decision: "Jay Hatkesh" is the
// product name everywhere user-facing; "Nagarsetu" is the descriptive
// tagline AND the secular/operational name (Meta WABA, Razorpay KYC,
// search/SEO). Repo folder stays `nagarsetu` (cosmetic only).
export const identity = {
  name: { en: "Jay Hatkesh", gu: "જય હાટકેશ" },
  tagline: { en: "Nagarsetu — bridge of the community", gu: "નાગરસેતુ — સમુદાયનો સેતુ" },
  nameSecular: "Nagarsetu",
  domain: "jayhatkesh.in",
} as const;

export const motto = {
  gu: "સેવા · સહકાર · શિસ્ત",
  en: "Service · Cooperation · Discipline",
} as const;

export const salutation = {
  gu: "જય હાટકેશ",
} as const;

// Project contact addresses — Google Workspace inboxes on the verified
// jayhatkesh.in domain (not personal addresses). Resend sends from the same
// domain (no-reply@); these are the receiving + public contact addresses.
//   • email → general public contact + contact-form recipient
//   • legal → privacy questions, DPDP grievance, data-deletion requests
// (admin@jayhatkesh.in exists for internal ops; not surfaced publicly.)
export const contact = {
  email: "info@jayhatkesh.in",
  legal: "legal@jayhatkesh.in",
} as const;
