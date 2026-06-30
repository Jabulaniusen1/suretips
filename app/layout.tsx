import type { Metadata } from "next";
import { Urbanist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sureodds Predict — Accurate Football Predictions",
    template: "%s | Sureodds Predict",
  },
  description:
    "Sureodds Predict gives you accurate, transparent football predictions backed by proof — daily odds combos, correct scores, and a track record you can check.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
