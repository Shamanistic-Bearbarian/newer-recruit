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

          <div className="border-b border-slate-800 bg-slate-900/60">
            <p className="mx-auto max-w-6xl px-4 py-2 text-xs text-slate-400">
              <strong className="text-slate-300">11th edition</strong>: points,
              detachments &amp; enhancements from the official Munitorum Field
              Manual. Datasheets (stats/weapons/abilities) carry over unchanged
              from 10th edition ({META.profileCoveragePct}% mapped); a few
              brand-new 11th-edition units don&apos;t have a datasheet yet.
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
