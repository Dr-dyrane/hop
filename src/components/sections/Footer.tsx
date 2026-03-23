"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { Globe, ArrowUpRight, Shield } from "lucide-react";

export function Footer() {
  const { brand, navigation } = useMarketingContent();
  const currentYear = new Date().getFullYear();

  const links = [
    ...navigation.map((item) => ({ name: item.label, href: item.href })),
    { name: "Reviews", href: "#social" },
    { name: "Account", href: "/account" },
    { name: "Terms", href: "/terms" },
  ];

  return (
    <footer className="relative pt-40 pb-20 overflow-hidden" id="footer">
      {/* Background Atmosphere: The Final Anchor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] aspect-[2/1] bg-accent/[0.04] rounded-full blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-end pb-32 border-b border-label/[0.03]">
          
          {/* Brand Identity Section */}
          <div className="lg:col-span-5 space-y-12">
            <Logo />
            <div className="space-y-6 max-w-sm">
              <p className="text-xl text-label/30 italic font-light leading-relaxed">
                Elevating human performance through <span className="text-label/60">borderless design</span> and precision nutrition.
              </p>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                <Globe size={14} className="animate-spin-slow" />
                Global Performance Protocol
              </div>
            </div>
          </div>

          {/* Functional Portal: Account Access */}
          <div className="lg:col-span-4">
            <LiquidGlassCard 
              variant="default" 
              intensity="subtle" 
              className="p-8 squircle flex flex-col gap-8 group"
            >
              <div className="flex justify-between items-start">
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-label/20">The Portal</div>
                <div className="w-10 h-10 rounded-full bg-label/5 flex items-center justify-center text-label/40 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="space-y-4 flex flex-col gap-4">
                <h4 className="text-2xl font-headline font-bold text-label">Create Your Profile.</h4>
                <Link
                  href="/account"
                  className="inline-flex h-12 items-center justify-center px-8 rounded-xl button-primary text-system-background text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-[1.05] transition-transform"
                >
                  Join the Ritual
                </Link>
              </div>
            </LiquidGlassCard>
          </div>

          {/* Quick Navigation Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[10px] font-bold uppercase tracking-[0.3em] text-label/30 hover:text-accent transition-colors py-2"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Legal & Meta Info */}
        <div className="mt-20 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.5em] text-label/20 italic">
            <Shield size={12} className="opacity-50" />
            Designed for Performance
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-label/40">
              &copy; {currentYear} {brand.name}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent/40">
              Premium Plant-Based Protocol
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
