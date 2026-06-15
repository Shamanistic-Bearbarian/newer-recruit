import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BuilderProvider } from "@/lib/useBuilder";
import { META } from "@/data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "newer-recruit — WH40k 11th edition list builder",
  description:
    "Build Warhammer 40,000 (11th edition) army lists. A New Recruit-style builder.",
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
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <BuilderProvider>
          <header className="border-b border-slate-800">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
              <span className="text-lg font-bold tracking-tight">
                newer<span className="text-emerald-400">·</span>recruit
              </span>
              <span className="text-xs text-slate-500">
                WH40k 11th edition list builder
              </span>
            </div>
          </header>

          <div className="border-b border-amber-900/60 bg-amber-950/40">
            <p className="mx-auto max-w-6xl px-4 py-2 text-xs text-amber-300">
              ⚠ 11th edition isn&apos;t released yet. This builder currently uses
              community <strong>10th-edition</strong> data ({META.factionCount}{" "}
              factions, {META.datasheetCount} datasheets, Legends excluded) and
              will switch to 11th-edition data when it&apos;s published.
            </p>
          </div>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
            {children}
          </main>

          <footer className="border-t border-slate-800">
            <p className="mx-auto max-w-6xl px-4 py-3 text-xs text-slate-600">
              Lists are saved in your browser. Fan project, unaffiliated with
              Games Workshop.
            </p>
          </footer>
        </BuilderProvider>
      </body>
    </html>
  );
}
