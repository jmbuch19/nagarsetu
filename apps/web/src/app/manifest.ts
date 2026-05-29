// PWA web app manifest (Next App Router file convention — auto-linked as
// <link rel="manifest">). Lets members "Add to Home Screen" and launch
// Jay Hatkesh as a standalone app. Icons live in /public/icons.

import type { MetadataRoute } from "next";
import { identity } from "@nagarsetu/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${identity.name.en} — ${identity.tagline.en}`,
    short_name: identity.name.en,
    description: "The digital home of the Nagar samaj — worldwide.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFAF5",
    theme_color: "#0E6B6B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
