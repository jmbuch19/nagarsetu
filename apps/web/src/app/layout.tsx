import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { identity } from "@nagarsetu/shared";
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
