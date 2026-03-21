"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";

export function Footer() {
  const { brand, navigation } = useMarketingContent();
  const links = [
    ...navigation.map((item) => ({ name: item.label, href: item.href })),
    { name: "Reviews", href: "#social" },
    { name: "Account", href: "/account" },
  ];

  return (
    <footer className="relative surface px-6 py-32" id="footer">
      <div className="container-shell flex flex-col items-center">
        <div className="mb-16">
          <Logo />
        </div>

        <div className="mb-20 flex flex-wrap justify-center gap-x-12 gap-y-6">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label opacity-60 transition-colors hover:text-accent"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="mb-20 flex flex-col items-center gap-4">
          <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label opacity-50">
            Portal
          </div>
          <Link
            href="/account"
            className="button-primary min-h-[48px] px-6 text-[10px] font-semibold uppercase tracking-headline"
          >
            Create Account
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-[9px] font-semibold uppercase tracking-tightest text-secondary-label opacity-20">
            Copyright {new Date().getFullYear()} {brand.name}. Designed for
            Performance.
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-tightest text-accent opacity-40">
            Premium Plant-Based Nutrition
          </div>
        </div>
      </div>
    </footer>
  );
}
