"use client";

import React from "react";
import { BRAND } from "@/lib/data";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const links = ["Shop", "Ingredients", "Science", "Privacy", "Terms", "Instagram"];

  return (
    <footer className="surface border-t border-border-soft py-20 px-6">
      <div className="container-shell flex flex-col items-center">
        <div className="mb-12">
          <Logo />
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-16">
          {links.map((link) => (
            <Link 
              key={link} 
              href={`#${link.toLowerCase()}`}
              className="text-xs font-black uppercase tracking-widest text-muted hover:text-accent transition-colors"
            >
              {link}
            </Link>
          ))}
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted/30">
          © {new Date().getFullYear()} {BRAND.name}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
