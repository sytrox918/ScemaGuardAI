import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "SchemaGuard AI — Structured Output, Evidence Grounding & Deterministic Gate",
  description:
    "Syntax Error 2026 Local LLM Track: End-to-end extraction pipeline with Qwen3-1.7B, SGLang, and deterministic evidence validation for warranty claims.",
  keywords: [
    "SchemaGuard",
    "SGLang",
    "Qwen3-1.7B",
    "Structured Extraction",
    "Deterministic Gate",
    "Syntax Error 2026",
    "CuratorKIT",
    "AlignTune",
    "AuditKIT",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#08090d] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
