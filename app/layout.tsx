import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntegrationForge — plain English to working integration",
  description:
    "Describe an automation in plain English and get a working webhook handler plus a flow diagram. Built with Next.js and the Claude API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
