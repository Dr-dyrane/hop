import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import "aos/dist/aos.css";

const sfPro = localFont({
  src: [
    {
      path: "./fonts/SF-Pro-Display-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/SF-Pro-Display-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/SF-Pro-Display-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/SF-Pro-Display-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-pro",
});

export const metadata: Metadata = {
  title: "House of Prax | Engineering Elite Human Performance",
  description: "Advanced plant-based nutrition designed for high-performance longevity. Zero fillers. Pure power. The standard for the modern athlete.",
  keywords: ["plant protein", "vegan performance", "clean fuel", "house of prax", "elite nutrition", "gym recovery", "gut health protein"],
  authors: [{ name: "House of Prax" }],
  metadataBase: new URL("https://houseofprax.shop"),
  openGraph: {
    title: "House of Prax | Pure Performance Nutrition",
    description: "Upgrade your foundation. Clean, plant-powered fuel for real training.",
    url: "https://houseofprax.shop",
    siteName: "House of Prax",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "House of Prax - Clean plant fuel for real training",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House of Prax | Elite Plant Protein",
    description: "The standard for modern athletic nutrition. Zero compromises.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
import { UIProvider } from "@/components/providers/UIProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${sfPro.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UIProvider>{children}</UIProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" ? <Analytics /> : null}
      </body>
    </html>
  );
}
