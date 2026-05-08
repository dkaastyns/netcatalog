import type { Metadata } from "next";
import { Inter_Tight, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Netcatalog — Product Catalog & Inventory",
    template: "%s | Netcatalog",
  },
  description:
    "Enterprise-grade product catalog and inventory management system for network infrastructure equipment.",
  keywords: ["catalog", "inventory", "network", "infrastructure", "management"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${interTight.variable} ${outfit.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
