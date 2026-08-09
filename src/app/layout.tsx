import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ReportProblemButton from "@/components/ReportProblemButton";
import { PRODUCTION_SITE_URL } from "@/lib/siteUrl";
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
  // Always the real production origin, deliberately not environment-aware
  // (unlike SITE_URL, used for Stripe/auth redirect links) — canonical URLs
  // and relative metadata resolution must point at the one authoritative
  // production URL for every page's content, regardless of which
  // environment (local dev, staging) is actually serving the request. If a
  // staging deployment is ever crawled by accident, it should still
  // advertise the production URL as canonical, not itself.
  metadataBase: new URL(PRODUCTION_SITE_URL),
  title: "ONP - Our Next Project",
  description: "A transparent, controlled bidding platform for homeowners and contractors.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        {children}
        <ReportProblemButton />
      </body>
    </html>
  );
}
