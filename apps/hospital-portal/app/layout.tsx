import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SAATHI | Hospital Emergency Intake Portal',
  description: 'Real-time Emergency Trauma & Triage Intake System for Hospitals - TechFusion 2026',
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
