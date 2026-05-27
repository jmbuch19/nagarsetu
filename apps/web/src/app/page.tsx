import { identity, motto } from "@nagarsetu/shared";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-brand-text-muted uppercase">
        {identity.tagline.en}
      </p>
      <h1 className="mt-3 text-6xl font-light tracking-tight text-brand-primary sm:text-7xl">
        {identity.name.en}
      </h1>
      <p
        className="mt-3 text-3xl font-light text-brand-primary-dark"
        lang="gu"
      >
        {identity.name.gu}
      </p>
      <p
        className="mt-8 text-sm text-brand-text-muted"
        lang="gu"
      >
        {motto.gu}
      </p>
      <p className="mt-1 text-xs text-brand-text-muted">{motto.en}</p>
    </main>
  );
}
