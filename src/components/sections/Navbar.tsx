"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { NAVIGATION } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-6",
        isScrolled 
          ? "py-4 bg-background/80 backdrop-blur-md border-b border-border-soft" 
          : "bg-transparent"
      )}
    >
      <div className="container-shell flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-12">
          {NAVIGATION.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold uppercase tracking-widest text-muted hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Action Button & Theme Toggle */}
        <div className="flex items-center space-x-4">
           <ThemeToggle />
           <Link 
            href="#shop" 
            className="button-primary min-h-[44px] px-8 text-xs font-black uppercase tracking-[0.2em]"
           >
            Get HON
           </Link>
        </div>
      </div>
    </motion.nav>
  );
}
