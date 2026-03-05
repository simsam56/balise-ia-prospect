import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "Balise-IA Prospect",
  description: "Outil local de prospection B2B pour Balise-IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,transparent,transparent_24px,rgba(148,163,184,0.06)_24px,rgba(148,163,184,0.06)_25px)] bg-[size:25px_25px]" />
        <header className="sticky top-0 z-20 border-b border-white/40 bg-white/78 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Balise-IA · Lorient Bretagne
              </p>
              <h1 className="font-[var(--font-space)] text-xl font-semibold text-slate-900 sm:text-2xl">
                Prospect Studio
              </h1>
            </div>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-900/5" href="/leads">
                Leads
              </Link>
              <Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-900/5" href="/import">
                Import CSV
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
