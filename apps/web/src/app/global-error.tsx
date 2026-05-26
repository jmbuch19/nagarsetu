"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#FBFAF5",
          color: "#1E2A2A",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Gujarati", sans-serif',
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 1.5rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 300,
              color: "#0E6B6B",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Something went wrong
          </h1>
          <p style={{ marginTop: "1rem", maxWidth: "28rem", fontSize: "0.95rem", color: "#5B6B6B" }}>
            An unexpected error stopped this page from loading. Try again, or head back to Nagarsetu.
          </p>
          {error?.digest && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#5B6B6B" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: "none",
                borderRadius: "0.375rem",
                backgroundColor: "#0E6B6B",
                color: "#FFFFFF",
                padding: "0.5rem 1.5rem",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                borderRadius: "0.375rem",
                border: "1px solid #DCE6DD",
                color: "#1E2A2A",
                padding: "0.5rem 1.5rem",
                textDecoration: "none",
                fontSize: "0.95rem",
              }}
            >
              Back to Nagarsetu
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
