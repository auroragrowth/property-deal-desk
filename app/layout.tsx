import type { Metadata } from "next";
import { Geist, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { PostHogProvider } from "@/lib/analytics/client";
import { CookieBanner } from "@/features/legal/cookie-banner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealDesk",
  description:
    "UK property investor SaaS — find, analyse, and track buy-to-let deals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <PostHogProvider>{children}</PostHogProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
