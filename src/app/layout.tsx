import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seeking Echo - T18 Matriline Whale Tracking",
  description: "Interactive visualization of T18 matriline Bigg's killer whales in the Salish Sea region",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
} 