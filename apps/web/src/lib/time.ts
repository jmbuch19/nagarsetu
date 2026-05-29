// Current time as a module function so callers (e.g. RSCs that filter by
// expiry) don't call the impure `Date.now()` directly in render — that trips
// the react-hooks/purity lint. A server component renders once per request, so
// reading the clock here is intentional.
export function currentMs(): number {
  return Date.now();
}
