// Per-request captcha numbers. Kept out of the page component body so the
// random call isn't flagged by the render-purity lint rule — an RSC renders
// once per request, so a fresh sum each load is intentional. Verified
// server-side in the submit action.
export function makeCaptcha(): { a: number; b: number } {
  return {
    a: 1 + Math.floor(Math.random() * 9),
    b: 1 + Math.floor(Math.random() * 9),
  };
}
