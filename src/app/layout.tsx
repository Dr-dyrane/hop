import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "House of Nutrition | Premium Plant Protein",
  description: "Clean plant-based protein designed for gym-focused performance and recovery. Minimal luxury wellness blended with athletic energy.",
  keywords: ["plant protein", "vegan protein", "gym supplements", "clean nutrition", "house of nutrition"],
  authors: [{ name: "House of Nutrition" }],
  openGraph: {
    title: "House of Nutrition",
    description: "Premium Plant Protein for Real Training.",
    url: "https://hon.well",
    siteName: "House of Nutrition",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F2EA" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
