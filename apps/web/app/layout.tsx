import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResolveX — Autonomous Customer Incident Intelligence",
  description: "Enterprise Customer Incident Intelligence Platform for Hack Briven 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
