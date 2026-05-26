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

export const motto = {
  gu: "સેવા · સહકાર · શિસ્ત",
  en: "Service · Cooperation · Discipline",
} as const;

export const salutation = {
  gu: "જય હાટકેશ",
} as const;
