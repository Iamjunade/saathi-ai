import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SAATHI | Emergency Operations Command Center',
  description: 'Live Incident Map, Case State Machine & Telemetry Dashboard - TechFusion 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen text-slate-100">{children}</body>
    </html>
  );
}
