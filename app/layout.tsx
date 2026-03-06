import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";

import { ActionFeedback } from "@/app/components/ui/action-feedback";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Balise-IA Prospect",
  description: "Outil local de suivi commercial pour Balise-IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="dark">
      <body className={`${inter.variable} antialiased`}>
        <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Balise-IA · Lorient Bretagne
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-[#ededed] sm:text-2xl">
                Prospect Studio
              </h1>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/">
                Dashboard
              </Link>
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/leads">
                Tableau
              </Link>
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/pipeline">
                Pipeline
              </Link>
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/activities">
                Activities
              </Link>
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/emails">
                Emails
              </Link>
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/sequences">
                Sequences
              </Link>
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/import">
                Import CSV
              </Link>
              <Link className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900" href="/api-docs">
                API Docs
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <ActionFeedback />
      </body>
    </html>
  );
}
