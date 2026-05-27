import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-7xl font-light text-brand-primary tracking-tight">404</h1>
      <p className="mt-4 text-lg text-foreground">Page not found</p>
      <p className="mt-2 max-w-md text-sm text-brand-text-muted">
        The page you were looking for isn&apos;t here. It may have moved, or never existed.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-brand-primary px-6 py-2 text-white transition-colors hover:bg-brand-primary-dark"
      >
        Back to Jay Hatkesh
      </Link>
    </main>
  );
}
