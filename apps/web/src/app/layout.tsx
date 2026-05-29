import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { identity } from "@nagarsetu/shared";
import { MemberNav } from "./member-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${identity.name.en} — ${identity.tagline.en}`,
  description:
    "A community platform for the Nagar samaj — directory, listings, magazine, and intelligence. Belonging is free.",
  applicationName: identity.name.en,
  appleWebApp: { capable: true, title: identity.name.en, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0E6B6B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MemberNav />
        {children}
      </body>
    </html>
  );
}
